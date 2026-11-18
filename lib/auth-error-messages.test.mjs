import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthErrorMessage } from './auth-error-messages.ts';

test('known login failures stay readable and include the returned HTTP status', () => {
  const message = getAuthErrorMessage({
    status: 400,
    code: 'invalid_credentials',
    message: 'Invalid login credentials',
  }, 'login');

  assert.match(message, /ইমেইল বা পাসওয়ার্ড সঠিক নয়/);
  assert.match(message, /HTTP 400/);
  assert.match(message, /invalid_credentials/);
});

test('unmapped service errors include their actual status and message', () => {
  const message = getAuthErrorMessage({
    status: 503,
    code: 'service_unavailable',
    message: 'Auth service unavailable',
  }, 'login');

  assert.match(message, /HTTP 503/);
  assert.match(message, /service_unavailable/);
  assert.match(message, /Auth service unavailable/);
});

test('network failures are distinguished from HTTP responses', () => {
  const message = getAuthErrorMessage(new TypeError('Failed to fetch'), 'login');

  assert.match(message, /ইন্টারনেট সংযোগে সমস্যা/);
  assert.match(message, /Failed to fetch/);
  assert.doesNotMatch(message, /HTTP \d+/);
});
