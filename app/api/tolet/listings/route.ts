import { NextResponse } from 'next/server';
import { createServerSideClient } from '@/lib/supabase/server';
import { notifyOrder } from '@/lib/notify-order.server';
import { readBoundedRequestBody } from '@/lib/bounded-request-body';

export const runtime = 'nodejs';

type JsonRecord = Record<string, unknown>;

const PROPERTY_TYPES = new Set([
  'flat',
  'room',
  'sublet',
  'family',
  'bachelor',
  'mess',
  'hostel',
  'seat',
]);

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string' || value.length > maxLength) return null;
  return value.trim();
}

function stringArray(value: unknown, maxItems: number, maxItemLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  if (!value.every((item) => typeof item === 'string' && item.length <= maxItemLength)) return null;
  return value.map((item) => item.trim()).filter(Boolean);
}

function normalizeListingInput(value: unknown, mode: 'draft' | 'submit'): JsonRecord | null {
  if (!isRecord(value)) return null;
  const title = boundedText(value.title, 180);
  const propertyType = value.propertyType;
  const areaId = boundedText(value.areaId, 120);
  const specificAddress = boundedText(value.specificAddress, 500);
  const description = boundedText(value.description, 8_000);
  const floor = value.floor === undefined ? null : boundedText(value.floor, 80);
  const availableFrom = value.availableFrom === undefined ? null : boundedText(value.availableFrom, 80);
  const facilities = stringArray(value.facilities ?? [], 100, 120);
  const unavailableFacilities = stringArray(value.unavailableFacilities ?? [], 100, 120);
  const photos = stringArray(value.photos ?? [], 20, 2_000);
  const rentPrice = value.rentPrice;
  const bedrooms = value.bedrooms;
  const bathrooms = value.bathrooms;
  const balconies = value.balconies;
  const totalRooms = value.totalRooms;
  const hasDrawingRoom = value.hasDrawingRoom ?? false;
  const hasDiningRoom = value.hasDiningRoom ?? false;

  if (
    !title || title.length < 8 ||
    typeof propertyType !== 'string' || !PROPERTY_TYPES.has(propertyType) ||
    areaId === null || specificAddress === null || description === null ||
    floor === null && value.floor !== undefined ||
    availableFrom === null && value.availableFrom !== undefined ||
    !facilities || !unavailableFacilities || !photos ||
    !Number.isInteger(rentPrice) || Number(rentPrice) < 0 || Number(rentPrice) > 500_000 ||
    !Number.isInteger(bedrooms) || Number(bedrooms) < 0 || Number(bedrooms) > 100 ||
    !Number.isInteger(bathrooms) || Number(bathrooms) < 0 || Number(bathrooms) > 100 ||
    !Number.isInteger(balconies) || Number(balconies) < 0 || Number(balconies) > 100 ||
    (totalRooms !== undefined && totalRooms !== null &&
      (!Number.isInteger(totalRooms) || Number(totalRooms) < 1 || Number(totalRooms) > 500)) ||
    typeof hasDrawingRoom !== 'boolean' || typeof hasDiningRoom !== 'boolean'
  ) {
    return null;
  }

  const isMessLike = propertyType === 'mess' || propertyType === 'hostel' || propertyType === 'seat';
  if (
    mode === 'submit' &&
    (!areaId || specificAddress.length < 5 || Number(rentPrice) < 100 ||
      (isMessLike
        ? !Number.isInteger(totalRooms) || Number(totalRooms) < 1
        : Number(bedrooms) < 1))
  ) {
    return null;
  }

  return {
    title,
    property_type: propertyType,
    area_id: areaId,
    specific_address: specificAddress,
    rent_price: rentPrice,
    bedrooms,
    bathrooms,
    balconies,
    has_drawing_room: hasDrawingRoom,
    has_dining_room: hasDiningRoom,
    floor,
    total_rooms: totalRooms ?? null,
    available_from: availableFrom,
    facilities,
    unavailable_facilities: unavailableFacilities,
    description,
    photos,
  };
}

async function readPayload(request: Request): Promise<JsonRecord | NextResponse> {
  try {
    const body = await readBoundedRequestBody(request, 64_000);
    if (body.tooLarge) return NextResponse.json({ error: 'ফর্মের তথ্য অনেক বড়।' }, { status: 413 });
    const payload: unknown = JSON.parse(body.text);
    return isRecord(payload)
      ? payload
      : NextResponse.json({ error: 'ফর্মের তথ্য সঠিক নয়।' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'ফর্মের তথ্য পড়া যায়নি।' }, { status: 400 });
  }
}

