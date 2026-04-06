const BASE_DELAY_MINUTES = 5;
const MAX_DELAY_MINUTES = 180;

export function getNotificationRetryDelayMinutes(attempt: number) {
  const safeAttempt = Math.max(1, attempt);
  return Math.min(MAX_DELAY_MINUTES, BASE_DELAY_MINUTES * 2 ** (safeAttempt - 1));
}

export function getNotificationRetryDate(attempt: number, from = new Date()) {
  const next = new Date(from);
  next.setMinutes(next.getMinutes() + getNotificationRetryDelayMinutes(attempt));
  return next;
}