import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentAuthState, isProfileComplete } from "@/lib/auth-state";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { user, profile } = await getCurrentAuthState();

  if (user) {
    redirect(isProfileComplete(profile) ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell
      title="Create your rescue-ready account"
      description="Launch email/password or Google auth, then finish the onboarding wizard so planners and vendors can be matched the right way."
      alternateLabel="Already have an account?"
      alternateHref="/login"
      alternateCta="Sign in"
    >
      <AuthForm mode="signup" nextPath={params.next} />
    </AuthShell>
  );
}
