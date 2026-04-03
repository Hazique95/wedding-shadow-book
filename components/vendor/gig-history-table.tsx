"use client";

import { ArrowDownUpIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { VendorGigRecord } from "@/lib/vendor/types";

type GigHistoryTableProps = {
  gigs: VendorGigRecord[];
};

type SortField = "event_date" | "event_name" | "status" | "payout_amount";

const PAGE_SIZE = 5;

export function GigHistoryTable({ gigs }: GigHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField>("event_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const next = [...gigs];
    next.sort((left, right) => {
      const a = left[sortField] ?? "";
      const b = right[sortField] ?? "";

      if (a < b) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (a > b) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });
    return next;
  }, [gigs, sortDirection, sortField]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const currentRows = sorted.slice(start, start + PAGE_SIZE);

  function updateSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "event_date" ? "desc" : "asc");
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-background/70 dark:bg-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              {[
                ["event_name", "Event"],
                ["event_date", "Date"],
                ["status", "Status"],
                ["payout_amount", "Payout"],
              ].map(([field, label]) => (
                <th key={field} className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                    onClick={() => updateSort(field as SortField)}
                  >
                    {label}
                    <ArrowDownUpIcon className="size-3.5" />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Client</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No gig history yet.
                </td>
              </tr>
            ) : (
              currentRows.map((gig) => (
                <tr key={gig.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-medium">{gig.event_name}</td>
                  <td className="px-4 py-3">{gig.event_date}</td>
                  <td className="px-4 py-3 capitalize">{gig.status.replace("_", " ")}</td>
                  <td className="px-4 py-3">{gig.payout_amount ? `PKR ${gig.payout_amount}` : "-"}</td>
                  <td className="px-4 py-3">{gig.client_name ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-sm text-muted-foreground">
        <span>
          Page {page} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon className="size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
