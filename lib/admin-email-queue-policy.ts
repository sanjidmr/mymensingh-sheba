const MAX_BACKOFF_MS = 60 * 60_000;
const MAX_RETRY_AFTER_MS = 24 * 60 * 60_000;

export function isRetryableProviderStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function getProviderRetryAfter(headers: Headers, now = Date.now()): string | null {
  const retryAfter = headers.get('retry-after');
  if (retryAfter) return retryAfter;

  const reset =
    headers.get('x-sib-ratelimit-reset') ??
    headers.get('ratelimit-reset') ??
    headers.get('x-ratelimit-reset');
  if (!reset) return null;
  const resetSeconds = Number(reset);
  return Number.isFinite(resetSeconds) && resetSeconds > 1_000_000_000
    ? new Date(Math.max(now, resetSeconds * 1000)).toUTCString()
    : reset;
}

export function getRetryDelayMs(
  attempt: number,
  retryAfter: string | null,
  now = Date.now(),
  random = Math.random()
): number {
  const base = Math.min(MAX_BACKOFF_MS, 30_000 * 2 ** Math.max(0, attempt - 1));
  const jittered = Math.round(base * (0.8 + Math.min(1, Math.max(0, random)) * 0.4));
  if (!retryAfter) return jittered;

  const seconds = Number(retryAfter);
  const retryAt = Number.isFinite(seconds)
    ? now + Math.max(0, seconds) * 1000
    : Date.parse(retryAfter);
  if (!Number.isFinite(retryAt)) return jittered;
  return Math.max(jittered, Math.min(MAX_RETRY_AFTER_MS, retryAt - now));
}
