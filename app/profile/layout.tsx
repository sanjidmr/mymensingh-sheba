'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
// ⚠️ DEV AUTH BYPASS — remove together with lib/dev-auth-bypass.ts.
import { DEV_AUTH_BYPASS } from '@/lib/dev-auth-bypass';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // DEV AUTH BYPASS — never active in a production build. Opens `/profile`
  // itself without a session; every other `/profile/*` route keeps the normal
  // login gate. Remove this constant (and the two branches below) with the module.
  const devOpened = DEV_AUTH_BYPASS && pathname === '/profile';

  useEffect(() => {
    if (devOpened) return;
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [devOpened, isLoading, user, router]);

  if (devOpened) {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-50 text-sm text-slate-500">
        লোড হচ্ছে...
      </div>
    );
  }

  return <>{children}</>;
}