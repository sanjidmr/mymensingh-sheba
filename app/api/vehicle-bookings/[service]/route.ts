import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { normalizeBdPhone } from '@/lib/contact-types';
import { createServerSideClient } from '@/lib/supabase/server';
import { notifyOrder } from '@/lib/notify-order.server';

export const runtime = 'nodejs';

interface BookingPayload {
  idempotencyKey?: unknown;
  passengerName?: unknown;
  mobileNumber?: unknown;
  currentAddress?: unknown;
  pickupLocation?: unknown;
  destination?: unknown;
  requestedAt?: unknown;
  additionalInfo?: unknown;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isDhakaDateTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(`${value}:00+06:00`);
  return Number.isFinite(date.getTime()) &&
    new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16) === value;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;
  const serviceType = service === 'auto' || service === 'cng' ? service : null;
  if (!serviceType) return NextResponse.json({ error: 'সেবার ধরন সঠিক নয়।' }, { status: 404 });

  let body: BookingPayload;
  try {
    body = await request.json() as BookingPayload;
  } catch {
    return NextResponse.json({ error: 'ফর্মের তথ্য পড়া যায়নি।' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'ফর্মের তথ্য সঠিক নয়।' }, { status: 400 });
  }

  const key = body.idempotencyKey;
  const name = typeof body.passengerName === 'string' ? body.passengerName.trim() : '';
  const phone = typeof body.mobileNumber === 'string' ? normalizeBdPhone(body.mobileNumber) : '';
  const address = typeof body.currentAddress === 'string' ? body.currentAddress.trim() : '';
  const pickup = typeof body.pickupLocation === 'string' ? body.pickupLocation.trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  const extra = typeof body.additionalInfo === 'string' ? body.additionalInfo.trim() : '';

  if (
    !isUuid(key) || name.length < 3 || name.length > 80 ||
    !/^01[3-9]\d{8}$/.test(phone) ||
    address.length < 3 || address.length > 240 ||
    pickup.length < 2 || pickup.length > 160 ||
    destination.length < 2 || destination.length > 160 ||
    !isDhakaDateTime(body.requestedAt) ||
    extra.length > 1000
  ) {
    return NextResponse.json({ error: 'সব প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন। মোবাইল নম্বরটি যাচাই করুন।' }, { status: 400 });
  }

  const requestedAt = new Date(`${body.requestedAt}:00+06:00`);
  if (requestedAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'ভবিষ্যতের যাত্রার তারিখ ও সময় বেছে নিন।' }, { status: 400 });
  }

  const client = await createServerSideClient();
  if (!client) return NextResponse.json({ error: 'ডেটাবেস সংযোগ নেই।' }, { status: 503 });

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    return NextResponse.json({ error: 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার চেষ্টা করুন।' }, { status: 401 });
  }
  if (!sessionData.session) {
    return NextResponse.json(
      { error: 'বুকিং অনুরোধ পাঠাতে আগে লগইন করুন।' },
      { status: 401 }
    );
  }
  let customerId: string | null = null;
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার লগইন করে চেষ্টা করুন।' }, { status: 401 });
  }
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError) return NextResponse.json({ error: 'অ্যাকাউন্টের অবস্থা যাচাই করা যায়নি।' }, { status: 503 });
  if (!profile || profile.status !== 'active' || profile.role === 'news_editor') {
    return NextResponse.json({ error: 'এই অ্যাকাউন্ট থেকে বুকিং অনুরোধ পাঠানো যাবে না।' }, { status: 403 });
  }
  customerId = userData.user.id;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'বুকিং সংরক্ষণের সার্ভার কনফিগারেশন নেই।' }, { status: 503 });
  }
  const submissionClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await submissionClient
    .from('vehicle_bookings')
    .insert({
      idempotency_key: key,
      service_type: serviceType,
      passenger_name: name,
      mobile_number: `+880${phone.slice(1)}`,
      current_address: address,
      pickup_location: pickup,
      destination,
      requested_at: requestedAt.toISOString(),
      additional_info: extra || null,
      customer_id: customerId,
    })
    .select('*')
    .single();

  if (error?.code === '23505') {
    const { data: existing, error: lookupError } = await submissionClient
      .from('vehicle_bookings')
      .select('id, service_type')
      .eq('idempotency_key', key)
      .maybeSingle();
    if (lookupError) {
      console.error('Vehicle booking idempotency lookup failed.', { code: lookupError.code });
      return NextResponse.json({ error: 'অনুরোধের অবস্থা যাচাই করা যায়নি। আবার চেষ্টা করুন।' }, { status: 503 });
    }
    if (existing?.service_type === serviceType) {
      return NextResponse.json({ success: true, bookingId: existing.id }, { status: 200 });
    }
    return NextResponse.json({ error: 'অনুরোধটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' }, { status: 409 });
  }
  if (error || !data) {
    console.error('Vehicle booking could not be saved.', { code: error?.code });
    return NextResponse.json({ error: 'অনুরোধটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 });
  }

  await notifyOrder(data as Record<string, unknown>, serviceType, `/admin/vehicle-bookings/${serviceType}`);

  return NextResponse.json({ success: true, bookingId: data.id }, { status: 201 });
}
