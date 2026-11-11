const CANONICAL_SITE_URL = 'https://mymensinghsheba.com';

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0'
  );
}

function parseConfiguredSiteUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return null;
    }
    if (
      url.hostname === '0.0.0.0' ||
      (process.env.NODE_ENV === 'production' &&
        (url.protocol !== 'https:' || isLocalHostname(url.hostname)))
    ) {
      return null;
    }
    if (url.hostname === 'www.mymensinghsheba.com') {
      url.hostname = 'mymensinghsheba.com';
      url.protocol = 'https:';
    }
    return url.origin;
  } catch {
    return null;
  }
}

function firstHeaderValue(value: string | null): string | null {
  return value?.split(',')[0]?.trim() || null;
}

function forwardedOrigin(host: string | null, protocol: string | null): string | null {
  if (!host || !protocol) return null;
  const normalizedProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
  if (!['http:', 'https:'].includes(normalizedProtocol)) return null;

  try {
    const url = new URL(`${normalizedProtocol}//${host}`);
    const hostname = url.hostname.toLowerCase();
    const isCanonicalHost =
      hostname === 'mymensinghsheba.com' || hostname === 'www.mymensinghsheba.com';
    const isLocalHost = process.env.NODE_ENV !== 'production' && isLocalHostname(hostname);
    if (
      url.username ||
      url.password ||
      (!isCanonicalHost && !isLocalHost) ||
      hostname === '0.0.0.0'
    ) {
      return null;
    }
    if (isCanonicalHost) return CANONICAL_SITE_URL;
    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const configured = parseConfiguredSiteUrl(process.env.NEXT_PUBLIC_SITE_URL?.trim());
  if (configured) return configured;
  return process.env.NODE_ENV === 'production'
    ? CANONICAL_SITE_URL
    : 'http://localhost:3000';
}

export function getSiteOrigin(request?: Pick<Request, 'url' | 'headers'>): string {
  const configured = parseConfiguredSiteUrl(process.env.NEXT_PUBLIC_SITE_URL?.trim());
  if (configured) return configured;
  if (!request) return getSiteUrl();

  const forwardedHost = firstHeaderValue(request.headers.get('x-forwarded-host'));
  const forwardedProto = firstHeaderValue(request.headers.get('x-forwarded-proto'));
  const proxyOrigin = forwardedOrigin(forwardedHost, forwardedProto);
  if (proxyOrigin) return proxyOrigin;

  const host = firstHeaderValue(request.headers.get('host'));
  const requestProtocol = (() => {
    try {
      return new URL(request.url).protocol;
    } catch {
      return null;
    }
  })();
  const hostOrigin = forwardedOrigin(host, requestProtocol);
  if (hostOrigin) return hostOrigin;

  try {
    const requestUrl = new URL(request.url);
    const requestOrigin = forwardedOrigin(requestUrl.host, requestUrl.protocol);
    if (requestOrigin) return requestOrigin;
  } catch {
    return getSiteUrl();
  }
  return getSiteUrl();
}
