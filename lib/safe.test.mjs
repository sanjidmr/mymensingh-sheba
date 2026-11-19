import assert from 'node:assert/strict';
import test from 'node:test';
import { safeUUID } from './safe.ts';

test('safeUUID falls back to Math.random when crypto is unavailable', () => {
  const originalCrypto = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: undefined });
  try {
    assert.match(safeUUID(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  } finally {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: originalCrypto });
  }
});

test('safeUUID creates a v4 UUID when randomUUID is missing', () => {
  const originalCrypto = globalThis.crypto;
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { getRandomValues: (bytes) => bytes.fill(7) },
  });
  try {
    assert.equal(safeUUID(), '07070707-0707-4707-8707-070707070707');
  } finally {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: originalCrypto });
  }
});
