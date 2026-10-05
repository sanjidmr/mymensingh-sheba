import { NextResponse } from 'next/server';
import { getSiteContentOverrides } from '@/lib/site-content-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const overrides = await getSiteContentOverrides();
  return NextResponse.json(
    { overrides },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}