import { NextResponse } from "next/server";

import { processNotificationQueue } from "@/lib/notifications/queue";
import { queueWeeklyGigDigestEmails } from "@/lib/notifications/service";

function isAuthorized(request: Request) {
  const configured = process.env.NOTIFICATIONS_CRON_SECRET;

  if (!configured) {
    return true;
  }

  return request.headers.get("x-cron-secret") === configured;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { vendorUserIds?: string[] };
    const queueResult = await queueWeeklyGigDigestEmails({ vendorUserIds: body.vendorUserIds });
    const processResult = await processNotificationQueue();

    return NextResponse.json({
      queued: queueResult.queued,
      processed: processResult.processed,
      sent: processResult.sent,
      failed: processResult.failed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to queue weekly digest emails." },
      { status: 500 }
    );
  }
}