import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dhakaDateString,
  resolveAnalyticsDateRange,
  shiftAnalyticsDate,
} from '../lib/admin/analytics-date.ts';
import {
  classifyAnalyticsTraffic,
  isKnownAutomationUserAgent,
} from '../lib/analytics/traffic-classification.ts';

test('Dhaka date boundary follows Asia/Dhaka midnight, not UTC midnight', () => {
  assert.equal(dhakaDateString(new Date('2026-10-28T17:59:59.999Z')), '2026-10-28');
  assert.equal(dhakaDateString(new Date('2026-10-28T18:00:00.000Z')), '2026-10-29');
});

test('preset ranges are inclusive and use Dhaka today', () => {
  const now = new Date('2026-10-28T20:00:00.000Z');
  assert.deepEqual(resolveAnalyticsDateRange({ range: 'today' }, now), {
    from: '2026-10-29',
    to: '2026-10-29',
    preset: 'today',
  });
  assert.deepEqual(resolveAnalyticsDateRange({ range: 'yesterday' }, now), {
    from: '2026-10-28',
    to: '2026-10-28',
    preset: 'yesterday',
  });
  assert.deepEqual(resolveAnalyticsDateRange({ range: '7d' }, now), {
    from: '2026-10-23',
    to: '2026-10-29',
    preset: '7d',
  });
  assert.deepEqual(resolveAnalyticsDateRange({ range: '30d' }, now), {
    from: '2026-09-30',
    to: '2026-10-29',
    preset: '30d',
  });
});

test('custom dates are preserved and invalid dates fall back to the last 30 days', () => {
  const now = new Date('2026-10-28T20:00:00.000Z');
  assert.deepEqual(resolveAnalyticsDateRange({
    from: '2026-10-01',
    to: '2026-10-07',
  }, now), {
    from: '2026-10-01',
    to: '2026-10-07',
    preset: 'custom',
  });
  assert.deepEqual(resolveAnalyticsDateRange({ from: '2026-02-30', to: '2026-03-01' }, now), {
    from: '2026-09-30',
    to: '2026-10-29',
    preset: '30d',
  });
  assert.equal(shiftAnalyticsDate('2024-03-01', -1), '2024-02-29');
});

test('known crawler and automation agents are classified without storing user agents', () => {
  assert.equal(isKnownAutomationUserAgent('Googlebot/2.1 (+https://example.test/bot)'), true);
  assert.equal(isKnownAutomationUserAgent('Mozilla/5.0 HeadlessChrome/128.0'), true);
  assert.equal(isKnownAutomationUserAgent('Mozilla/5.0 Chrome/128.0 Safari/537.36'), false);
});

test('traffic identity separates internal, bot, authenticated, guest and unstable IDs', () => {
  const classify = (role, userId, userAgent = 'Chrome', stableVisitorId = true) =>
    classifyAnalyticsTraffic({ role, userId, userAgent, stableVisitorId });
  assert.equal(classify('admin', 'admin-id', 'HeadlessChrome'), 'internal');
  assert.equal(classify(null, null, 'Googlebot/2.1'), 'bot');
  assert.equal(classify('customer', 'customer-id', '', false), 'authenticated');
  assert.equal(classify(null, null, 'Chrome', true), 'guest');
  assert.equal(classify(null, null, 'Chrome', false), 'unidentified');
});
