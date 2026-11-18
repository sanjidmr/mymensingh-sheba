import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const TEST_URL = 'https://unit-test.supabase.co';
const TEST_ANON_KEY = 'test-anon-key';
const TEST_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.test',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00.000Z',
};

function createAuthClient(fetchImplementation) {
  return createClient(TEST_URL, TEST_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: fetchImplementation },
  });
}

function tokenResponse(refreshToken) {
  return {
    access_token: 'test.access.token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
    user: TEST_USER,
  };
}

test('twenty sequential password sign-ins succeed against mocked Supabase Auth', async () => {
  let requests = 0;
  const client = createAuthClient(async (input) => {
    const url = new URL(String(input));
    assert.equal(url.pathname, '/auth/v1/token');
    assert.equal(url.searchParams.get('grant_type'), 'password');
    requests += 1;
    return Response.json(tokenResponse(`refresh-${requests}`));
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await client.auth.signInWithPassword({
      email: TEST_USER.email,
      password: 'test-only-password',
    });
    assert.ifError(error);
    assert.ok(data.session);
    assert.equal(data.user.id, TEST_USER.id);
  }

  assert.equal(requests, 20);
});

test('a session expired during idle time is refreshed during restoration', async () => {
  let refreshRequests = 0;
  const client = createAuthClient(async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('grant_type'), 'refresh_token');
    refreshRequests += 1;
    return Response.json(tokenResponse('rotated-refresh-token'));
  });
  const expiredAccessToken = [
    Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ exp: 1 })).toString('base64url'),
    'test-signature',
  ].join('.');

  const { data, error } = await client.auth.setSession({
    access_token: expiredAccessToken,
    refresh_token: 'expired-session-refresh-token',
  });

  assert.ifError(error);
  assert.equal(data.session.access_token, 'test.access.token');
  assert.equal(data.session.refresh_token, 'rotated-refresh-token');
  assert.equal(refreshRequests, 1);
});

test('concurrent refresh callers share one refresh request', async () => {
  let refreshRequests = 0;
  const client = createAuthClient(async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('grant_type'), 'refresh_token');
    refreshRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 25));
    return Response.json(tokenResponse('rotated-refresh-token'));
  });

  const results = await Promise.all(
    Array.from({ length: 20 }, () =>
      client.auth.refreshSession({ refresh_token: 'shared-refresh-token' })
    )
  );

  assert.equal(refreshRequests, 1);
  assert.ok(results.every(({ data, error }) => !error && data.session));
});
