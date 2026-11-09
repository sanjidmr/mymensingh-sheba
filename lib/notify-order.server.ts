import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { sendTelegram } from '@/lib/telegram';

type OrderRecord = Record<string, unknown>;

const FIELD_LABELS: Record<string, string> = {
  additional_fee: 'অতিরিক্ত চার্জ',
  additional_fee_note_bn: 'অতিরিক্ত চার্জের কারণ',
  additional_info: 'অতিরিক্ত তথ্য',
  address_line: 'ঠিকানা',
  admin_notes: 'অ্যাডমিন নোট',
  alt_phone: 'বিকল্প ফোন',
  area_id: 'এলাকা',
  attachment_url: 'সংযুক্ত ছবি',
  available_from: 'ভাড়া শুরুর তারিখ',
  balconies: 'বারান্দা',
  bathrooms: 'বাথরুম',
  bedrooms: 'বেডরুম',
  budget: 'বাজেট',
  current_address: 'বর্তমান ঠিকানা',
  description: 'বিজ্ঞাপনের বিবরণ',
  destination: 'গন্তব্য',
  destination_address: 'গন্তব্যের ঠিকানা',
  destination_area_id: 'গন্তব্য এলাকা',
  destination_floor: 'গন্তব্যের তলা',
  details: 'বিস্তারিত',
  distance_source: 'দূরত্বের উৎস',
  estimated_distance_km: 'আনুমানিক দূরত্ব (কিমি)',
  estimated_fare: 'আনুমানিক ভাড়া',
  facilities: 'সুবিধাসমূহ',
  floor: 'তলা',
  has_dining_room: 'ডাইনিং রুম আছে',
  has_drawing_room: 'ড্রয়িং রুম আছে',
  has_lift: 'লিফট আছে',
  is_verified: 'যাচাইকৃত',
  moving_items: 'সরানোর জিনিসপত্র',
  notes: 'নোট',
  owner_id: 'বিজ্ঞাপনদাতার আইডি',
  owner_name: 'বিজ্ঞাপনদাতার নাম',
  owner_phone: 'বিজ্ঞাপনদাতার ফোন',
  passenger_count: 'যাত্রীর সংখ্যা',
  parking_info: 'পার্কিং তথ্য',
  pickup_address: 'যাত্রা শুরুর ঠিকানা',
  pickup_area_id: 'যাত্রা শুরুর এলাকা',
  pickup_floor: 'শুরুর তলা',
  pickup_location: 'পিকআপ স্থান',
  photo_urls: 'ছবির লিংক',
  photos: 'ছবির লিংক',
  preferred_date: 'পছন্দের তারিখ',
  preferred_time: 'পছন্দের সময়',
  profile_title: 'প্রোফাইল',
  property_type: 'বাসার ধরন',
  quotation: 'প্রস্তাবিত মূল্য',
  rate_per_km: 'প্রতি কিমি ভাড়া',
  reference_code: 'রেফারেন্স',
  rejection_reason: 'প্রত্যাখ্যানের কারণ',
  rent_price: 'মাসিক ভাড়া',
  requested_at: 'যাত্রার সময়',
  service_code: 'বিজ্ঞাপন কোড',
  specific_address: 'সুনির্দিষ্ট ঠিকানা',
  service_type: 'সেবার ধরন',
  status: 'স্ট্যাটাস',
  total_rooms: 'মোট কক্ষ / সিট',
  unavailable_facilities: 'যে সুবিধাগুলো নেই',
  travel_date: 'যাত্রার তারিখ',
  travel_time: 'যাত্রার সময়',
  trip_duration: 'যাত্রার মেয়াদ',
  vehicle_kind: 'যানবাহনের ধরন',
  vehicle_name: 'যানবাহন',
  published_at: 'প্রকাশের সময়',
};

const COMMON_FIELDS = new Set([
  'id',
  'contact_name',
  'passenger_name',
  'contact_phone',
  'mobile_number',
  'owner_name',
  'owner_phone',
  'address_line',
  'current_address',
  'status',
  'created_at',
  'createdAt',
]);

