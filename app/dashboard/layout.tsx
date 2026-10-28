'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ADMIN_HOME } from '@/lib/auth-routes';
import AccountShell from '@/components/account/AccountShell';
import SplashScreen from '@/components/site/SplashScreen';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return;
    }
    // A verified admin or news editor belongs in their own area, never in the
    // customer dashboard.
    if (user.role === 'admin') {
      router.replace(ADMIN_HOME);
    }
    if (user.role === 'news_editor') {
      router.replace('/news/editor');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role === 'admin' || user.role === 'news_editor') {
    return <SplashScreen />;
  }

  return <AccountShell>{children}</AccountShell>;
}
