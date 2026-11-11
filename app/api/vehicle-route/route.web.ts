import { NextResponse } from 'next/server';
import { calculateVehicleRoute } from '@/lib/vehicle-routing';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { pickup?: unknown; destination?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'অনুরোধের তথ্য পড়া যায়নি।' }, { status: 400 });
  }
  if (!body || typeof body !== 'object'
    || typeof body.pickup !== 'string' || typeof body.destination !== 'string') {
    return NextResponse.json({ error: 'পিকআপ ও গন্তব্য লিখুন।' }, { status: 400 });
  }
  try {
    const estimate = await calculateVehicleRoute(body.pickup, body.destination);
    return NextResponse.json(estimate);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'দূরত্ব হিসাব করা যায়নি।' },
      { status: 422 }
    );
  }
}
