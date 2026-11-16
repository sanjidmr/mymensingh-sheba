import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  Deno.env.get('SITE_ALLOWED_ORIGIN') ?? 'https://mymensinghsheba.com',
]);

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });
  if (origin && allowedOrigins.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
  return headers;
}

function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function base64Url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getGoogleAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri?: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pem), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned)),
  );
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const tokenUrl = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Google OAuth token request failed.');
  const result = await response.json() as { access_token?: string };
  if (!result.access_token) throw new Error('Google OAuth token was missing.');
  return result.access_token;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers });
  }
  if (origin && !isAllowedOrigin(origin)) {
    return Response.json({ error: 'Origin is not allowed.' }, { status: 403, headers });
  }

  const authorization = request.headers.get('authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const triggerToken = Deno.env.get('PUSH_TRIGGER_TOKEN');
  if (!authorization || !supabaseUrl || !anonKey || !serviceKey) {
    return Response.json({ error: 'Push service is not configured.' }, { status: 503, headers });
  }

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const isTrustedTrigger = Boolean(triggerToken && authorization === `Bearer ${triggerToken}`);
  if (!isTrustedTrigger) {
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return Response.json({ error: 'Authentication required.' }, { status: 401, headers });
    }

    const { data: caller, error: callerError } = await adminClient
      .from('profiles')
      .select('role, status')
      .eq('id', authData.user.id)
      .maybeSingle();
    if (callerError || caller?.role !== 'admin' || caller.status !== 'active') {
      return Response.json({ error: 'Administrator access required.' }, { status: 403, headers });
    }
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'A JSON request body is required.' }, { status: 400, headers });
  }
  if (
    !isRecord(payload) ||
    typeof payload.title !== 'string' ||
    typeof payload.body !== 'string' ||
    !payload.title.trim() ||
    !payload.body.trim() ||
    payload.title.length > 120 ||
    payload.body.length > 500
  ) {
    return Response.json({ error: 'Invalid notification payload.' }, { status: 400, headers });
  }
  const userIds = Array.isArray(payload.user_ids)
    ? payload.user_ids
    : typeof payload.user_id === 'string' ? [payload.user_id] : [];
  if (
    userIds.length === 0 ||
    userIds.length > 500 ||
    userIds.some((id) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))
  ) {
    return Response.json({ error: 'Provide one user_id or up to 500 valid user_ids.' }, { status: 400, headers });
  }

  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON');
  if (!serviceAccountJson) {
    return Response.json({ sent: 0, skipped: true }, { status: 200, headers });
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson) as {
      project_id?: string;
      client_email: string;
      private_key: string;
      token_uri?: string;
    };
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('Firebase service account is incomplete.');
    }

    const { data: devices, error: devicesError } = await adminClient
      .from('device_tokens')
      .select('id, token')
      .in('user_id', [...new Set(userIds as string[])])
      .eq('platform', 'android')
      .limit(2000);
    if (devicesError) throw devicesError;
    if (!devices?.length) return Response.json({ sent: 0, failed: 0 }, { status: 200, headers });

    const accessToken = await getGoogleAccessToken(serviceAccount);
    const data = isRecord(payload.data)
      ? Object.fromEntries(
          Object.entries(payload.data)
            .filter(([key, value]) => /^[A-Za-z0-9_-]{1,64}$/.test(key) && typeof value === 'string')
            .map(([key, value]) => [key, String(value).slice(0, 512)]),
        )
      : {};
    if (typeof data.href === 'string' && (!data.href.startsWith('/') || data.href.startsWith('//') || data.href.includes('\\'))) {
      delete data.href;
    }

    let sent = 0;
    let failed = 0;
    const staleIds: string[] = [];
    for (let offset = 0; offset < devices.length; offset += 10) {
      const batch = devices.slice(offset, offset + 10);
      const results = await Promise.all(batch.map(async (device) => {
        try {
          const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(serviceAccount.project_id!)}/messages:send`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: {
                  token: device.token,
                  notification: { title: payload.title, body: payload.body },
                  data,
                  android: { priority: 'high' },
                },
              }),
              signal: AbortSignal.timeout(8000),
            },
          );
          if (response.ok) return 'sent' as const;
          const errorBody = await response.text();
          if (response.status === 404 || errorBody.includes('UNREGISTERED')) staleIds.push(device.id);
          return 'failed' as const;
        } catch {
          return 'failed' as const;
        }
      }));
      sent += results.filter((result) => result === 'sent').length;
      failed += results.filter((result) => result === 'failed').length;
    }
    if (staleIds.length) {
      await adminClient.from('device_tokens').delete().in('id', staleIds);
    }
    return Response.json({ sent, failed }, { status: 200, headers });
  } catch {
    return Response.json({ error: 'Push delivery is temporarily unavailable.' }, { status: 503, headers });
  }
});
