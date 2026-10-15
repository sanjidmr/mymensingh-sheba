'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ADMIN_HOME } from '@/lib/auth-routes';
import AccountShell from '@/components/account/AccountShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return;
    }
    // A verified admin belongs in the console, never in the customer dashboard.
    if (user.role === 'admin') {
      router.replace(ADMIN_HOME);
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist-50 text-sm text-slate-500">
        লোড হচ্ছে...
      </div>
    );
  }

  return <AccountShell>{children}</AccountShell>;
}
