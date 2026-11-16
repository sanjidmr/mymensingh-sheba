export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 3500
): Promise<Response> {
  const controller = new AbortController();
  const sourceSignal =
    init?.signal ??
    (typeof Request !== 'undefined' && input instanceof Request ? input.signal : undefined);
  const abortFromSource = () => controller.abort(sourceSignal?.reason);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (sourceSignal?.aborted) {
    abortFromSource();
  } else {
    sourceSignal?.addEventListener('abort', abortFromSource, { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
    sourceSignal?.removeEventListener('abort', abortFromSource);
  });
}
