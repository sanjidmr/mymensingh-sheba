import 'server-only';

export type TelegramResponseSummary = {
  ok: boolean;
  error_code: number | null;
  description: string | null;
};

export class TelegramApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode: number | null,
    readonly description: string,
    readonly retryAfterSeconds?: number,
    readonly responses?: TelegramResponseSummary[]
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

type TelegramMessageOptions = {
  html?: boolean;
  disableNotification?: boolean;
  disableWebPagePreview?: boolean;
};

const MAX_MESSAGE_LENGTH = 4096;
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_INLINE_RETRY_DELAY_MS = 5_000;

function cleanEnvironmentValue(value: string | undefined): string {
  if (!value) return '';
  let cleaned = value.trim();
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function getRequiredToken(): string {
  const token = cleanEnvironmentValue(process.env.TELEGRAM_BOT_TOKEN);
  if (!token) {
    const message = 'Missing required server environment variable: TELEGRAM_BOT_TOKEN';
    console.error(message);
    throw new Error(message);
  }
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
    const message = 'Invalid TELEGRAM_BOT_TOKEN format.';
    console.error(message);
    throw new Error(message);
  }
  return token;
}

export function getTelegramChatIds(): string[] {
  const value = cleanEnvironmentValue(process.env.TELEGRAM_CHAT_ID);
  if (!value) {
    const message = 'Missing required server environment variable: TELEGRAM_CHAT_ID';
    console.error(message);
    throw new Error(message);
  }

  const chatIds = value.split(',').map((chatId) => chatId.trim()).filter(Boolean);
  if (
    chatIds.length === 0 ||
    chatIds.some((chatId) => !/^-?\d+$/.test(chatId) && !/^@[A-Za-z0-9_]{5,}$/.test(chatId))
  ) {
    const message = 'Invalid TELEGRAM_CHAT_ID format; use numeric IDs or @channel usernames.';
    console.error(message);
    throw new Error(message);
  }
  return chatIds;
}

export function getTelegramConfigurationStatus(): {
  tokenPresent: boolean;
  chatIdsPresent: boolean;
} {
  return {
    tokenPresent: cleanEnvironmentValue(process.env.TELEGRAM_BOT_TOKEN).length > 0,
    chatIdsPresent: cleanEnvironmentValue(process.env.TELEGRAM_CHAT_ID).length > 0,
  };
}

export function assertTelegramConfigured(): void {
  getRequiredToken();
  getTelegramChatIds();
}

export function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitHtmlMessage(text: string): string[] {
  const tokens = text.match(/<[^>]*>|&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);|[\s\S]/giu) ?? [];
  const chunks: string[] = [];
  const openTags: Array<{ name: string; tag: string }> = [];
  let chunk = '';
  let visibleLength = 0;

  for (const token of tokens) {
    const tagMatch = token.match(/^<(\/?)([a-z][a-z0-9]*)(?:\s[^>]*)?>$/i);
    if (tagMatch) {
      chunk += token;
      if (tagMatch[1]) {
        const openTagIndex = openTags.map(({ name }) => name).lastIndexOf(tagMatch[2].toLowerCase());
        if (openTagIndex >= 0) openTags.splice(openTagIndex, 1);
      } else if (!['br', 'hr', 'img'].includes(tagMatch[2].toLowerCase())) {
        openTags.push({ name: tagMatch[2].toLowerCase(), tag: token });
      }
      continue;
    }

    if (visibleLength >= MAX_MESSAGE_LENGTH) {
      chunks.push(`${chunk}${openTags.slice().reverse().map(({ name }) => `</${name}>`).join('')}`);
      chunk = openTags.map(({ tag }) => tag).join('');
      visibleLength = 0;
    }

    chunk += token;
    visibleLength += token.startsWith('&') && token.endsWith(';') ? 1 : [...token].length;
  }

  if (chunk) {
    chunks.push(`${chunk}${openTags.slice().reverse().map(({ name }) => `</${name}>`).join('')}`);
  }
  return chunks.length ? chunks : [''];
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryable(status: number): boolean {
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

async function requestTelegram(
  method: string,
  payload?: Record<string, unknown>
): Promise<TelegramApiResponse> {
  const token = getRequiredToken();
  let totalRetryDelayMs = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const description = error instanceof Error && error.name === 'TimeoutError'
        ? 'Telegram request timed out.'
        : 'Telegram network request failed.';
      console.error('Telegram API request failed.', {
        method,
        attempt,
        http_status: null,
        error_code: null,
        description,
      });
      if (attempt === MAX_ATTEMPTS) {
        throw new TelegramApiError(description, 0, null, description);
      }
      await wait(500 * 2 ** (attempt - 1));
      continue;
    }

    let result: TelegramApiResponse;
    try {
      result = (await response.json()) as TelegramApiResponse;
    } catch {
      const description = 'Telegram returned an invalid JSON response.';
      console.error('Telegram API request failed.', {
        method,
        attempt,
        http_status: response.status,
        error_code: null,
        description,
      });
      if (!retryable(response.status) || attempt === MAX_ATTEMPTS) {
        throw new TelegramApiError(description, response.status, null, description);
      }
      await wait(500 * 2 ** (attempt - 1));
      continue;
    }

    if (response.ok && result.ok === true) {
      console.info('Telegram API request succeeded.', {
        method,
        attempt,
        http_status: response.status,
        ok: true,
        error_code: null,
        description: null,
      });
      return result;
    }

    const errorCode = typeof result.error_code === 'number' ? result.error_code : null;
    const status = errorCode ?? response.status;
    const description = result.description ?? `Telegram ${method} failed.`;
    const retryAfterSeconds = result.parameters?.retry_after;
    const retryDelaySeconds = Number.isFinite(retryAfterSeconds) && retryAfterSeconds! > 0
      ? Math.ceil(retryAfterSeconds!)
      : undefined;
    console.error('Telegram API request failed.', {
      method,
      attempt,
      http_status: response.status,
      ok: false,
      error_code: errorCode,
      description,
    });

    if (!retryable(status) || attempt === MAX_ATTEMPTS) {
      throw new TelegramApiError(
        `Telegram ${method} failed with status ${status}: ${description}`,
        status,
        errorCode,
        description,
        retryDelaySeconds
      );
    }

    const retryDelayMs = status === 429 && retryDelaySeconds
      ? retryDelaySeconds * 1000
      : 500 * 2 ** (attempt - 1);
    if (totalRetryDelayMs + retryDelayMs > MAX_INLINE_RETRY_DELAY_MS) {
      throw new TelegramApiError(
        `Telegram ${method} retry delayed beyond the inline retry budget: ${description}`,
        status,
        errorCode,
        description,
        retryDelaySeconds
      );
    }
    totalRetryDelayMs += retryDelayMs;
    await wait(retryDelayMs);
  }

  throw new TelegramApiError('Telegram request exhausted its retry attempts.', 502, null, 'Retry limit reached.');
}

