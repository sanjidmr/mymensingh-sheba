import { getAdminDataClient } from '@/lib/admin/queries';
import { notifyAdmin } from '@/lib/admin-telegram-alerts.server';
import type { AdminTelegramAlertType } from '@/lib/admin-telegram-alerts';
import { TelegramApiError } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TEST_EVENTS: Array<{
  type: AdminTelegramAlertType;
  title: string;
  adminPath: string;
  itemTitle: string;
}> = [
  { type: 'tolet_listing', title: 'বাসা ভাড়ার পোস্ট', adminPath: '/admin/tolet', itemTitle: 'নমুনা বাসা ভাড়ার পোস্ট' },
  { type: 'community_post', title: 'কেনা-বেচার পোস্ট', adminPath: '/admin/posts', itemTitle: 'নমুনা কেনা-বেচার পোস্ট' },
  { type: 'community_post', title: 'চাকরির পোস্ট', adminPath: '/admin/posts', itemTitle: 'নমুনা চাকরির পোস্ট' },
  { type: 'account_created', title: 'নতুন গ্রাহক অ্যাকাউন্ট', adminPath: '/admin/users', itemTitle: 'গ্রাহক অ্যাকাউন্ট' },
  { type: 'tutor_profile', title: 'নতুন গৃহশিক্ষক প্রোফাইল', adminPath: '/admin/verifications', itemTitle: 'গৃহশিক্ষক প্রোফাইল' },
  { type: 'donor_profile', title: 'নতুন রক্তদাতা প্রোফাইল', adminPath: '/admin/blood/donors', itemTitle: 'রক্তদাতা প্রোফাইল' },
  { type: 'tolet_profile', title: 'নতুন বাসা ভাড়া প্রোফাইল', adminPath: '/admin/approvals', itemTitle: 'বাসা ভাড়া প্রোফাইল' },
  { type: 'service_listing', title: 'নতুন সার্ভিস প্রোফাইল', adminPath: '/admin/approvals', itemTitle: 'ওয়াইফাই বা কোচিং সার্ভিস' },
  { type: 'service_request', title: 'নতুন সার্ভিস রিকোয়েস্ট', adminPath: '/admin/requests', itemTitle: 'সকল সার্ভিসের নমুনা রিকোয়েস্ট' },
  { type: 'vehicle_booking', title: 'নতুন যানবাহন বুকিং', adminPath: '/admin/vehicle-bookings/auto', itemTitle: 'অটো বা সিএনজি বুকিং' },
  { type: 'vehicle_request', title: 'নতুন গাড়ি ভাড়ার রিকোয়েস্ট', adminPath: '/admin/vehicle-requests', itemTitle: 'যানবাহন রিকোয়েস্ট' },
  { type: 'blood_request', title: 'নতুন রক্তের অনুরোধ', adminPath: '/admin/notifications', itemTitle: 'রক্তের অনুরোধ' },
  { type: 'blood_donor_reports', title: 'রক্তদাতা প্রোফাইলের রিপোর্ট', adminPath: '/admin/notifications', itemTitle: 'রক্তদাতা রিপোর্ট' },
  { type: 'listing_reports', title: 'পোস্টের রিপোর্ট', adminPath: '/admin/notifications', itemTitle: 'পোস্ট রিপোর্ট' },
  { type: 'tutor_reports', title: 'গৃহশিক্ষক প্রোফাইলের রিপোর্ট', adminPath: '/admin/notifications', itemTitle: 'গৃহশিক্ষক রিপোর্ট' },
  { type: 'staff_profile_reports', title: 'সেবা প্রোফাইলের রিপোর্ট', adminPath: '/admin/notifications', itemTitle: 'সেবা প্রোফাইল রিপোর্ট' },
  { type: 'community_post_reports', title: 'কমিউনিটি পোস্টের রিপোর্ট', adminPath: '/admin/notifications', itemTitle: 'কমিউনিটি পোস্ট রিপোর্ট' },
  { type: 'critical_error', title: 'অ্যাডমিন কার্যক্রমে গুরুতর ত্রুটি', adminPath: '/admin', itemTitle: 'সার্ভার লগ পরীক্ষা করুন' },
  { type: 'tolet_listing_deleted', title: 'বাসা ভাড়ার পোস্ট মুছে ফেলা হয়েছে', adminPath: '/admin/tolet', itemTitle: 'মুছে ফেলা পোস্ট' },
  { type: 'account_deleted', title: 'গ্রাহক অ্যাকাউন্ট মুছে ফেলা হয়েছে', adminPath: '/admin/users', itemTitle: 'মুছে ফেলা অ্যাকাউন্ট' },
  { type: 'contact_message', title: 'নতুন যোগাযোগের বার্তা', adminPath: '/admin/messages', itemTitle: 'যোগাযোগের বার্তা' },
  { type: 'contact_message_reply', title: 'নতুন সাপোর্ট বার্তা', adminPath: '/admin/messages', itemTitle: 'সাপোর্ট বার্তা' },
  { type: 'complaint', title: 'নতুন অভিযোগ', adminPath: '/admin/messages', itemTitle: 'নমুনা অভিযোগ' },
];

export async function POST() {
  const admin = await getAdminDataClient();
  if (!admin) return Response.json({ error: 'Admin authorization required.' }, { status: 403 });

  const results: Array<{
    type: string;
    title: string;
    ok: boolean;
    error?: string;
    telegramResponse?: Awaited<ReturnType<typeof notifyAdmin>>;
  }> = [];
  for (const [index, event] of TEST_EVENTS.entries()) {
    try {
      const telegramResponse = await notifyAdmin(event.type, {
        title: event.title,
        summary: event.itemTitle,
        user_name: 'টেলিগ্রাম পরীক্ষার ব্যবহারকারী',
        user_phone: '01700000000',
        area: 'ময়মনসিংহ',
        item_title: event.itemTitle,
        details: 'এটি একটি নমুনা নোটিফিকেশন। কোনো গ্রাহকের তথ্য নেই।',
        occurred_at: new Date().toISOString(),
        admin_path: event.adminPath,
      });
      results.push({ type: event.type, title: event.title, ok: true, telegramResponse });
    } catch (error) {
      results.push({
        type: event.type,
        title: event.title,
        ok: false,
        error: error instanceof Error ? error.message : 'Telegram send failed.',
        ...(error instanceof TelegramApiError
          ? {
              telegramResponse: error.responses ?? [{
                ok: false,
                error_code: error.errorCode,
                description: error.description,
              }],
            }
          : {}),
      });
    }

    if (index < TEST_EVENTS.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_100));
    }
  }

  const failed = results.filter((result) => !result.ok).length;
  return Response.json(
    { sent: results.length - failed, failed, results },
    { status: failed ? 503 : 200 }
  );
}
