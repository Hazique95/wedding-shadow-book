import { NextResponse } from "next/server";

import { processNotificationQueue } from "@/lib/notifications/queue";

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
    const result = await processNotificationQueue();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process notification queue." },
      { status: 500 }
    );
  }
}