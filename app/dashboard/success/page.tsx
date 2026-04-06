import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fromMinorUnit, formatMoney, normalizeCurrency } from "@/lib/currency";
import { getCurrentAuthState } from "@/lib/auth-state";
import { retrieveCheckoutSession } from "@/lib/stripe/server";

export default async function DashboardSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login?next=/dashboard/success");
  }

  const { session: sessionId } = await searchParams;

  if (!sessionId) {
    redirect("/dashboard");
  }

  const session = await retrieveCheckoutSession(sessionId);

  if (session.metadata?.planner_user_id !== user.id) {
    redirect("/dashboard");
  }

  const currency = normalizeCurrency(session.currency?.toUpperCase(), profile?.currency ?? "USD");
  const amount = fromMinorUnit(session.amount_total ?? 0, currency);

  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
          Stripe Checkout success
        </Badge>
        <h1 className="mt-5 font-heading text-5xl leading-none sm:text-6xl">Escrow payment received.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Your booking payment is complete, and the dashboard will reflect the paid escrow once the Stripe webhook marks the session as settled.
        </p>

        <Card className="mt-8 border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
          <CardContent className="grid gap-4 p-6">
            <div className="rounded-2xl border border-border bg-background/80 p-4 dark:bg-white/6">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Session</div>
              <div className="mt-2 font-medium">{session.id}</div>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4 dark:bg-white/6">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Amount paid</div>
              <div className="mt-2 text-2xl font-semibold">{formatMoney(amount, currency)}</div>
            </div>
            <div className="rounded-2xl border border-border bg-background/80 p-4 dark:bg-white/6">
              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Payment status</div>
              <div className="mt-2 font-medium capitalize">{session.payment_status ?? "unpaid"}</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/dashboard/events">Book another vendor</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}