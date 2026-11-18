import assert from 'node:assert/strict';
import test from 'node:test';
import { isConfirmedInvalidSessionError } from './auth-guard-errors.ts';

test('only confirmed auth failures are classified as an invalid session', () => {
  assert.equal(isConfirmedInvalidSessionError({ status: 401 }), true);
  assert.equal(isConfirmedInvalidSessionError({ code: 'session_not_found' }), true);
  assert.equal(isConfirmedInvalidSessionError({ status: 503 }), false);
  assert.equal(isConfirmedInvalidSessionError({ status: 400, code: 'database_unavailable' }), false);
  assert.equal(isConfirmedInvalidSessionError(new Error('fetch failed')), false);
});
