import 'server-only';

export class TelegramApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'TelegramApiError';
  }
}

type TelegramApiResponse = {
  ok?: boolean;
  result?: unknown;
  error_code?: number;
  description?: string;
  parameters?: { retry_after?: number };
};

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
  await requestTelegram('sendMessage', {
    chat_id: getRequiredChatId(),
    text: escapeAndLimitHtml(text, 4096),
    parse_mode: 'HTML',
  });
}

export async function getTelegramBotInfo(): Promise<{
  id: number;
  firstName: string;
  username?: string;
}> {
  const result = await requestTelegram('getMe');
  if (
    typeof result !== 'object' ||
    result === null ||
    !('id' in result) ||
    typeof result.id !== 'number' ||
    !('first_name' in result) ||
    typeof result.first_name !== 'string'
  ) {
    throw new TelegramApiError('Telegram getMe returned an invalid bot response.', 502);
  }
  return {
    id: result.id,
    firstName: result.first_name,
    username: 'username' in result && typeof result.username === 'string'
      ? result.username
      : undefined,
  };
}

function getRequiredToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing required server environment variable: TELEGRAM_BOT_TOKEN');
  return token;
}

function getRequiredChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) throw new Error('Missing required server environment variable: TELEGRAM_CHAT_ID');
  return chatId;
}

async function requestTelegram(method: string, payload?: Record<string, unknown>): Promise<unknown> {
  const token = getRequiredToken();
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      ...(payload
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        : { method: 'GET' }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new TelegramApiError(`Telegram ${method} network request failed.`, 0);
  }

  let responseBody: string;
  try {
    responseBody = await response.text();
  } catch {
    responseBody = '[response body unavailable]';
    console.error('Telegram response body could not be read.', {
      status: response.status,
    });
  }

  let result: TelegramApiResponse = {};
  try {
    result = JSON.parse(responseBody) as TelegramApiResponse;
  } catch {
    if (response.ok) {
      throw new TelegramApiError(`Telegram ${method} returned invalid JSON.`, 502);
    }
  }

  if (!response.ok || result.ok !== true) {
    const status = typeof result.error_code === 'number' ? result.error_code : response.status;
    const retryAfterSeconds = result.parameters?.retry_after;
    console.error('Telegram rejected a sendMessage request.', {
      method,
      status,
      responseBody: responseBody.slice(0, 2000),
    });
    throw new TelegramApiError(
      `Telegram ${method} failed with status ${status}${result.description ? `: ${result.description}` : '.'}`,
      status,
      Number.isInteger(retryAfterSeconds) && retryAfterSeconds! > 0
        ? retryAfterSeconds
        : undefined
    );
  }
  return result.result;
}
