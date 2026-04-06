import { captureServerException } from "@/lib/monitoring/sentry";
import { sendDigestEmail, sendSmsNotification } from "@/lib/notifications/providers";
import { getNotificationRetryDate } from "@/lib/notifications/retry";
import type { NotificationChannel, NotificationJobPayload, NotificationTemplateKey } from "@/lib/notifications/types";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

type QueueNotificationJobInput = {
  userId?: string | null;
  bookingId?: string | null;
  channel: NotificationChannel;
  templateKey: NotificationTemplateKey;
  recipient: string;
  payload: NotificationJobPayload;
  maxAttempts?: number;
};

type DueNotificationJob = {
  id: string;
  channel: NotificationChannel;
  template_key: NotificationTemplateKey;
  recipient: string;
  payload: NotificationJobPayload;
  attempts: number;
  max_attempts: number;
};

function getAdminOrThrow(explicit?: AdminClient | null) {
  const admin = explicit ?? createAdminClient();

  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return admin;
}

export async function createInAppNotification(
  input: {
    userId: string;
    kind: string;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  },
  explicitAdmin?: AdminClient | null
) {
  const admin = getAdminOrThrow(explicitAdmin);
  const { error } = await admin.from("user_notifications").insert({
    user_id: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    metadata: input.metadata ?? {},
  } as never);

  if (error) {
    throw error;
  }
}

export async function queueNotificationJob(input: QueueNotificationJobInput, explicitAdmin?: AdminClient | null) {
  if (!input.recipient.trim()) {
    return;
  }

  const admin = getAdminOrThrow(explicitAdmin);
  const { error } = await admin.from("notification_jobs").insert({
    user_id: input.userId ?? null,
    booking_id: input.bookingId ?? null,
    channel: input.channel,
    template_key: input.templateKey,
    recipient: input.recipient.trim(),
    payload: input.payload,
    max_attempts: input.maxAttempts ?? 5,
  } as never);

  if (error) {
    throw error;
  }
}

async function sendJob(job: DueNotificationJob) {
  if (job.channel === "sms") {
    await sendSmsNotification(job.recipient, job.template_key, job.payload);
    return;
  }

  if (job.template_key === "weekly_gig_digest") {
    await sendDigestEmail(job.recipient, `Your weekly wedding gigs | ${job.payload.weekLabel ?? "Upcoming"}`, job.payload);
    return;
  }

  throw new Error(`Unsupported email template: ${job.template_key}`);
}

export async function processNotificationQueue(options?: { limit?: number; admin?: AdminClient | null }) {
  const admin = getAdminOrThrow(options?.admin ?? null);
  const limit = options?.limit ?? 10;
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("notification_jobs")
    .select("id, channel, template_key, recipient, payload, attempts, max_attempts")
    .in("status", ["queued", "failed"])
    .lte("next_attempt_at", now)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  let sent = 0;
  let failed = 0;

  for (const row of (data ?? []) as DueNotificationJob[]) {
    const nextAttempt = row.attempts + 1;

    await admin.from("notification_jobs").update({ status: "processing", attempts: nextAttempt } as never).eq("id", row.id);

    try {
      await sendJob(row);
      sent += 1;
      await admin
        .from("notification_jobs")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null } as never)
        .eq("id", row.id);
    } catch (error) {
      failed += 1;
      await captureServerException(error, {
        route: "notification-queue",
        notificationJobId: row.id,
        channel: row.channel,
        templateKey: row.template_key,
      });

      const canRetry = nextAttempt < row.max_attempts;
      await admin
        .from("notification_jobs")
        .update({
          status: "failed",
          last_error: error instanceof Error ? error.message : "Notification send failed.",
          next_attempt_at: canRetry ? getNotificationRetryDate(nextAttempt).toISOString() : null,
        } as never)
        .eq("id", row.id);
    }
  }

  return {
    sent,
    failed,
    processed: sent + failed,
  };
}