import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon, CalendarRangeIcon } from "lucide-react";

import { EventsDashboard } from "@/components/events/events-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentAuthState, isProfileComplete } from "@/lib/auth-state";

export default async function DashboardEventsPage() {
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login?next=/dashboard/events");
  }

  if (!isProfileComplete(profile)) {
    redirect("/onboarding");
  }

  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
            Event matching dashboard
          </Badge>
          <h1 className="mt-5 font-heading text-5xl leading-none sm:text-6xl">
            Build a backup-ready event.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
            Search nearby vendors by services, availability overlap, and risk score, then book primary and shadow coverage from one planner screen.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard">
            <ArrowLeftIcon className="size-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      {profile?.role !== "planner" ? (
        <Card className="mt-8 border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <CalendarRangeIcon className="size-4" />
                Planner-only workflow
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                This event builder is designed for planner accounts. Vendor accounts can keep managing availability and portfolio details from the vendor profile screen.
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/vendor/profile">Open vendor profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8">
          <EventsDashboard preferredCurrency={profile.currency} />
        </div>
      )}
    </main>
  );
}