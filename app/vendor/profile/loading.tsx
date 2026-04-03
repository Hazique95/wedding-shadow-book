import { Skeleton } from "@/components/ui/skeleton";

export default function VendorProfileLoading() {
  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-80" />
        <Skeleton className="h-5 w-full max-w-3xl" />
        <Skeleton className="h-[48rem] w-full rounded-[2rem]" />
      </div>
    </main>
  );
}
