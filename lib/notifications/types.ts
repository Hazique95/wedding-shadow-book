export type NotificationChannel = "sms" | "email";
export type NotificationJobStatus = "queued" | "processing" | "sent" | "failed";

export type NotificationTemplateKey = "booking_shadow_locked" | "shadow_activation" | "weekly_gig_digest";

export type NotificationJobPayload = {
  vendorName?: string;
  dateLabel?: string;
  venueLabel?: string;
  weekLabel?: string;
  gigs?: Array<{
    id: string;
    title: string;
    date: string;
    venue: string;
    status: string;
    payoutLabel: string;
  }>;
};

export type UserNotificationRecord = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};