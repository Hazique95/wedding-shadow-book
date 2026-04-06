import * as React from "react";

type WeeklyGigDigestEmailProps = {
  vendorName: string;
  weekLabel: string;
  gigs: Array<{
    id: string;
    title: string;
    date: string;
    venue: string;
    status: string;
    payoutLabel: string;
  }>;
};

const shellStyle: React.CSSProperties = {
  backgroundColor: "#fff7f6",
  color: "#2f2430",
  fontFamily: "Arial, sans-serif",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  maxWidth: "640px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "24px",
  border: "1px solid #f1dfd6",
  padding: "32px",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#f9d9c2",
  color: "#8b5e3c",
  fontSize: "12px",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  borderRadius: "999px",
  padding: "8px 12px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "24px",
};

const cellStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 0",
  borderBottom: "1px solid #f4ebe6",
  fontSize: "14px",
  verticalAlign: "top",
};

export function WeeklyGigDigestEmail({ vendorName, weekLabel, gigs }: WeeklyGigDigestEmailProps) {
  return (
    <html>
      <body style={shellStyle}>
        <div style={cardStyle}>
          <span style={badgeStyle}>Weekly digest</span>
          <h1 style={{ fontSize: "32px", lineHeight: 1.1, marginTop: "18px", marginBottom: "12px" }}>
            {vendorName}, here&apos;s your week ahead.
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#6c5b65", margin: 0 }}>
            Upcoming gigs and backup bookings for {weekLabel}, all in one place.
          </p>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...cellStyle, fontSize: "12px", color: "#8d7a84", textTransform: "uppercase", letterSpacing: "0.15em" }}>Gig</th>
                <th style={{ ...cellStyle, fontSize: "12px", color: "#8d7a84", textTransform: "uppercase", letterSpacing: "0.15em" }}>Venue</th>
                <th style={{ ...cellStyle, fontSize: "12px", color: "#8d7a84", textTransform: "uppercase", letterSpacing: "0.15em" }}>Status</th>
                <th style={{ ...cellStyle, fontSize: "12px", color: "#8d7a84", textTransform: "uppercase", letterSpacing: "0.15em" }}>Payout</th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((gig) => (
                <tr key={gig.id}>
                  <td style={cellStyle}>
                    <div style={{ fontWeight: 700 }}>{gig.title}</div>
                    <div style={{ color: "#6c5b65", marginTop: "4px" }}>{gig.date}</div>
                  </td>
                  <td style={cellStyle}>{gig.venue}</td>
                  <td style={cellStyle}>{gig.status}</td>
                  <td style={cellStyle}>{gig.payoutLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ marginTop: "24px", fontSize: "14px", lineHeight: 1.7, color: "#6c5b65" }}>
            Keep your availability current so planners can route last-minute backups your way without the usual chaos.
          </p>
        </div>
      </body>
    </html>
  );
}

export function renderWeeklyGigDigestHtml({ vendorName, weekLabel, gigs }: WeeklyGigDigestEmailProps) {
  const rows = gigs
    .map(
      (gig) => `
        <tr>
          <td style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:14px;vertical-align:top;">
            <div style="font-weight:700;">${gig.title}</div>
            <div style="color:#6c5b65;margin-top:4px;">${gig.date}</div>
          </td>
          <td style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:14px;vertical-align:top;">${gig.venue}</td>
          <td style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:14px;vertical-align:top;">${gig.status}</td>
          <td style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:14px;vertical-align:top;">${gig.payoutLabel}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
  <body style="background-color:#fff7f6;color:#2f2430;font-family:Arial, sans-serif;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background-color:#ffffff;border-radius:24px;border:1px solid #f1dfd6;padding:32px;">
      <span style="display:inline-block;background-color:#f9d9c2;color:#8b5e3c;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;border-radius:999px;padding:8px 12px;">Weekly digest</span>
      <h1 style="font-size:32px;line-height:1.1;margin-top:18px;margin-bottom:12px;">${vendorName}, here's your week ahead.</h1>
      <p style="font-size:16px;line-height:1.7;color:#6c5b65;margin:0;">Upcoming gigs and backup bookings for ${weekLabel}, all in one place.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:12px;color:#8d7a84;text-transform:uppercase;letter-spacing:0.15em;">Gig</th>
            <th style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:12px;color:#8d7a84;text-transform:uppercase;letter-spacing:0.15em;">Venue</th>
            <th style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:12px;color:#8d7a84;text-transform:uppercase;letter-spacing:0.15em;">Status</th>
            <th style="text-align:left;padding:12px 0;border-bottom:1px solid #f4ebe6;font-size:12px;color:#8d7a84;text-transform:uppercase;letter-spacing:0.15em;">Payout</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:24px;font-size:14px;line-height:1.7;color:#6c5b65;">Keep your availability current so planners can route last-minute backups your way without the usual chaos.</p>
    </div>
  </body>
</html>`;
}