const OPTIMIZABLE_REMOTE_HOSTS = new Set(['images.unsplash.com', 'picsum.photos']);

export function isImageOptimizationSupported(src: string): boolean {
  if (src.startsWith('/') && !src.startsWith('//')) return true;

  try {
    const url = new URL(src);
    return url.protocol === 'https:' && (
      OPTIMIZABLE_REMOTE_HOSTS.has(url.hostname) ||
      url.hostname.endsWith('.supabase.co')
    );
  } catch {
    return false;
  }
}
