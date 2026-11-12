import { createClient } from '@supabase/supabase-js';

type ParamName = 'id' | 'slug';
type StaticParam = { id: string } | { slug: string };
const STATIC_PARAMS_TIMEOUT_MS = 4000;

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function loadParams(
  name: ParamName,
  load: (
    client: NonNullable<ReturnType<typeof publicClient>>,
    signal: AbortSignal
  ) => PromiseLike<{
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  }>
): Promise<StaticParam[]> {
  const client = publicClient();
  const fallback: StaticParam = name === 'id'
    ? { id: '__app_dynamic__' }
    : { slug: '__app_dynamic__' };
  if (!client) return [fallback];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STATIC_PARAMS_TIMEOUT_MS);
  try {
    const { data, error } = await load(client, controller.signal);
    if (error) {
      if (!isTransientFetchFailure(error)) {
        throw new Error(`Static ${name} routes could not be loaded: ${error.message}`);
      }
      console.warn(`Static ${name} routes are unavailable; exporting a fallback route.`, error.message);
      return [fallback];
    }

    const values = [...new Set((data ?? [])
      .map((row) => row[name])
      .filter((value): value is string => typeof value === 'string' && value.length > 0))];
    if (name === 'id') {
      return values.length ? values.map((id) => ({ id })) : [fallback];
    }
    return values.length ? values.map((slug) => ({ slug })) : [fallback];
  } catch (error) {
    if (!controller.signal.aborted && !isTransientFetchFailure(error)) throw error;
    console.warn(`Static ${name} routes are unavailable; exporting a fallback route.`, error);
    return [fallback];
  } finally {
    clearTimeout(timeout);
  }
}

function isTransientFetchFailure(error: unknown): boolean {
  const name = error && typeof error === 'object' && 'name' in error
    ? String(error.name)
    : '';
  const message = error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : String(error);
  return error instanceof TypeError ||
    name === 'AbortError' ||
    /fetch failed|network|timeout|timed out|enotfound|econn/i.test(message);
}

export function getPublicToletStaticParams(): Promise<StaticParam[]> {
  return loadParams('id', (client, signal) => client
    .from('tolet_listings')
    .select('id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(5000)
    .abortSignal(signal));
}

export function getPublicPostStaticParams(kind: string): Promise<StaticParam[]> {
  return loadParams('slug', (client, signal) => client
    .from('community_posts')
    .select('slug')
    .eq('kind', kind)
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(5000)
    .abortSignal(signal));
}

export function getPublicServiceStaticParams(category: string): Promise<StaticParam[]> {
  return loadParams('slug', (client, signal) => client
    .from('service_listings')
    .select('slug')
    .eq('category', category)
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5000)
    .abortSignal(signal));
}
