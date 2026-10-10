'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, ArrowLeft, CheckCircle2, Info, AlertTriangle, ShieldAlert, MoveRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotificationsPage() {
  const { notifications, markNotificationsReadAll } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />;
      case 'danger':
        return <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-700 shrink-0" />;
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await markNotificationsReadAll();
      if (!result.success) setError(result.error || 'নোটিফিকেশন আপডেট ব্যর্থ হয়েছে।');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'নোটিফিকেশন আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">নোটিফিকেশন</span>
        </div>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              নোটিফিকেশন ও আপডেট
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              আপনার রিকোয়েস্ট, প্রোফাইল ও নিরাপত্তা সংক্রান্ত বার্তা
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              disabled={busy}
              className="min-h-11 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 shrink-0"
            >
              {busy ? 'আপডেট হচ্ছে…' : 'সব পড়া হয়েছে'}
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </p>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-500">কোনো নোটিফিকেশন নেই</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors ${
                  notif.isRead ? 'bg-white' : 'bg-emerald-50/30'
                }`}
              >
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString('bn-BD', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
                  {notif.linkHref && (
                    <div className="mt-2">
                      <Link
                        href={notif.linkHref}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        বিস্তারিত দেখুন
                        <MoveRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}