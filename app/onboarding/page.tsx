import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/auth/onboarding-wizard";
import { Badge } from "@/components/ui/badge";
import { getCurrentAuthState, isProfileComplete } from "@/lib/auth-state";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  if (isProfileComplete(profile)) {
    redirect("/dashboard");
  }

  return (
    <main className="section-shell py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary shadow-none">
          Post-signup onboarding
        </Badge>
        <h1 className="mt-5 font-heading text-5xl leading-none sm:text-6xl">
          Let’s tailor your profile.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Choose whether you are a planner or vendor, add your location, and set the profile details that power matching and visibility.
        </p>
        <div className="glass-panel mt-8 p-6 sm:p-8">
          <OnboardingWizard email={user.email ?? null} initialProfile={profile} />
        </div>
      </div>
    </main>
  );
}