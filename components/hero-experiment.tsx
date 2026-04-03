"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowRightIcon, BeakerIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { startTransition, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const DemoDialog = dynamic(() => import("@/components/demo-dialog"));

const variants = {
  urgency: {
    pill: "Variant A: urgency",
    helper:
      "Lead with panic prevention and reassure planners that one click can rescue the entire event stack before guests notice.",
    microcopy: "Most teams activate this when they are 72 hours from setup.",
  },
  reassurance: {
    pill: "Variant B: reassurance",
    helper:
      "Lead with calm, premium coverage and position the product as event-day insurance for planners who never want to look surprised.",
    microcopy: "Ideal for couples and venues who want confidence before contracts get shaky.",
  },
} as const;

type HeroExperimentProps = {
  demoVideoUrl: string;
  stripeSignupUrl: string;
};

function getSignupHref(baseUrl: string, variant: keyof typeof variants) {
  if (baseUrl.startsWith("#")) {
    return baseUrl;
  }

  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}ab=${variant}`;
}

export function HeroExperiment({
  demoVideoUrl,
  stripeSignupUrl,
}: HeroExperimentProps) {
  const [variant, setVariant] = useState<keyof typeof variants>("urgency");

  const content = useMemo(() => variants[variant], [variant]);

  return (
    <section className="section-shell pt-8 sm:pt-10">
      <div className="glass-panel relative overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-r from-rose-300/40 via-transparent to-amber-200/35 blur-3xl dark:from-rose-500/16 dark:to-amber-300/12" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative">
            <Badge className="rounded-full bg-white/85 px-3 py-1 text-primary shadow-sm dark:bg-white/10">
              AI vendor backups for planners and venues
            </Badge>
            <h1 className="mt-5 max-w-3xl font-heading text-5xl leading-none text-balance sm:text-6xl lg:text-7xl">
              End Wedding Vendor No-Shows Forever
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              AI backups in 1-click - your event insurance.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-full bg-gradient-to-r from-primary via-rose-500 to-amber-400 px-6 text-sm text-white shadow-lg shadow-primary/30 hover:opacity-95"
              >
                <a href={getSignupHref(stripeSignupUrl, variant)}>
                  Start Free Trial
                  <ArrowRightIcon className="size-4" />
                </a>
              </Button>
              <DemoDialog videoUrl={demoVideoUrl} />
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{content.microcopy}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/50 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/7">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Coverage</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheckIcon className="size-4 text-primary" />
                  Photo, florals, transport, beauty
                </div>
              </div>
              <div className="rounded-3xl border border-white/50 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/7">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Response</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <SparklesIcon className="size-4 text-primary" />
                  AI-ranked backups in under 90 seconds
                </div>
              </div>
              <div className="rounded-3xl border border-white/50 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/7">
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Finance</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <BeakerIcon className="size-4 text-primary" />
                  Escrow-safe payout approvals
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-rose-300/35 blur-3xl dark:bg-rose-500/16" />
            <div className="absolute bottom-6 right-0 h-40 w-40 rounded-full bg-amber-200/35 blur-3xl dark:bg-amber-300/12" />

            <div className="relative rounded-[2rem] border border-white/55 bg-white/84 p-4 shadow-[0_36px_120px_-48px_rgba(127,44,73,0.55)] backdrop-blur dark:border-white/10 dark:bg-[#241721]/85">
              <div className="rounded-[1.6rem] border border-white/50 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 dark:border-white/10 dark:from-rose-950/45 dark:via-[#1f1722] dark:to-amber-950/25">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Hero CTA experiment
                    </div>
                    <div className="mt-2 font-semibold text-foreground">{content.pill}</div>
                  </div>
                  <Switch
                    checked={variant === "reassurance"}
                    onCheckedChange={(checked) => {
                      startTransition(() => {
                        setVariant(checked ? "reassurance" : "urgency");
                      });
                    }}
                    aria-label="Toggle CTA experiment variant"
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {content.helper}
                </p>

                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-primary/10 bg-background/90 shadow-inner">
                  <Image
                    src="/dashboard-preview.svg"
                    alt="Wedding Shadow Book backup dashboard preview"
                    width={1600}
                    height={1200}
                    className="h-auto w-full"
                    priority
                    sizes="(max-width: 1024px) 100vw, 42vw"
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-primary/10 bg-primary/6 p-4 dark:bg-white/6">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Trigger logic
                    </div>
                    <p className="mt-2 text-sm leading-6">
                      Weather alerts, unread vendor texts, low deposit confidence, and late ETA pings.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/10 bg-primary/6 p-4 dark:bg-white/6">
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Shadow response
                    </div>
                    <p className="mt-2 text-sm leading-6">
                      AI ranks backups by fit, reliability, travel time, and escrow status in one view.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