async function getOwnerContext(ownerId: string) {
  const client = await createServerSideClient();
  if (!client) return { response: NextResponse.json({ error: 'ডেটাবেস সংযোগ নেই।' }, { status: 503 }) };

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user || userData.user.id !== ownerId) {
    return { response: NextResponse.json({ error: 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার লগইন করুন।' }, { status: 401 }) };
  }
  const { data: profile, error } = await client
    .from('profiles')
    .select('full_name, phone, is_verified, status')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (error) {
    console.error('To-Let listing owner could not be verified.', { code: error.code });
    return { response: NextResponse.json({ error: 'অ্যাকাউন্ট যাচাই করা যায়নি।' }, { status: 503 }) };
  }
  if (!profile || profile.status !== 'active') {
    return { response: NextResponse.json({ error: 'এই অ্যাকাউন্ট থেকে বিজ্ঞাপন জমা দেওয়া যাবে না।' }, { status: 403 }) };
  }

  return { client, profile };
}

function withOwner(row: JsonRecord, profile: { full_name: string; phone: string; is_verified: boolean }) {
  return {
    ...row,
    owner: {
      full_name: profile.full_name,
      phone: profile.phone,
      is_verified: profile.is_verified,
    },
  };
}

export async function POST(request: Request) {
  const payload = await readPayload(request);
  if (payload instanceof NextResponse) return payload;
  const ownerId = typeof payload.owner_id === 'string' ? payload.owner_id : '';
  const mode = payload.mode === 'draft' ? 'draft' : payload.mode === 'submit' ? 'submit' : null;
  const input = normalizeListingInput(payload.input, mode ?? 'submit');
  if (!ownerId || !mode || !input) {
    return NextResponse.json({ error: 'বিজ্ঞাপনের তথ্য সঠিকভাবে পূরণ করুন।' }, { status: 400 });
  }

  const ownerContext = await getOwnerContext(ownerId);
  if ('response' in ownerContext) return ownerContext.response;
  const { client, profile } = ownerContext;
  const { data, error } = await client
    .from('tolet_listings')
    .insert({
      ...input,
      owner_id: ownerId,
      status: mode === 'draft' ? 'draft' : 'pending_review',
    })
    .select('*')
    .single();
  if (error || !data) {
    console.error('To-Let listing could not be saved.', { code: error?.code });
    return NextResponse.json({ error: 'বিজ্ঞাপনটি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 });
  }

  if (mode === 'submit') {
    await notifyOrder(
      { ...data, owner_name: profile.full_name, owner_phone: profile.phone },
      'tolet_listing',
      '/admin/tolet'
    );
  }
  return NextResponse.json({
    success: true,
    listing: withOwner(data as JsonRecord, profile),
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const payload = await readPayload(request);
  if (payload instanceof NextResponse) return payload;
  const ownerId = typeof payload.owner_id === 'string' ? payload.owner_id : '';
  const listingId = typeof payload.listing_id === 'string' ? payload.listing_id : '';
  const mode = payload.mode === 'draft' ? 'draft' : payload.mode === 'submit' ? 'submit' : null;
  const input = normalizeListingInput(payload.input, mode ?? 'submit');
  if (
    !ownerId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId) ||
    !mode ||
    !input
  ) {
    return NextResponse.json({ error: 'বিজ্ঞাপনের তথ্য সঠিকভাবে পূরণ করুন।' }, { status: 400 });
  }

  const ownerContext = await getOwnerContext(ownerId);
  if ('response' in ownerContext) return ownerContext.response;
  const { client, profile } = ownerContext;
  const { data: existing, error: readError } = await client
    .from('tolet_listings')
    .select('id, owner_id, status')
    .eq('id', listingId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (readError) {
    console.error('To-Let listing could not be checked before update.', { code: readError.code });
    return NextResponse.json({ error: 'বিজ্ঞাপনটি যাচাই করা যায়নি।' }, { status: 503 });
  }
  if (!existing) return NextResponse.json({ error: 'বিজ্ঞাপনটি পাওয়া যায়নি।' }, { status: 404 });

  const shouldSubmit = mode === 'submit' &&
    ['rejected', 'draft', 'archived', 'unavailable'].includes(existing.status);
  const patch = {
    ...input,
    ...(shouldSubmit ? { status: 'pending_review', rejection_reason: null } : {}),
  };
  const { data, error } = await client
    .from('tolet_listings')
    .update(patch)
    .eq('id', listingId)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
  if (error || !data) {
    console.error('To-Let listing could not be updated.', { code: error?.code });
    return NextResponse.json({ error: 'বিজ্ঞাপনটি হালনাগাদ করা যায়নি। আবার চেষ্টা করুন।' }, { status: 500 });
  }

  if (shouldSubmit && data.status === 'pending_review') {
    await notifyOrder(
      {
        ...data,
        created_at: data.updated_at,
        owner_name: profile.full_name,
        owner_phone: profile.phone,
      },
      'tolet_listing',
      '/admin/tolet'
    );
  }
  return NextResponse.json({ success: true, listing: withOwner(data as JsonRecord, profile) });
}
