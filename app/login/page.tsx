import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentAuthState, isProfileComplete } from "@/lib/auth-state";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { user, profile } = await getCurrentAuthState();

  if (user) {
    redirect(isProfileComplete(profile) ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell
      title="Sign in and keep the backup bench ready"
      description="Access your planner or vendor workspace, review risk alerts, and respond to backup requests in real time."
      alternateLabel="Need an account?"
      alternateHref="/signup"
      alternateCta="Create one"
    >
      <AuthForm mode="login" nextPath={params.next} />
    </AuthShell>
  );
}
