"use client";

import { CircleDollarSignIcon, LoaderCircleIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CurrencyCode } from "@/lib/auth-types";

type StripeConnectCardProps = {
  accountId: string | null;
  country: "US" | "PK" | null;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  preferredCurrency: CurrencyCode;
};

export function StripeConnectCard({
  accountId,
  country,
  onboardingComplete,
  payoutsEnabled,
  preferredCurrency,
}: StripeConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleConnect() {
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Failed to launch Stripe onboarding.");
      }

      window.location.assign(payload.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to launch Stripe onboarding.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-[1.75rem] border border-border bg-background/70 dark:bg-white/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <CircleDollarSignIcon className="size-4 text-primary" />
              Stripe Connect payouts
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Connect a vendor payout account so planner escrow payments can split 90% to you and 10% to the app fee automatically.
            </p>
          </div>
          <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
            {payoutsEnabled ? "Ready" : onboardingComplete ? "Reviewing" : "Setup needed"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
            <div className="text-muted-foreground">Account</div>
            <div className="mt-1 font-semibold">{accountId ?? "Not connected"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
            <div className="text-muted-foreground">Country</div>
            <div className="mt-1 font-semibold">{country ?? "US / PK supported"}</div>
          </div>
          <div className="rounded-2xl border border-border bg-background/80 p-3 dark:bg-white/6">
            <div className="text-muted-foreground">Display currency</div>
            <div className="mt-1 font-semibold">{preferredCurrency}</div>
          </div>
        </div>

        <Button type="button" className="mt-5 rounded-full" onClick={handleConnect} disabled={isLoading}>
          {isLoading ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
          {isLoading ? "Opening Stripe..." : payoutsEnabled ? "Refresh Stripe onboarding" : "Connect Stripe payouts"}
        </Button>
      </CardContent>
    </Card>
  );
}