"use client";

import { DayPicker } from "react-day-picker";

type AvailabilityCalendarProps = {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
};

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function AvailabilityCalendar({
  selectedDates,
  onChange,
}: AvailabilityCalendarProps) {
  const selected = selectedDates.map((entry) => new Date(`${entry}T00:00:00`));

  return (
    <div className="vendor-calendar-shell rounded-[1.75rem] border border-border bg-background/70 p-4 dark:bg-white/5">
      <DayPicker
        mode="multiple"
        selected={selected}
        onSelect={(dates) =>
          onChange(
            (dates ?? [])
              .map((date) => toIsoDate(date))
              .sort()
          )
        }
        className="vendor-day-picker"
        classNames={{
          months: "flex justify-center",
          month: "space-y-4",
          caption: "flex items-center justify-between gap-2 px-1",
          caption_label: "text-sm font-medium",
          nav: "flex items-center gap-2",
          button_previous:
            "inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:border-primary/30 dark:bg-white/5",
          button_next:
            "inline-flex size-9 items-center justify-center rounded-full border border-border bg-background/80 text-foreground transition hover:border-primary/30 dark:bg-white/5",
          weekday:
            "text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground",
          day: "h-10 w-10 rounded-2xl text-sm transition hover:bg-primary/10",
          selected:
            "bg-linear-to-br from-primary to-amber-300 text-white hover:bg-linear-to-br hover:from-primary hover:to-amber-300",
          today: "border border-primary/30 text-primary",
          outside: "text-muted-foreground/45",
        }}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Click a day to toggle availability. Selected dates are exported to the ICS file.
      </p>
    </div>
  );
}
