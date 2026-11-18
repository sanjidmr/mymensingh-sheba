import { getAdminDataClient } from '@/lib/admin/queries';
import { notifyAdmin } from '@/lib/admin-telegram-alerts.server';
import {
  getTelegramBotInfo,
  getTelegramChatIds,
  getTelegramChatInfo,
  getTelegramConfigurationStatus,
  TelegramApiError,
} from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const admin = await getAdminDataClient();
  if (!admin) return Response.json({ error: 'Admin authorization required.' }, { status: 403 });

  const configuration = getTelegramConfigurationStatus();
  let botReachable = false;
  let botError: unknown;
  let chatIds: string[] = [];
  let chatConfigurationError: unknown;
  try {
    chatIds = getTelegramChatIds();
  } catch (error) {
    chatConfigurationError = error;
  }

  let bot: Awaited<ReturnType<typeof getTelegramBotInfo>> | null = null;
  try {
    bot = await getTelegramBotInfo();
    botReachable = true;
  } catch (error) {
    botError = error;
  }

  const chatResults = await Promise.allSettled(chatIds.map((chatId) => getTelegramChatInfo(chatId)));
  const chatReachability = chatIds.length
    ? chatResults.map((result) => ({ reachable: result.status === 'fulfilled' }))
    : [{ reachable: false }];
  const chatError = chatResults.find((result) => result.status === 'rejected');

  if (!botReachable || chatReachability.some(({ reachable }) => !reachable)) {
    const error = botError ??
      (chatError?.status === 'rejected' ? chatError.reason : chatConfigurationError);
    const message = error instanceof Error ? error.message : 'Telegram health check failed.';
    const telegramResponse = error instanceof TelegramApiError
      ? {
          ok: false,
          error_code: error.errorCode,
          description: error.description,
        }
      : null;
    console.error('Admin Telegram health check failed.', { error: message, telegramResponse });
    return Response.json(
      {
        ok: false,
        configuration,
        botReachable,
        chatReachability,
        telegramResponse,
        error: message,
      },
      { status: 503 }
    );
  }

  try {
    const telegramResponse = await notifyAdmin('admin_test', {
      title: 'Telegram health check passed',
      summary: 'The bot token and configured chat ID were verified.',
      occurred_at: new Date().toISOString(),
      admin_path: '/admin/settings',
    });
    return Response.json({
      ok: true,
      configuration,
      botReachable,
      chatReachability,
      bot: bot?.username ?? bot?.firstName,
      telegramResponse,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Telegram health check failed.';
    const telegramResponse = error instanceof TelegramApiError
      ? error.responses ?? [{
          ok: false,
          error_code: error.errorCode,
          description: error.description,
        }]
      : null;
    console.error('Admin Telegram health check failed.', { error: message, telegramResponse });
    return Response.json(
      {
        ok: false,
        configuration,
        botReachable,
        chatReachability,
        telegramResponse,
        error: message,
      },
      { status: 503 }
    );
  }
}
