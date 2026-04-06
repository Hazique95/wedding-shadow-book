import { NextResponse } from "next/server";

import { withRetry } from "@/lib/retry";
import { createRouteClient } from "@/lib/supabase/route";
import type { UTMParams } from "@/lib/auth-types";

function normalizeNextPath(rawNext: unknown, fallback: string) {
  if (typeof rawNext !== "string" || !rawNext.startsWith("/")) {
    return fallback;
  }

  return rawNext;
}

export async function POST(request: Request) {
  const supabase = await createRouteClient();

  try {
    const body = (await request.json()) as {
      mode?: "login" | "signup";
      email?: string;
      password?: string;
      nextPath?: string;
      signupSourceUtm?: UTMParams | null;
    };

    const mode = body.mode;
    const email = body.email?.trim();
    const password = body.password;

    if ((mode !== "login" && mode !== "signup") || !email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (mode === "signup") {
      const response = await withRetry(async () => {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/onboarding`,
            data: {
              signup_source_utm: body.signupSourceUtm ?? null,
            },
          },
        });

        if (result.error) {
          throw result.error;
        }

        return result;
      });

      return NextResponse.json({
        redirectTo: response.data.session ? "/onboarding" : "/login",
        requiresEmailConfirmation: !response.data.session,
      });
    }

    await withRetry(async () => {
      const result = await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        throw result.error;
      }

      return result;
    });

    return NextResponse.json({
      redirectTo: normalizeNextPath(body.nextPath, "/dashboard"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed." },
      { status: 500 }
    );
  }
}