function responseSummary(response: TelegramApiResponse): TelegramResponseSummary {
  return {
    ok: response.ok === true,
    error_code: typeof response.error_code === 'number' ? response.error_code : null,
    description: typeof response.description === 'string' ? response.description : null,
  };
}

export async function sendTelegramMessage(
  text: string,
  options: TelegramMessageOptions = {}
): Promise<TelegramResponseSummary[]> {
  assertTelegramConfigured();
  const chatIds = getTelegramChatIds();
  const html = options.html ? text : escapeTelegramHtml(text);
  const chunks = splitHtmlMessage(html);
  const responses: TelegramResponseSummary[] = [];
  const errors: TelegramApiError[] = [];
  let sentMessageCount = 0;

  for (const chatId of chatIds) {
    for (const chunk of chunks) {
      if (sentMessageCount > 0) await wait(1100);
      try {
        const response = await requestTelegram('sendMessage', {
          chat_id: chatId,
          text: chunk,
          parse_mode: 'HTML',
          disable_notification: options.disableNotification ?? false,
          disable_web_page_preview: options.disableWebPagePreview ?? true,
        });
        responses.push(responseSummary(response));
      } catch (error) {
        if (!(error instanceof TelegramApiError)) throw error;
        errors.push(error);
        responses.push({
          ok: false,
          error_code: error.errorCode,
          description: error.description,
        });
      }
      sentMessageCount += 1;
    }
  }

  if (errors.length) {
    const firstError = errors[0];
    throw new TelegramApiError(
      `${errors.length} Telegram message(s) could not be delivered: ${firstError.description}`,
      firstError.status,
      firstError.errorCode,
      firstError.description,
      firstError.retryAfterSeconds,
      responses
    );
  }

  return responses;
}

export async function getTelegramBotInfo(): Promise<{
  id: number;
  firstName: string;
  username?: string;
}> {
  const response = await requestTelegram('getMe');
  const result = response.result;
  if (
    typeof result !== 'object' ||
    result === null ||
    !('id' in result) ||
    typeof result.id !== 'number' ||
    !('first_name' in result) ||
    typeof result.first_name !== 'string'
  ) {
    throw new TelegramApiError(
      'Telegram getMe returned an invalid bot response.',
      502,
      null,
      'Invalid bot response.'
    );
  }
  return {
    id: result.id,
    firstName: result.first_name,
    username: 'username' in result && typeof result.username === 'string'
      ? result.username
      : undefined,
  };
}

export async function getTelegramChatInfo(chatId: string): Promise<{
  id: number;
  type: string;
  title?: string;
  username?: string;
}> {
  const response = await requestTelegram('getChat', { chat_id: chatId });
  const result = response.result;
  if (
    typeof result !== 'object' ||
    result === null ||
    !('id' in result) ||
    typeof result.id !== 'number' ||
    !('type' in result) ||
    typeof result.type !== 'string'
  ) {
    throw new TelegramApiError(
      'Telegram getChat returned an invalid chat response.',
      502,
      null,
      'Invalid chat response.'
    );
  }
  return {
    id: result.id,
    type: result.type,
    title: 'title' in result && typeof result.title === 'string' ? result.title : undefined,
    username: 'username' in result && typeof result.username === 'string'
      ? result.username
      : undefined,
  };
}