const SERVICE_LABELS: Record<string, string> = {
  auto: 'অটো ভাড়া',
  cng: 'CNG ভাড়া',
  'basha-paltano': 'বাসা পাল্টানো',
  'home-moving': 'বাসা পাল্টানো',
  'home-tutor': 'গৃহশিক্ষক',
  electrician: 'ইলেকট্রিশিয়ান',
  plumber: 'প্লাম্বার',
  'kajer-bua': 'কাজের বুয়া',
  'ac-fridge': 'এসি ও ফ্রিজ সার্ভিস',
  'gari-auto-cng': 'গাড়ি, অটো ও CNG',
  vehicle_request: 'গাড়ি ভাড়ার অনুরোধ',
  tolet_listing: 'বাসাভাড়ার বিজ্ঞাপন',
};

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => !isEmpty(item))
      .map(([key, item]) => `${FIELD_LABELS[key] ?? key}: ${formatValue(item)}`)
      .join('; ');
  }
  if (typeof value === 'boolean') return value ? 'হ্যাঁ' : 'না';
  return String(value);
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ??
    key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function serviceLabel(serviceType: string): string {
  return SERVICE_LABELS[serviceType] ??
    serviceType.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function adminUrl(path: string): string {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://mymensinghsheba.com')
    .replace(/\/+$/, '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function addProfileContact(order: OrderRecord): Promise<OrderRecord> {
  const profileId = order.owner_id ?? order.customer_id;
  if (
    typeof profileId !== 'string' ||
    (order.contact_name && order.contact_phone) ||
    (order.passenger_name && order.mobile_number) ||
    (order.owner_name && order.owner_phone)
  ) {
    return order;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Order contact details could not be loaded for Telegram.', {
      orderId: String(order.id ?? 'unknown'),
    });
    return order;
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client
      .from('profiles')
      .select('full_name, phone')
      .eq('id', profileId)
      .maybeSingle();
    if (error) {
      console.error('Order contact details could not be loaded for Telegram.', {
        orderId: String(order.id ?? 'unknown'),
        code: error.code,
      });
      return order;
    }
    return {
      ...order,
      owner_name: data?.full_name ?? undefined,
      owner_phone: data?.phone ?? undefined,
    };
  } catch (error) {
    console.error('Order contact details lookup failed for Telegram.', {
      orderId: String(order.id ?? 'unknown'),
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return order;
  }
}

export async function notifyOrder(
  order: OrderRecord,
  serviceType: string,
  adminPath?: string,
  source: 'api' | 'webhook' = 'api'
): Promise<void> {
  const configuredMode = process.env.ORDER_TELEGRAM_DELIVERY_MODE || 'api';
  if (configuredMode !== 'api' && configuredMode !== 'webhook') {
    console.error('Invalid ORDER_TELEGRAM_DELIVERY_MODE; order notification was skipped.');
    return;
  }
  if (configuredMode !== source) return;

  const notificationOrder = await addProfileContact(order);
  const orderId = notificationOrder.id ?? notificationOrder.reference_code ?? notificationOrder.referenceCode ?? 'N/A';
  const customerName =
    notificationOrder.contact_name ??
    notificationOrder.passenger_name ??
    notificationOrder.customer_name ??
    notificationOrder.owner_name;
  const phone =
    notificationOrder.contact_phone ??
    notificationOrder.mobile_number ??
    notificationOrder.phone ??
    notificationOrder.owner_phone;
  const address =
    notificationOrder.address_line ??
    notificationOrder.current_address ??
    notificationOrder.specific_address ??
    notificationOrder.address;
  const createdAt = notificationOrder.created_at ?? notificationOrder.createdAt ?? new Date().toISOString();
  const submittedTime = new Date(String(createdAt)).toLocaleString('bn-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  });
  const path = adminPath ??
    (serviceType === 'tolet_listing'
      ? '/admin/tolet'
      : serviceType === 'vehicle_request'
      ? `/admin/vehicle-requests/${orderId}`
      : serviceType === 'auto' || serviceType === 'cng'
        ? `/admin/vehicle-bookings/${serviceType}`
        : '/admin/requests');

  const lines = [
    '🔔 নতুন অর্ডার / রিকোয়েস্ট',
    `সার্ভিস: ${serviceLabel(serviceType)}`,
    `Order ID: ${orderId}`,
    `Customer নাম: ${isEmpty(customerName) ? 'দেওয়া হয়নি' : formatValue(customerName)}`,
    `Phone: ${isEmpty(phone) ? 'দেওয়া হয়নি' : formatValue(phone)}`,
    `Address: ${isEmpty(address) ? 'দেওয়া হয়নি' : formatValue(address)}`,
    `Status: ${isEmpty(notificationOrder.status) ? 'new' : formatValue(notificationOrder.status)}`,
    `Time: ${submittedTime} (Asia/Dhaka)`,
  ];

  for (const [key, value] of Object.entries(notificationOrder)) {
    if (COMMON_FIELDS.has(key) || isEmpty(value)) continue;
    if (key === 'service_type' && value === serviceType) continue;
    lines.push(`${fieldLabel(key)}: ${formatValue(value)}`);
  }
  lines.push(`Admin panel: ${adminUrl(path)}`);

  try {
    await sendTelegram(lines.join('\n'));
  } catch (error) {
    console.error('Order was saved, but its Telegram notification failed.', {
      orderId: String(orderId),
      serviceType,
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }
}
