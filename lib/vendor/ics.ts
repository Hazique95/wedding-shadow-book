import type { VendorAvailability } from "@/lib/vendor/types";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function formatUtcDate(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function buildAvailabilityIcs(name: string, availability: VendorAvailability) {
  const events = availability.selectedDates
    .sort()
    .map((date, index) => {
      const eventDate = new Date(`${date}T00:00:00Z`);
      const nextDate = new Date(eventDate);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);

      return [
        "BEGIN:VEVENT",
        `UID:${name.replace(/\s+/g, "-").toLowerCase()}-${index}@weddingshadowbook.com`,
        `DTSTAMP:${formatUtcDate(new Date())}T000000Z`,
        `DTSTART;VALUE=DATE:${formatUtcDate(eventDate)}`,
        `DTEND;VALUE=DATE:${formatUtcDate(nextDate)}`,
        `SUMMARY:${name} availability`,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Shadow Book//Vendor Availability//EN",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}
