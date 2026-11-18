import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fetchWithTimeout,
  getRecentAuthRefreshFailure,
  isAbortError,
  REQUEST_TIMEOUT_MESSAGE,
} from './fetch-with-timeout.ts';

test('recognizes abort errors wrapped in a regular Error message', () => {
  const error = new Error('AbortError: This operation was aborted');

  assert.equal(isAbortError(error), true);
  assert.equal(isAbortError(new Error('A different request failure')), false);
});

test('preserves the original error for a simulated network failure', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const networkError = new TypeError('Failed to fetch');
  globalThis.fetch = async () => {
    throw networkError;
  };
  console.error = () => {};

  try {
    await assert.rejects(
      fetchWithTimeout('https://supabase.example.test/rest/v1/profiles'),
      (error) => error === networkError
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('reports an explicit timeout when the request exceeds its deadline', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    });
  console.error = () => {};

  try {
    await assert.rejects(
      fetchWithTimeout('https://supabase.example.test/rest/v1/profiles', {}, 5),
      (error) => error.name === 'TimeoutError' && error.message === REQUEST_TIMEOUT_MESSAGE
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('returns successful responses without changing their status', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });

  try {
    const response = await fetchWithTimeout('https://supabase.example.test/rest/v1/profiles');
    assert.equal(response.status, 204);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('retries an idempotent GET after a transient network failure', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleWarn = console.warn;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts < 3) throw new TypeError('Temporary network failure');
    return new Response(null, { status: 204 });
  };
  console.warn = () => {};

  try {
    const response = await fetchWithTimeout('https://supabase.example.test/rest/v1/profiles');
    assert.equal(response.status, 204);
    assert.equal(attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalConsoleWarn;
  }
});

test('does not retry a non-idempotent POST after a network failure', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    throw new TypeError('Temporary network failure');
  };
  console.error = () => {};

  try {
    await assert.rejects(
      fetchWithTimeout('https://supabase.example.test/auth/v1/token', { method: 'POST' }),
      /Temporary network failure/
    );
    assert.equal(attempts, 1);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('records transient refresh failures but does not retry the refresh POST itself', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return new Response(null, { status: 503 });
  };
  console.error = () => {};

  try {
    await fetchWithTimeout(
      'https://supabase.example.test/auth/v1/token?grant_type=refresh_token',
      { method: 'POST' }
    );
    assert.equal(attempts, 1);
    assert.deepEqual(
      (({ kind, status }) => ({ kind, status }))(getRecentAuthRefreshFailure()),
      { kind: 'server', status: 503 }
    );
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('clears a transient refresh failure when the auth endpoint returns a definitive response', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  globalThis.fetch = async () => new Response(null, { status: 401 });
  console.error = () => {};

  try {
    await fetchWithTimeout(
      'https://supabase.example.test/auth/v1/token?grant_type=refresh_token',
      { method: 'POST' }
    );
    assert.equal(getRecentAuthRefreshFailure(), null);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('records a timed-out refresh request without exposing its token data', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  const logEntries = [];
  globalThis.fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        reject(error);
      }, { once: true });
    });
  console.error = (...args) => logEntries.push(args.join(' '));

  try {
    await assert.rejects(
      fetchWithTimeout(
        'https://supabase.example.test/auth/v1/token?grant_type=refresh_token',
        { method: 'POST', body: JSON.stringify({ refresh_token: 'secret-refresh-token' }) },
        5
      ),
      { name: 'TimeoutError' }
    );
    assert.equal(getRecentAuthRefreshFailure()?.kind, 'timeout');
    assert.ok(logEntries.every((entry) => !entry.includes('secret-refresh-token')));
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});

test('retries transient gateway responses for GET and stops after the limit', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleWarn = console.warn;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return new Response(null, { status: 503 });
  };
  console.warn = () => {};

  try {
    const response = await fetchWithTimeout('https://supabase.example.test/rest/v1/profiles');
    assert.equal(response.status, 503);
    assert.equal(attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalConsoleWarn;
  }
});
