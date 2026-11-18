export const REQUEST_TIMEOUT_MESSAGE =
  'অনুরোধটি সম্পন্ন হতে বেশি সময় লাগছে। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।';

export interface TransientAuthRefreshFailure {
  kind: 'network' | 'timeout' | 'server' | 'rate_limit';
  status?: number;
  occurredAt: number;
}

let lastAuthRefreshFailure: TransientAuthRefreshFailure | null = null;

export function getRecentAuthRefreshFailure(
  maxAgeMs = 60_000
): TransientAuthRefreshFailure | null {
  if (!lastAuthRefreshFailure) return null;
  if (Date.now() - lastAuthRefreshFailure.occurredAt > maxAgeMs) {
    lastAuthRefreshFailure = null;
    return null;
  }
  return lastAuthRefreshFailure;
}

function getRequestDetails(input: RequestInfo | URL, init?: RequestInit) {
  try {
    const url = new URL(
      typeof Request !== 'undefined' && input instanceof Request ? input.url : String(input),
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    );
    return {
      route: url.pathname,
      method: (
        init?.method ??
        (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
      ).toUpperCase(),
    };
  } catch {
    return { route: 'unknown', method: (init?.method ?? 'GET').toUpperCase() };
  }
}

function isAuthRefreshRequest(input: RequestInfo | URL, init?: RequestInit): boolean {
  try {
    const url = new URL(
      typeof Request !== 'undefined' && input instanceof Request ? input.url : String(input),
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin
    );
    const method = getRequestDetails(input, init).method;
    return (
      method === 'POST' &&
      url.pathname.endsWith('/auth/v1/token') &&
      url.searchParams.get('grant_type') === 'refresh_token'
    );
  } catch {
    return false;
  }
}

function logRequestOutcome(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  durationMs: number,
  outcome: { status?: number; error?: unknown }
): void {
  if (typeof window !== 'undefined') return;
  const details = getRequestDetails(input, init);
  const candidate =
    outcome.error && typeof outcome.error === 'object'
      ? (outcome.error as { message?: unknown; name?: unknown })
      : null;
  const event = {
    event: outcome.error ? 'upstream.request_failed' : 'upstream.request_slow_or_failed',
    ...details,
    status: outcome.status,
    durationMs,
    ...(outcome.error
      ? {
          errorName: typeof candidate?.name === 'string' ? candidate.name : undefined,
          reason: typeof candidate?.message === 'string' ? candidate.message : String(outcome.error),
        }
      : {}),
  };
  console[outcome.error || (outcome.status ?? 0) >= 500 ? 'error' : 'warn'](
    JSON.stringify(event)
  );
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 20_000
): Promise<Response> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const sourceSignal =
    init?.signal ??
    (typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined);
  const abortFromSource = () => controller.abort(sourceSignal?.reason);
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (sourceSignal?.aborted) {
    abortFromSource();
  } else {
    sourceSignal?.addEventListener('abort', abortFromSource, { once: true });
  }

  const method = getRequestDetails(input, init).method;
  const canRetry = method === 'GET';
  const isAuthRefresh = isAuthRefreshRequest(input, init);
  return (async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        if (isAuthRefresh) {
          if (response.status === 429) {
            lastAuthRefreshFailure = {
              kind: 'rate_limit',
              status: response.status,
              occurredAt: Date.now(),
            };
          } else if (response.status >= 500) {
            lastAuthRefreshFailure = {
              kind: 'server',
              status: response.status,
              occurredAt: Date.now(),
            };
          } else {
            lastAuthRefreshFailure = null;
          }
        }
        if (
          canRetry &&
          attempt < 2 &&
          [502, 503, 504].includes(response.status) &&
          !sourceSignal?.aborted
        ) {
          await response.body?.cancel();
          await new Promise<void>((resolve, reject) => {
            let retryTimer: ReturnType<typeof setTimeout> | undefined;
            const onAbort = () => {
              if (retryTimer) clearTimeout(retryTimer);
              reject(sourceSignal?.reason ?? new DOMException('Request aborted', 'AbortError'));
            };
            if (sourceSignal?.aborted) {
              onAbort();
              return;
            }
            retryTimer = setTimeout(() => {
              sourceSignal?.removeEventListener('abort', onAbort);
              resolve();
            }, 250 * 2 ** attempt);
            sourceSignal?.addEventListener('abort', onAbort, { once: true });
          });
          continue;
        }

        const durationMs = Date.now() - startedAt;
        if (response.status >= 500 || durationMs >= 3_000) {
          logRequestOutcome(input, init, durationMs, { status: response.status });
        }
        return response;
      } catch (error: unknown) {
        if (timedOut) {
          if (isAuthRefresh) {
            lastAuthRefreshFailure = { kind: 'timeout', occurredAt: Date.now() };
          }
          const timeoutError = new Error(REQUEST_TIMEOUT_MESSAGE);
          timeoutError.name = 'TimeoutError';
          logRequestOutcome(input, init, Date.now() - startedAt, { error: timeoutError });
          throw timeoutError;
        }
        if (sourceSignal?.aborted) throw error;
        if (isAuthRefresh && error instanceof TypeError) {
          lastAuthRefreshFailure = { kind: 'network', occurredAt: Date.now() };
        }
        if (canRetry && attempt < 2 && error instanceof TypeError) {
          await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
          continue;
        }
        logRequestOutcome(input, init, Date.now() - startedAt, { error });
        throw error;
      }
    }
  })()
    .finally(() => {
      clearTimeout(timeoutId);
      sourceSignal?.removeEventListener('abort', abortFromSource);
    });
}

export function isAbortError(error: unknown): boolean {
  if (typeof error === 'string') {
    return error.includes('AbortError') || error.includes('signal is aborted');
  }
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: unknown; message?: unknown };
  return candidate.name === 'AbortError' ||
    (typeof candidate.message === 'string' &&
      (candidate.message.includes('AbortError') || candidate.message.includes('signal is aborted')));
}

export function isTimeoutError(error: unknown): boolean {
  if (typeof error === 'string') {
    return error.includes(REQUEST_TIMEOUT_MESSAGE) || error.includes('TimeoutError');
  }
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { name?: unknown; message?: unknown };
  return candidate.name === 'TimeoutError' ||
    (typeof candidate.message === 'string' &&
      (candidate.message.includes(REQUEST_TIMEOUT_MESSAGE) || candidate.message.includes('TimeoutError')));
}
