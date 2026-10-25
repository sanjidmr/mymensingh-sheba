import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { normalizeBdPhone } from '@/lib/contact-types';
import { createServerSideClient } from '@/lib/supabase/server';
import { calculateVehicleRoute } from '@/lib/vehicle-routing';
import type { VehicleKind } from '@/lib/catalog-types';
import { getAllMCCAreas } from '@/lib/locations';

export const runtime = 'nodejs';

interface VehicleRequestPayload {
  vehicleListingId?: unknown;
  vehicleKind?: unknown;
  contactName?: unknown;
  contactPhone?: unknown;
  pickupAreaId?: unknown;
  destinationAreaId?: unknown;
  travelDate?: unknown;
  travelTime?: unknown;
  passengerCount?: unknown;
  tripDuration?: unknown;
  budget?: unknown;
  notes?: unknown;
  estimatedDistanceKm?: unknown;
  distanceSource?: unknown;
}

function isVehicleKind(value: unknown): value is VehicleKind {
  return value === 'গাড়ি' || value === 'অটো' || value === 'CNG';
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  let body: VehicleRequestPayload;
  try {
    body = await request.json() as VehicleRequestPayload;
  } catch {
    return NextResponse.json({ error: 'রিকোয়েস্টের তথ্য পড়া যায়নি।' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'রিকোয়েস্টের তথ্য সঠিক নয়।' }, { status: 400 });
  }

  const phone = typeof body.contactPhone === 'string' ? normalizeBdPhone(body.contactPhone) : '';
  const listingId = typeof body.vehicleListingId === 'string' ? body.vehicleListingId : '';
  const pickup = typeof body.pickupAreaId === 'string' ? body.pickupAreaId.trim() : '';
  const destination = typeof body.destinationAreaId === 'string' ? body.destinationAreaId.trim() : '';
  const name = typeof body.contactName === 'string' ? body.contactName.trim() : '';
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId)
    || !isVehicleKind(body.vehicleKind)
    || name.length < 3 || name.length > 80
    || !/^01[3-9]\d{8}$/.test(phone)
    || pickup.length < 2 || pickup.length > 160
    || destination.length < 2 || destination.length > 160
    || pickup.toLocaleLowerCase() === destination.toLocaleLowerCase()
    || !validDate(body.travelDate)
    || typeof body.travelTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.travelTime)
  ) {
    return NextResponse.json({ error: 'নাম, ফোন, পিকআপ, গন্তব্য ও যাত্রার তারিখ-সময় সঠিকভাবে দিন।' }, { status: 400 });
  }
  if (body.passengerCount !== undefined && body.passengerCount !== null
    && (!Number.isInteger(body.passengerCount) || Number(body.passengerCount) < 1 || Number(body.passengerCount) > 100)) {
    return NextResponse.json({ error: 'যাত্রীর সংখ্যা ১ থেকে ১০০-এর মধ্যে হতে হবে।' }, { status: 400 });
  }
  if (body.budget !== undefined && body.budget !== null
    && (!Number.isInteger(body.budget) || Number(body.budget) < 1 || Number(body.budget) > 100_000_000)) {
    return NextResponse.json({ error: 'বাজেটের পরিমাণ সঠিক নয়।' }, { status: 400 });
  }
  if (typeof body.tripDuration === 'string' && body.tripDuration.length > 80) {
    return NextResponse.json({ error: 'ভ্রমণের সময়কালের লেখা বেশি দীর্ঘ।' }, { status: 400 });
  }
  if (typeof body.notes === 'string' && body.notes.length > 1000) {
    return NextResponse.json({ error: 'অতিরিক্ত নির্দেশনা সর্বোচ্চ ১০০০ অক্ষরের মধ্যে লিখুন।' }, { status: 400 });
  }

  let distanceKm: number;
  if (body.distanceSource === 'road_route') {
    try {
      // Recalculate on the server so a client cannot submit a forged route
      // distance. The returned value, not the browser's estimate, is stored.
      distanceKm = (await calculateVehicleRoute(pickup, destination)).distanceKm;
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'দূরত্ব যাচাই করা যায়নি।' },
        { status: 422 }
      );
    }
  } else if (body.distanceSource === 'manual_estimate') {
    const manualDistance = Number(body.estimatedDistanceKm);
    if (!Number.isFinite(manualDistance) || manualDistance < 0.1 || manualDistance > 3000
      || Math.round(manualDistance * 100) !== manualDistance * 100) {
      return NextResponse.json({ error: 'ম্যানুয়াল দূরত্ব ০.১ থেকে ৩০০০ কিমি এবং সর্বোচ্চ ২ দশমিক ঘর পর্যন্ত দিন।' }, { status: 400 });
    }
    distanceKm = manualDistance;
  } else {
    return NextResponse.json({ error: 'দূরত্বের হিসাব করুন অথবা স্পষ্টভাবে ম্যানুয়াল দূরত্ব বাছুন।' }, { status: 400 });
  }

  const client = await createServerSideClient();
  if (!client) {
    return NextResponse.json({ error: 'ডেটাবেস সংযোগ নেই।' }, { status: 503 });
  }
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) {
    return NextResponse.json({ error: 'সেশন যাচাই করা যায়নি। আবার লগইন করে চেষ্টা করুন।' }, { status: 401 });
  }

  let customerId: string | null = null;
  if (sessionData.session) {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'সেশন যাচাই করা যায়নি। আবার লগইন করে চেষ্টা করুন।' }, { status: 401 });
    }
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('status')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (profileError) {
      return NextResponse.json({ error: 'অ্যাকাউন্টের অবস্থা যাচাই করা যায়নি।' }, { status: 503 });
    }
    if (!profile || profile.status !== 'active') {
      return NextResponse.json({ error: 'এই অ্যাকাউন্ট থেকে অনুরোধ পাঠানো যাচ্ছে না।' }, { status: 403 });
    }
    customerId = userData.user.id;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'অনুরোধ সংরক্ষণের সার্ভার কনফিগারেশন নেই।' }, { status: 503 });
  }
  const submissionClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const normalizedPhone = `+880${phone.slice(1)}`;
  const areas = getAllMCCAreas({ activeOnly: true });
  const pickupArea = areas.find((area) => area.nameBn === pickup)?.id ?? pickup;
  const destinationArea = areas.find((area) => area.nameBn === destination)?.id ?? destination;
  const { data, error } = await submissionClient.rpc('fn_submit_vehicle_request', {
    p_vehicle_listing_id: listingId,
    p_vehicle_kind: body.vehicleKind,
    p_contact_name: name,
    p_contact_phone: normalizedPhone,
    p_pickup: pickupArea,
    p_destination: destinationArea,
    p_travel_date: body.travelDate,
    p_travel_time: body.travelTime,
    p_passenger_count: typeof body.passengerCount === 'number' ? body.passengerCount : null,
    p_trip_duration: typeof body.tripDuration === 'string' ? body.tripDuration : null,
    p_budget: typeof body.budget === 'number' ? body.budget : null,
    p_notes: typeof body.notes === 'string' ? body.notes : null,
    p_distance_km: distanceKm,
    p_distance_source: body.distanceSource,
    p_customer_id: customerId,
  });
  if (error) {
    console.error('Vehicle request could not be saved.', { code: error.code });
    const safeMessage = error.code === 'P0001'
      ? error.message
      : 'অনুরোধটি সংরক্ষণ করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।';
    return NextResponse.json({ error: safeMessage }, { status: 400 });
  }
  const { data: savedRequest, error: referenceError } = await submissionClient
    .from('vehicle_requests')
    .select('reference_code')
    .eq('id', data)
    .single();
  if (referenceError || !savedRequest?.reference_code) {
    console.error('Vehicle request reference could not be loaded.', { code: referenceError?.code });
    return NextResponse.json(
      { success: true, requestId: data, warning: 'অনুরোধ জমা হয়েছে; রেফারেন্স নম্বরটি পরে দেখা যাবে।' },
      { status: 201 }
    );
  }
  return NextResponse.json(
    { success: true, requestId: data, referenceCode: savedRequest.reference_code },
    { status: 201 }
  );
}
