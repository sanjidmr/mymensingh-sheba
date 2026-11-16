import type { SiteContentOverrides } from './site-content';

let sharedSiteContentRequest: Promise<SiteContentOverrides | undefined> | null = null;

export function fetchSiteContentOverrides(): Promise<SiteContentOverrides | undefined> {
  if (!sharedSiteContentRequest) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3500);
    sharedSiteContentRequest = fetch('/api/site-content', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => (payload && typeof payload === 'object' && 'overrides' in payload ? payload.overrides as SiteContentOverrides : undefined))
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timeoutId);
        sharedSiteContentRequest = null;
      });
  }

  return sharedSiteContentRequest;
}
