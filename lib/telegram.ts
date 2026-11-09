import 'server-only';

export class TelegramApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'TelegramApiError';
  }
}

function escapeHtmlCharacter(character: string): string {
  switch (character) {
    case '&':
      return '&amp;';
    case '<':
      return '&lt;';
    case '>':
      return '&gt;';
    case '"':
      return '&quot;';
    case "'":
      return '&#39;';
    default:
      return character;
  }
}

function escapeAndLimitHtml(text: string, limit: number): string {
  let result = '';
  let truncated = false;
  const suffix = '…';

  for (const character of text) {
    const escaped = escapeHtmlCharacter(character);
    if (result.length + escaped.length + suffix.length > limit) {
      truncated = true;
      break;
    }
    result += escaped;
  }

  return truncated ? `${result}${suffix}` : result;
}

export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token) throw new Error('Missing required server environment variable: TELEGRAM_BOT_TOKEN');
  if (!chatId) throw new Error('Missing required server environment variable: TELEGRAM_CHAT_ID');

  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: escapeAndLimitHtml(text, 4096),
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error('Telegram sendMessage request failed before receiving a response.', {
      reason: error instanceof Error ? error.name : 'unknown',
    });
    throw new TelegramApiError('Telegram network request failed.', 0);
  }

  let responseBody: string;
  try {
    responseBody = await response.text();
  } catch (error) {
    responseBody = '[response body unavailable]';
    console.error('Telegram response body could not be read.', {
      status: response.status,
      reason: error instanceof Error ? error.name : 'unknown',
    });
  }

  if (!response.ok) {
    console.error('Telegram rejected a sendMessage request.', {
      status: response.status,
      responseBody: responseBody.slice(0, 2000),
    });
    throw new TelegramApiError(`Telegram sendMessage failed with status ${response.status}.`, response.status);
  }
}
