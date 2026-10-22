import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getProviderRetryAfter,
  getRetryDelayMs,
  isRetryableProviderStatus,
} from '../lib/admin-email-queue-policy.ts';

test('transient provider status codes are retried, permanent 4xx are not', () => {
  for (const status of [408, 429, 500, 503]) {
    assert.equal(isRetryableProviderStatus(status), true);
  }
  for (const status of [400, 401, 403, 404]) {
    assert.equal(isRetryableProviderStatus(status), false);
  }
});

test('retry delay grows exponentially with bounded jitter', () => {
  assert.equal(getRetryDelayMs(1, null, 1_000, 0), 24_000);
  assert.equal(getRetryDelayMs(1, null, 1_000, 1), 36_000);
  assert.equal(getRetryDelayMs(6, null, 1_000, 0.5), 30_000 * 2 ** 5);
  assert.equal(getRetryDelayMs(20, null, 1_000, 0.5), 60 * 60_000);
});

test('Retry-After is observed and capped to one day', () => {
  const now = 1_000_000;
  assert.equal(getRetryDelayMs(1, '120', now, 0.5), 120_000);
  assert.equal(getRetryDelayMs(1, 'invalid', now, 0), 24_000);
  assert.equal(getRetryDelayMs(1, '999999', now, 0), 24 * 60 * 60_000);
});

test('Brevo reset headers are used when Retry-After is absent', () => {
  const now = 1_700_000_000_000;
  const resetAt = Math.floor((now + 90_000) / 1000).toString();
  assert.equal(
    getProviderRetryAfter(new Headers({ 'x-sib-ratelimit-reset': resetAt }), now),
    new Date(Number(resetAt) * 1000).toUTCString()
  );
  assert.equal(
    getProviderRetryAfter(new Headers({ 'retry-after': '45', 'ratelimit-reset': '120' }), now),
    '45'
  );
});
