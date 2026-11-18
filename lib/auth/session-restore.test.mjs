import assert from 'node:assert/strict';
import test from 'node:test';
import { getTransientSessionRestoreMessage } from './session-restore.ts';

test('marks a failed initial refresh as temporarily unavailable, not signed out', () => {
  assert.match(
    getTransientSessionRestoreMessage('INITIAL_SESSION', false, {
      kind: 'server',
      status: 503,
      occurredAt: Date.now(),
    }),
    /HTTP 503/
  );
});

test('does not mask an explicit sign-out or a missing session without refresh failure', () => {
  const failure = { kind: 'network', occurredAt: Date.now() };
  assert.equal(getTransientSessionRestoreMessage('SIGNED_OUT', false, failure), null);
  assert.equal(getTransientSessionRestoreMessage('INITIAL_SESSION', false, null), null);
  assert.equal(getTransientSessionRestoreMessage('INITIAL_SESSION', true, failure), null);
});
