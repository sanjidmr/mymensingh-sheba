import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeBdPhone } from '@/lib/contact-types';
import { notifyOrder } from '@/lib/notify-order.server';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';

export const runtime = 'nodejs';

type OrderPayload = Record<string, unknown>;

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return undefined;
  return value.trim() || null;
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let payload: OrderPayload;
  try {
    const body = await readBoundedRequestBody(request, 1_000_000);
    if (body.tooLarge) return NextResponse.json({ error: 'অনুরোধের তথ্য অনেক বড়।' }, { status: 413 });
    payload = JSON.parse(body.text) as OrderPayload;
  } catch {
    return NextResponse.json({ error: 'ফর্মের তথ্য পড়া যায়নি।' }, { status: 400 });
  }
  if (!isRecord(payload)) {
    return NextResponse.json({ error: 'ফর্মের তথ্য সঠিক নয়।' }, { status: 400 });
  }

  const serviceType = typeof payload.service_type === 'string' ? payload.service_type.trim() : '';
  const slug = typeof payload.service_slug === 'string' ? payload.service_slug.trim() : serviceType;
  const areaId = optionalText(payload.area_id);
  const address = optionalText(payload.address_line);
  const name = optionalText(payload.contact_name);
  const phoneInput = typeof payload.contact_phone === 'string' ? payload.contact_phone : '';
  const phone = normalizeBdPhone(phoneInput);
  if (
    !/^[a-z0-9_-]{1,80}$/i.test(serviceType) ||
    !/^[a-z0-9_-]{1,80}$/i.test(slug) ||
    !areaId || areaId.length > 120 || !address || !name || name.length < 3 ||
    !/^01[3-9]\d{8}$/.test(phone) ||
    (payload.preferred_date !== undefined && payload.preferred_date !== null && !isValidDate(payload.preferred_date))
  ) {
    return NextResponse.json({ error: 'নাম, ফোন, এলাকা ও ঠিকানাসহ প্রয়োজনীয় তথ্য সঠিকভাবে দিন।' }, { status: 400 });
  }

  const optionalFields = {
    preferred_time: optionalText(payload.preferred_time),
    details: optionalText(payload.details),
    service_label: optionalText(payload.service_label),
    profile_id: optionalText(payload.profile_id),
    profile_title: optionalText(payload.profile_title),
    attachment_url: optionalText(payload.attachment_url),
    pickup_address: optionalText(payload.pickup_address),
    destination_address: optionalText(payload.destination_address),
    pickup_floor: optionalText(payload.pickup_floor),
    destination_floor: optionalText(payload.destination_floor),
    parking_info: optionalText(payload.parking_info),
    pickup_area_id: optionalText(payload.pickup_area_id),
    destination_area_id: optionalText(payload.destination_area_id),
  };
  if (Object.values(optionalFields).some((value) => value === undefined)) {
    return NextResponse.json({ error: 'ফর্মের ঐচ্ছিক তথ্য সঠিক নয়।' }, { status: 400 });
  }
  if (
    (payload.has_lift !== undefined && payload.has_lift !== null && typeof payload.has_lift !== 'boolean') ||
    (payload.moving_items !== undefined && !Array.isArray(payload.moving_items)) ||
    (payload.photo_urls !== undefined && !Array.isArray(payload.photo_urls)) ||
    (payload.service_meta !== undefined && payload.service_meta !== null && !isRecord(payload.service_meta))
  ) {
    return NextResponse.json({ error: 'ফর্মের অতিরিক্ত তথ্য সঠিক নয়।' }, { status: 400 });
  }

  const client = await createServerSideClient();
  if (!client) return NextResponse.json({ error: 'ডেটাবেস সংযোগ নেই।' }, { status: 503 });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: 'অনুরোধ পাঠাতে আগে লগইন করুন।' }, { status: 401 });
  }
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Service request account status could not be checked.', { code: profileError.code });
    return NextResponse.json({ error: 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার চেষ্টা করুন।' }, { status: 503 });
  }
  if (!profile || profile.status !== 'active' || profile.role === 'news_editor') {
    return NextResponse.json({ error: 'এই অ্যাকাউন্ট থেকে অনুরোধ পাঠানো যাবে না।' }, { status: 403 });
  }

  const movingItems = payload.moving_items ?? [];
  const photoUrls = payload.photo_urls ?? [];
  if (
    !Array.isArray(movingItems) || movingItems.length > 100 ||
    !Array.isArray(photoUrls) || photoUrls.length > 20
  ) {
    return NextResponse.json({ error: 'ফর্মের অতিরিক্ত তথ্য অনুমোদিত সীমা ছাড়িয়েছে।' }, { status: 400 });
  }

  const row = {
    customer_id: userData.user.id,
    service_slug: slug,
    status: 'new',
    area_id: areaId,
    address_line: address,
    contact_name: name,
    contact_phone: phone,
    preferred_date: payload.preferred_date ?? null,
    preferred_time: optionalFields.preferred_time ?? null,
    details: optionalFields.details ?? null,
    profile_id: optionalFields.profile_id ?? null,
    profile_title: optionalFields.profile_title ?? null,
    service_type: optionalFields.service_label ?? null,
    attachment_url: optionalFields.attachment_url ?? null,
    pickup_area_id: optionalFields.pickup_area_id ?? null,
    destination_area_id: optionalFields.destination_area_id ?? null,
    pickup_address: optionalFields.pickup_address ?? null,
    destination_address: optionalFields.destination_address ?? null,
    pickup_floor: optionalFields.pickup_floor ?? null,
    destination_floor: optionalFields.destination_floor ?? null,
    has_lift: payload.has_lift === true,
    parking_info: optionalFields.parking_info ?? null,
    moving_items: movingItems,
    photo_urls: photoUrls,
    service_meta: payload.service_meta ?? null,
  };
  const { data, error } = await client
    .from('service_requests')
    .insert(row)
    .select('*')
    .single();
  if (error || !data) {
    console.error('Service request could not be saved.', { code: error?.code });
    return NextResponse.json({ error: 'অনুরোধটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 });
  }

  await notifyOrder(data, slug, '/admin/requests');
  return NextResponse.json({
    success: true,
    requestId: data.id,
    reference: data.reference_code ?? undefined,
    attachmentUrl: data.attachment_url ?? undefined,
  }, { status: 201 });
}
