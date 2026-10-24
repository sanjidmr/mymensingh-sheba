import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readBoundedRequestBody } from '../lib/bounded-request-body.ts';

const root = new URL('../', import.meta.url);

test('reads a UTF-8 request body up to the configured byte limit', async () => {
  const request = new Request('https://example.test/webhook', {
    method: 'POST',
    body: JSON.stringify({ event: 'delivered', label: 'ময়মনসিংহ' }),
  });

  const result = await readBoundedRequestBody(request, 256);
  assert.deepEqual(result, {
    tooLarge: false,
    text: '{"event":"delivered","label":"ময়মনসিংহ"}',
  });
});

test('rejects bodies larger than the byte limit even without content-length', async () => {
  const chunks = [
    new TextEncoder().encode('1234'),
    new TextEncoder().encode('5678'),
  ];
  let readCount = 0;
  let cancelled = false;
  const request = new Request('https://example.test/webhook', {
    method: 'POST',
    body: new ReadableStream({
      pull(controller) {
        const chunk = chunks[readCount++];
        if (chunk) controller.enqueue(chunk);
        else controller.close();
      },
      cancel() {
        cancelled = true;
      },
    }),
    // Deliberately omit a content-length header.
    duplex: 'half',
  });

  const result = await readBoundedRequestBody(request, 5);
  assert.deepEqual(result, { tooLarge: true });
  assert.equal(cancelled, true);
  assert.equal(readCount, 2);
});

test('rejects invalid UTF-8 rather than silently replacing bytes', async () => {
  const request = new Request('https://example.test/webhook', {
    method: 'POST',
    body: new Uint8Array([0xc3, 0x28]),
  });

  await assert.rejects(readBoundedRequestBody(request, 8), TypeError);
});

test('the forward migration excludes both community-report notification aliases', async () => {
  const migration = await readFile(
    fileURLToPath(new URL('supabase/migrations/20261024120000_admin_email_community_report_deduplication.sql', root)),
    'utf8'
  );
  const exclusionList = migration.match(/IF COALESCE\(NEW\.related_type, ''\) IN \(([\s\S]*?)\) THEN/);

  assert.ok(exclusionList);
  assert.match(exclusionList[1], /'community_post_reports'/);
  assert.match(exclusionList[1], /'community_post_report'/);
});
