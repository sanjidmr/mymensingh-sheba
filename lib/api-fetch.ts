import { createClient } from './supabase/client';
import { isNative } from './platform';
import { fetchWithTimeout } from './fetch-with-timeout';

type ProxyResponse = {
  status: number;
  body: string;
  contentType: string | null;
};

function isProxyResponse(value: unknown): value is ProxyResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return (
    Number.isInteger(response.status) &&
    typeof response.body === 'string' &&
    (response.contentType === null || typeof response.contentType === 'string')
  );
}

export async function apiFetch(
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!isNative()) return fetchWithTimeout(input, init);

  const requestUrl = new URL(String(input), window.location.origin);
  if (requestUrl.origin !== window.location.origin || !requestUrl.pathname.startsWith('/api/')) {
    throw new Error('Native API requests must use an allowed same-origin API path.');
  }

  const client = createClient();
  if (!client) throw new Error('Supabase is not configured for API requests.');

  let body: unknown;
  if (typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch (error) {
      throw new Error('Native API requests must provide a valid JSON body.', { cause: error });
    }
  } else if (init.body != null) {
    throw new Error('Native API requests only support JSON bodies.');
  }

  const { data, error } = await client.functions.invoke('marketplace-api', {
    body: {
      path: `${requestUrl.pathname}${requestUrl.search}`,
      method: (init.method ?? 'GET').toUpperCase(),
      body,
    },
  });
  if (error) {
    throw new Error(`Marketplace API request failed: ${error.message}`, { cause: error });
  }
  if (!isProxyResponse(data)) {
    throw new Error('Marketplace API returned an invalid response.');
  }

  return new Response(data.body || null, {
    status: data.status,
    headers: data.contentType ? { 'Content-Type': data.contentType } : undefined,
  });
}
