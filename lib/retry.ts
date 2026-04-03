function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return ["network", "fetch", "failed to fetch", "timed out", "timeout", "load failed"].some(
    (fragment) => message.includes(fragment)
  );
}

export async function withRetry<T>(
  task: () => Promise<T>,
  retries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;

      if (!isNetworkError(error) || attempt === retries) {
        throw error;
      }

      await wait(delayMs * attempt);
    }
  }

  throw lastError;
}
