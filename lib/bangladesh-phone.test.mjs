import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeBangladeshMobile,
  phoneHref,
  resolveBangladeshContact,
  whatsappHref,
} from './bangladesh-phone.ts';

test('normalizes supported local and international Bangladeshi mobile formats', () => {
  for (const input of [
    '01712345678',
    '+8801712345678',
    '8801712345678',
    '00880 1712-345678',
    '০১৭১২-৩৪৫৬৭৮',
  ]) {
    assert.equal(normalizeBangladeshMobile(input), '01712345678');
  }
});

test('rejects empty, malformed, and invalid-operator numbers', () => {
  for (const input of ['', '0171234567', '01212345678', '++8801712345678', '+88001712345678']) {
    assert.equal(normalizeBangladeshMobile(input), null);
    assert.equal(phoneHref(input), null);
    assert.equal(whatsappHref(input), null);
  }
});

test('builds tel and WhatsApp URLs without duplicating the country code', () => {
  for (const input of ['01712345678', '+8801712345678', '8801712345678']) {
    assert.equal(phoneHref(input), 'tel:+8801712345678');
    assert.equal(whatsappHref(input), 'https://wa.me/8801712345678');
  }
});

test('uses a supplied WhatsApp number or falls back to the required contact phone', () => {
  assert.deepEqual(
    resolveBangladeshContact('01712345678', '+8801812345678'),
    {
      callNumber: '01712345678',
      whatsappNumber: '01812345678',
      callHref: 'tel:+8801712345678',
      whatsappHref: 'https://wa.me/8801812345678',
    }
  );
  assert.deepEqual(
    resolveBangladeshContact('01712345678'),
    {
      callNumber: '01712345678',
      whatsappNumber: '01712345678',
      callHref: 'tel:+8801712345678',
      whatsappHref: 'https://wa.me/8801712345678',
    }
  );
});
