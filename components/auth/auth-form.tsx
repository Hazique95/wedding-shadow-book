"use client";

import { ArrowRightIcon, LoaderCircleIcon, MailIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeAuthError } from "@/lib/auth-errors";
import { withRetry } from "@/lib/retry";
import { createClient } from "@/lib/supabase/client";
import { readStoredUTM } from "@/lib/utm";

type AuthFormProps = {
  mode: "login" | "signup";
  nextPath?: string;
};

type EmailAuthResponse = {
  redirectTo: string;
  requiresEmailConfirmation?: boolean;
  error?: string;
};

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const redirectPath = nextPath || (mode === "signup" ? "/onboarding" : "/dashboard");

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await withRetry(async () => {
        const response = await fetch("/api/auth/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode,
            email,
            password,
            nextPath: redirectPath,
            signupSourceUtm: readStoredUTM(),
          }),
        });

        const payload = (await response.json()) as EmailAuthResponse;

        if (!response.ok) {
          throw new Error(payload.error ?? "Authentication failed.");
        }

        return payload;
      });

      if (mode === "signup") {
        if (result.requiresEmailConfirmation) {
          toast.success("Check your email to confirm your account.");
        } else {
          toast.success("Account created. Let’s finish onboarding.");
        }
      } else {
        toast.success("Welcome back.");
      }

      router.replace(result.redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(normalizeAuthError(error as { message?: string }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleAuth() {
    setIsGoogleLoading(true);
    const supabase = createClient();

    try {
      await withRetry(async () => {
        const response = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
          },
        });

        if (response.error) {
          throw response.error;
        }

        return response;
      });
    } catch (error) {
      setIsGoogleLoading(false);
      toast.error(normalizeAuthError(error as { message?: string }));
    }
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-full"
        onClick={handleGoogleAuth}
        disabled={isGoogleLoading || isSubmitting}
      >
        {isGoogleLoading ? <LoaderCircleIcon className="size-4 animate-spin" /> : <MailIcon className="size-4" />}
        Continue with Google
      </Button>

      <div className="relative text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <span className="bg-card px-3">or use email</span>
        <div className="absolute left-0 top-1/2 -z-10 h-px w-full -translate-y-1/2 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={handleEmailAuth}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@studio.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="h-12 w-full rounded-full" disabled={isSubmitting || isGoogleLoading}>
          {isSubmitting ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ArrowRightIcon className="size-4" />}
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}