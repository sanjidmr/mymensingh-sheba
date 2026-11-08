'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function NewsEditorHeader() {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const signOut = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await logout();
      window.location.assign('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'লগআউট করা যায়নি।');
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={busy}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#0c3b2e] px-3 text-xs font-bold text-white hover:bg-[#0a3227] disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        {busy ? 'লগআউট হচ্ছে…' : 'লগআউট'}
      </button>
      {error && <span role="alert" className="absolute right-0 top-full z-10 mt-1 w-56 rounded-md border border-rose-200 bg-white p-2 text-xs text-rose-700 shadow">{error}</span>}
    </div>
  );
}
