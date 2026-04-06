let sentryInitialized = false;

type SentryModule = typeof import("@sentry/nextjs");

async function getSentryModule(): Promise<SentryModule | null> {
  if (!process.env.SENTRY_DSN) {
    return null;
  }

  const Sentry = await import("@sentry/nextjs");

  if (!sentryInitialized) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0,
    });
    sentryInitialized = true;
  }

  return Sentry;
}

export async function captureServerException(error: unknown, context: Record<string, unknown> = {}) {
  const Sentry = await getSentryModule();

  if (!Sentry) {
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }

    Sentry.captureException(
      error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown server exception")
    );
  });

  await Sentry.flush(500);
}