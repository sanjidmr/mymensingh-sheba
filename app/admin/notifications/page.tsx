'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Bell,
  CheckCircle2,
  Info,
  AlertTriangle,
  ShieldAlert,
  MoveRight,
  ArrowLeft,
  MoreHorizontal,
  MailOpen,
  Trash2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { adminFetchNotifications, adminMarkNotificationsRead } from '@/lib/admin-service';
import type { NotificationItem } from '@/lib/supabase/types';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminFetchNotifications()
      .then((data) => {
        if (active) setNotifications(data);
      })
      .catch(() => {
        if (active) setError('নোটিফিকেশন লোড ব্যর্থ হয়েছে');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleMarkAllRead = async () => {
    setBusy(true);
    const res = await adminMarkNotificationsRead();
    setBusy(false);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span className="text-sm">নোটিফিকেশন লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800">
              <ArrowLeft className="w-3.5 h-3.5" /> অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">অ্যাডমিন নোটিফিকেশন হাব</h1>
            <p className="text-xs text-slate-500 mt-1">
              নতুন রিকোয়েস্ট, রিপোর্ট, ভেরিফিকেশন রিকোয়েস্টের সারসংক্ষেপ
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={busy}
              className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50 shrink-0"
            >
              সব পঠিত চিহ্নিত
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs text-slate-500">কোনো অ্যাডমিন নোটিফিকেশন নেই</p>
              <p className="text-[11px] text-slate-400 mt-1">নতুন রিকোয়েস্ট, রিপোর্ট বা ভেরিফিকেশনের সময় এখানে দেখাবে।</p>
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
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notif.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {notif.targetRole === 'admin' ? 'অ্যাডমিন হাব' : 'ব্যক্তিগত'}
                    </span>
                    {notif.relatedType && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {notif.relatedType}
                      </span>
                    )}
                    {notif.linkHref && (
                      <Link
                        href={notif.linkHref}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        বিস্তারিত দেখুন
                        <MoveRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}