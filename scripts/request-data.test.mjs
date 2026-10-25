import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeJsonArray } from '../lib/request-data.ts';

test('normalizes an existing JSONB string array for legacy request rows', () => {
  assert.deepEqual(normalizeJsonArray('[{"id":"chair"}]'), [{ id: 'chair' }]);
});

test('preserves JSON arrays and safely ignores invalid JSON shapes', () => {
  const values = [{ id: 'bed' }];
  assert.equal(normalizeJsonArray(values), values);
  assert.deepEqual(normalizeJsonArray('{"id":"bed"}'), []);
  assert.deepEqual(normalizeJsonArray('{invalid'), []);
  assert.deepEqual(normalizeJsonArray(null), []);
});
