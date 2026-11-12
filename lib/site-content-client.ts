import type { SiteContentOverrides } from './site-content';

let sharedSiteContentRequest: Promise<SiteContentOverrides | undefined> | null = null;

export function fetchSiteContentOverrides(): Promise<SiteContentOverrides | undefined> {
  if (!sharedSiteContentRequest) {
    sharedSiteContentRequest = fetch('/api/site-content', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => (payload && typeof payload === 'object' && 'overrides' in payload ? payload.overrides as SiteContentOverrides : undefined))
      .catch(() => undefined)
      .finally(() => {
        sharedSiteContentRequest = null;
      });
  }

  return sharedSiteContentRequest;
}
