import { NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error(JSON.stringify({
      event: 'health.database_check_failed',
      reason: 'Supabase URL or anon key is not configured',
    }));
    return NextResponse.json(
      { status: 'unhealthy', checks: { database: 'unavailable' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const startedAt = Date.now();
  try {
    const response = await fetchWithTimeout(
      new URL(
        '/rest/v1/platform_settings?select=key&key=eq.tolet_fee_rules&limit=1',
        supabaseUrl
      ),
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      },
      15_000
    );
    await response.body?.cancel();
    if (!response.ok) {
      console.error(JSON.stringify({
        event: 'health.database_check_failed',
        status: response.status,
        durationMs: Date.now() - startedAt,
      }));
      return NextResponse.json(
        { status: 'unhealthy', checks: { database: 'unavailable' } },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { status: 'ok', checks: { database: 'ok' } },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const candidate =
      error && typeof error === 'object'
        ? (error as { message?: unknown; name?: unknown })
        : null;
    console.error(JSON.stringify({
      event: 'health.database_check_failed',
      durationMs: Date.now() - startedAt,
      errorName: typeof candidate?.name === 'string' ? candidate.name : undefined,
      reason: typeof candidate?.message === 'string' ? candidate.message : String(error),
    }));
    return NextResponse.json(
      { status: 'unhealthy', checks: { database: 'unavailable' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
