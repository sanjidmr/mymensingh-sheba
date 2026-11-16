import { getAdminDataClient } from '@/lib/admin/queries';
import { notifyAdmin } from '@/lib/admin-telegram-alerts.server';
import { getTelegramBotInfo } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const admin = await getAdminDataClient();
  if (!admin) return Response.json({ error: 'Admin authorization required.' }, { status: 403 });

  try {
    const bot = await getTelegramBotInfo();
    await notifyAdmin('admin_test', {
      title: 'Telegram health check passed',
      summary: 'The bot token and configured chat ID were verified.',
      occurred_at: new Date().toISOString(),
      admin_path: '/admin/settings',
    });
    return Response.json({ ok: true, bot: bot.username ?? bot.firstName });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telegram health check failed.';
    console.error('Admin Telegram health check failed.', { error: message });
    return Response.json({ ok: false, error: message }, { status: 503 });
  }
}
