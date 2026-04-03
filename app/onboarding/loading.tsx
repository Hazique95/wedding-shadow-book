import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-[34rem] w-full rounded-[2rem]" />
      </div>
    </main>
  );
}
