import { NextResponse } from 'next/server';
import { getSiteContentForViewer } from '@/lib/site-content-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const overrides = await getSiteContentForViewer();
  return NextResponse.json(
    { overrides },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}