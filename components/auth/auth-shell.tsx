import Link from "next/link";

import { HeartHandshakeIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  alternateLabel: string;
  alternateHref: string;
  alternateCta: string;
  children: React.ReactNode;
};

export function AuthShell({
  title,
  description,
  alternateLabel,
  alternateHref,
  alternateCta,
  children,
}: AuthShellProps) {
  return (
    <main className="section-shell flex min-h-[calc(100vh-8rem)] items-center py-10 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/50 bg-white/70 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/7">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 via-pink-500 to-amber-300 text-white shadow-lg shadow-rose-300/40">
              <HeartHandshakeIcon className="size-5" />
            </div>
            <div>
              <div className="font-heading text-2xl leading-none">Wedding Shadow Book</div>
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Rescue-ready onboarding</div>
            </div>
          </div>

          <h1 className="mt-6 font-heading text-5xl leading-none text-balance sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            {alternateLabel}{" "}
            <Link href={alternateHref} className="font-medium text-primary underline-offset-4 hover:underline">
              {alternateCta}
            </Link>
          </p>
        </div>

        <Card className="border-white/45 bg-white/82 shadow-[0_36px_100px_-50px_rgba(112,50,64,0.45)] dark:border-white/10 dark:bg-white/7">
          <CardContent className="p-6 sm:p-8">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
