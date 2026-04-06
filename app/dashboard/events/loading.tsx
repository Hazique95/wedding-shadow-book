import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardEventsLoading() {
  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-16 w-full max-w-3xl" />
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <Skeleton className="h-[640px] w-full rounded-[2rem]" />
          <Skeleton className="h-[640px] w-full rounded-[2rem]" />
        </div>
      </div>
    </main>
  );
}