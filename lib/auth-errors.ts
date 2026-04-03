export function normalizeAuthError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("already registered") || message.includes("user already registered")) {
    return "Email taken";
  }

  if (message.includes("invalid login credentials")) {
    return "Invalid email or password";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Network request failed after 3 retries";
  }

  return error?.message ?? "Something went wrong. Please try again.";
}
