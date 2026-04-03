import { Skeleton } from "@/components/ui/skeleton";

export default function LoginLoading() {
  return (
    <main className="section-shell flex min-h-[calc(100vh-8rem)] items-center py-10 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-20 w-full max-w-xl" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </div>
        <Skeleton className="h-[28rem] w-full rounded-[2rem]" />
      </div>
    </main>
  );
}
