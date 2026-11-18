const token = (process.env.TELEGRAM_BOT_TOKEN ?? '')
  .trim()
  .replace(/^(['"])(.*)\1$/, '$2')
  .trim();

if (!token) {
  console.error('Missing required server environment variable: TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

async function telegram(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json();
  console.log(JSON.stringify({
    method,
    http_status: response.status,
    ok: data.ok === true,
    error_code: data.error_code ?? null,
    description: data.description ?? null,
  }));
  return data;
}

try {
  const me = await telegram('getMe');
  if (!me.ok) process.exitCode = 1;
  else {
    const updates = await telegram('getUpdates', { limit: 100, timeout: 0 });
    if (!updates.ok) process.exitCode = 1;
    else {
      const chats = new Map();
      for (const update of updates.result ?? []) {
        const chat =
          update.message?.chat ??
          update.channel_post?.chat ??
          update.edited_message?.chat ??
          update.edited_channel_post?.chat ??
          update.my_chat_member?.chat ??
          update.chat_member?.chat ??
          update.callback_query?.message?.chat;
        if (chat) {
          chats.set(String(chat.id), {
            id: chat.id,
            type: chat.type,
            title: chat.title ?? null,
            username: chat.username ?? null,
          });
        }
      }
      console.log(JSON.stringify({ discovered_chats: [...chats.values()] }, null, 2));
    }
  }
} catch (error) {
  console.error(JSON.stringify({
    error: error instanceof Error ? error.name : 'Telegram check failed.',
  }));
  process.exitCode = 1;
}
