import type { TransientAuthRefreshFailure } from '@/lib/fetch-with-timeout';

export function getTransientSessionRestoreMessage(
  event: string,
  hasSession: boolean,
  failure: TransientAuthRefreshFailure | null
): string | null {
  if (event !== 'INITIAL_SESSION' || hasSession || !failure) return null;

  return `সাইন-ইন সেশন যাচাই করা যায়নি${failure.status ? ` (HTTP ${failure.status})` : ''}। সংযোগ ঠিক হলে আবার চেষ্টা করুন।`;
}
