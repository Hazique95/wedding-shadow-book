import { renderWeeklyGigDigestHtml } from "@/emails/weekly-gig-digest";
import type { NotificationJobPayload } from "@/lib/notifications/types";

function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  };
}

function getSendGridConfig() {
  return {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL,
    fromName: process.env.SENDGRID_FROM_NAME ?? "Wedding Shadow Book",
  };
}

export async function sendSmsNotification(to: string, templateKey: string, payload: NotificationJobPayload) {
  const { accountSid, authToken, fromNumber } = getTwilioConfig();

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio SMS env vars are incomplete.");
  }

  const body =
    templateKey === "shadow_activation"
      ? `Primary failed - you're up! ${payload.vendorName ?? "Shadow vendor"}, head to ${payload.venueLabel ?? "the venue"} on ${payload.dateLabel ?? "the event date"}.`
      : `Shadow ${payload.vendorName ?? "vendor"} locked for ${payload.dateLabel ?? "your event"} @ ${payload.venueLabel ?? "the venue"}.`;

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio send failed: ${errorText}`);
  }
}

export async function sendDigestEmail(to: string, subject: string, payload: NotificationJobPayload) {
  const { apiKey, fromEmail, fromName } = getSendGridConfig();

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid email env vars are incomplete.");
  }

  const html = renderWeeklyGigDigestHtml({
    vendorName: payload.vendorName ?? "Vendor",
    weekLabel: payload.weekLabel ?? "this week",
    gigs: payload.gigs ?? [],
  });

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: to }],
          subject,
        },
      ],
      from: {
        email: fromEmail,
        name: fromName,
      },
      content: [
        {
          type: "text/html",
          value: html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid send failed: ${errorText}`);
  }
}