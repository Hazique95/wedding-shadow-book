import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="space-y-6">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-44 w-full rounded-[2rem]" />
          <Skeleton className="h-44 w-full rounded-[2rem]" />
          <Skeleton className="h-44 w-full rounded-[2rem]" />
        </div>
      </div>
    </main>
  );
}
