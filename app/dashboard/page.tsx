import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPinIcon, SparklesIcon, WalletCardsIcon } from "lucide-react";

import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentAuthState, isProfileComplete } from "@/lib/auth-state";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  if (!isProfileComplete(profile)) {
    redirect("/onboarding");
  }

  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
            Protected dashboard
          </Badge>
          <h1 className="mt-5 font-heading text-5xl leading-none sm:text-6xl">
            Welcome, {profile?.full_name}.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Your workspace is protected by Supabase auth middleware, and your public/private profile access follows the RLS policies in the migration.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {profile?.role === "vendor" ? (
            <Button asChild className="rounded-full">
              <Link href="/vendor/profile">Open vendor profile</Link>
            </Button>
          ) : null}
          <SignOutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card className="border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SparklesIcon className="size-4 text-primary" />
              Role
            </div>
            <p className="mt-4 font-heading text-4xl leading-none capitalize">{profile?.role}</p>
          </CardContent>
        </Card>

        <Card className="border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPinIcon className="size-4 text-primary" />
              Location
            </div>
            <p className="mt-4 text-lg leading-7 text-foreground/85">{profile?.location_label}</p>
          </CardContent>
        </Card>

        <Card className="border-white/45 bg-white/78 dark:border-white/10 dark:bg-white/6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <WalletCardsIcon className="size-4 text-primary" />
              Rate
            </div>
            <p className="mt-4 text-lg leading-7 text-foreground/85">
              {profile?.hourly_rate ? `${profile.currency} ${profile.hourly_rate}/hr` : "Not set"}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
