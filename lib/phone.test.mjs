import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPhone, isValidBDPhone, normalizePhone } from './phone.ts';

test('normalizes Bangla digits, international prefixes, spaces, and dashes', () => {
  for (const input of [
    '০১৭১২৩৪৫৬৭৮',
    '+880 1712-345678',
    '8801712345678',
    '01712 345 678',
  ]) {
    assert.equal(normalizePhone(input), '01712345678');
    assert.equal(isValidBDPhone(input), true);
  }
});

test('rejects empty, short, and unsupported-prefix numbers', () => {
  for (const input of ['', '   ', '0171234567', '01212345678', '880171234567']) {
    assert.equal(normalizePhone(input), null);
    assert.equal(isValidBDPhone(input), false);
  }
});

test('formats only valid Bangladeshi mobile numbers', () => {
  assert.equal(formatPhone('০১৭১২৩৪৫৬৭৮'), '017-12345678');
  assert.equal(formatPhone('not a number'), '');
});
