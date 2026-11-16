import { getAdminDataClient } from '@/lib/admin/queries';
import { notifyAdmin } from '@/lib/admin-telegram-alerts.server';
import type { AdminTelegramAlertType } from '@/lib/admin-telegram-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TEST_EVENTS: Array<{
  type: AdminTelegramAlertType;
  title: string;
  adminPath: string;
  itemTitle: string;
}> = [
  { type: 'tolet_listing', title: 'New rental post', adminPath: '/admin/tolet', itemTitle: 'Sample rental listing' },
  { type: 'community_post', title: 'New buy/sell, job, or future post', adminPath: '/admin/posts', itemTitle: 'Sample post of any type' },
  { type: 'account_created', title: 'New customer account', adminPath: '/admin/users', itemTitle: 'Customer account' },
  { type: 'tutor_profile', title: 'New home tutor profile', adminPath: '/admin/verifications', itemTitle: 'Tutor profile' },
  { type: 'donor_profile', title: 'New blood donor profile', adminPath: '/admin/blood/donors', itemTitle: 'Donor profile' },
  { type: 'tolet_profile', title: 'New rental owner profile', adminPath: '/admin/approvals', itemTitle: 'Rental owner profile' },
  { type: 'service_listing', title: 'New WiFi/coaching service profile', adminPath: '/admin/approvals', itemTitle: 'WiFi or coaching profile' },
  { type: 'service_request', title: 'New request for any service', adminPath: '/admin/requests', itemTitle: 'home-tutor, kajer-bua, electrician, plumber, ac-fridge, basha-paltano, or future service' },
  { type: 'vehicle_booking', title: 'New auto/CNG booking', adminPath: '/admin/vehicle-bookings/auto', itemTitle: 'auto or CNG' },
  { type: 'vehicle_request', title: 'New vehicle request', adminPath: '/admin/vehicle-requests', itemTitle: 'Vehicle request' },
  { type: 'tolet_listing_deleted', title: 'Rental post deleted', adminPath: '/admin/tolet', itemTitle: 'Deleted rental listing' },
  { type: 'account_deleted', title: 'Customer account deleted', adminPath: '/admin/users', itemTitle: 'Deleted customer account' },
  { type: 'contact_message', title: 'New contact page message', adminPath: '/admin/messages', itemTitle: 'Contact message' },
  { type: 'contact_message_reply', title: 'New profile support message', adminPath: '/admin/messages', itemTitle: 'Support reply' },
  { type: 'complaint', title: 'New complaint', adminPath: '/admin/messages', itemTitle: 'Sample complaint' },
];

export async function POST() {
  const admin = await getAdminDataClient();
  if (!admin) return Response.json({ error: 'Admin authorization required.' }, { status: 403 });

  const results: Array<{ type: string; title: string; ok: boolean; error?: string }> = [];
  for (const [index, event] of TEST_EVENTS.entries()) {
    try {
      await notifyAdmin(event.type, {
        title: event.title,
        summary: event.itemTitle,
        user_name: 'Telegram Test User',
        user_phone: '01700000000',
        area: 'Mymensingh',
        item_title: event.itemTitle,
        details: 'Sample notification. No customer data is included.',
        occurred_at: new Date().toISOString(),
        admin_path: event.adminPath,
      });
      results.push({ type: event.type, title: event.title, ok: true });
    } catch (error) {
      results.push({
        type: event.type,
        title: event.title,
        ok: false,
        error: error instanceof Error ? error.message : 'Telegram send failed.',
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
