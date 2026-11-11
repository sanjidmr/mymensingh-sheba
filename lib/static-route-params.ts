import { createClient } from '@supabase/supabase-js';

type ParamName = 'id' | 'slug';
type StaticParam = { id: string } | { slug: string };

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
  load: (client: NonNullable<ReturnType<typeof publicClient>>) => PromiseLike<{
    data: Array<Record<string, unknown>> | null;
    error: { message: string } | null;
  }>
): Promise<StaticParam[]> {
  const client = publicClient();
  const fallback: StaticParam = name === 'id'
    ? { id: '__app_dynamic__' }
    : { slug: '__app_dynamic__' };
  if (!client) return [fallback];

  const { data, error } = await load(client);
  if (error) throw new Error(`Static ${name} routes could not be loaded: ${error.message}`);
  const values = [...new Set((data ?? [])
    .map((row) => row[name])
    .filter((value): value is string => typeof value === 'string' && value.length > 0))];
  if (name === 'id') {
    return values.length ? values.map((id) => ({ id })) : [fallback];
  }
  return values.length ? values.map((slug) => ({ slug })) : [fallback];
}

export function getPublicToletStaticParams(): Promise<StaticParam[]> {
  return loadParams('id', (client) => client
    .from('tolet_listings')
    .select('id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(5000));
}

export function getPublicPostStaticParams(kind: string): Promise<StaticParam[]> {
  return loadParams('slug', (client) => client
    .from('community_posts')
    .select('slug')
    .eq('kind', kind)
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(5000));
}

export function getPublicServiceStaticParams(category: string): Promise<StaticParam[]> {
  return loadParams('slug', (client) => client
    .from('service_listings')
    .select('slug')
    .eq('category', category)
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5000));
}
