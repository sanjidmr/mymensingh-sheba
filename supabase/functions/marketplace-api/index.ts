const ALLOWED_ORIGINS = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
]);

const ALLOWED_ENDPOINTS = new Map<string, Set<string>>([
  ['/api/area-options', new Set(['GET'])],
  ['/api/site-content', new Set(['GET'])],
  ['/api/vehicle-route', new Set(['POST'])],
  ['/api/vehicle-requests', new Set(['POST'])],
  ['/api/tolet/listings', new Set(['POST', 'PATCH'])],
  ['/api/tolet/events', new Set(['POST'])],
  ['/api/order', new Set(['POST'])],
  ['/api/analytics/events', new Set(['POST'])],
  ['/api/analytics/active-visitors', new Set(['POST'])],
  ['/api/admin-telegram-alerts', new Set(['POST'])],
]);

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  return headers;
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  }
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return Response.json({ error: 'Origin is not allowed.' }, { status: 403, headers });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'A JSON request body is required.' }, { status: 400, headers });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json({ error: 'Invalid API proxy request.' }, { status: 400, headers });
  }

  const input = payload as Record<string, unknown>;
  const path = typeof input.path === 'string' ? input.path : '';
  const method = typeof input.method === 'string' ? input.method.toUpperCase() : '';
  const endpoint = ALLOWED_ENDPOINTS.get(path);
  const bookingMatch = /^\/api\/vehicle-bookings\/(car|auto|cng)$/.exec(path);
  const allowed = endpoint?.has(method) || (Boolean(bookingMatch) && method === 'POST');
  if (!allowed) {
    return Response.json({ error: 'This API endpoint is not available to the app.' }, { status: 404, headers });
  }

  const apiOrigin = Deno.env.get('SITE_API_ORIGIN');
  if (!apiOrigin) {
    return Response.json({ error: 'The site API origin is not configured.' }, { status: 503, headers });
  }

  let target: URL;
  try {
    target = new URL(path, apiOrigin);
    if (target.origin !== new URL(apiOrigin).origin || target.pathname !== path) {
      return Response.json({ error: 'Invalid API path.' }, { status: 400, headers });
    }
  } catch {
    return Response.json({ error: 'The site API origin is invalid.' }, { status: 503, headers });
  }

  const requestHeaders = new Headers({ Accept: 'application/json', Origin: target.origin });
  const authorization = request.headers.get('authorization');
  if (authorization) requestHeaders.set('Authorization', authorization);

  let requestBody: string | undefined;
  if (method !== 'GET' && input.body !== undefined) {
    requestBody = JSON.stringify(input.body);
    if (requestBody.length > 1_000_000) {
      return Response.json({ error: 'API request body is too large.' }, { status: 413, headers });
    }
    requestHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(target, {
      method,
      headers: requestHeaders,
      ...(requestBody ? { body: requestBody } : {}),
    });
    return Response.json({
      status: response.status,
      body: await response.text(),
      contentType: response.headers.get('content-type'),
    }, { headers });
  } catch (error) {
    console.error('Marketplace API proxy request failed.', error);
    return Response.json({ error: 'The site API could not be reached.' }, { status: 502, headers });
  }
});
