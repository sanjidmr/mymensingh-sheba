'use client';
import React from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { bnRelativeTime } from '@/lib/catalog-types';

export default function DashboardNotifications() {
  const { notifications, markNotificationsReadAll } = useAuth();
  const unread = notifications.filter((n) => !n.isRead).length;
  const icon = (t: string) => {
    if (t === 'success') return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" />;
    if (t === 'warning') return <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />;
    if (t === 'danger') return <ShieldAlert className="h-5 w-5 shrink-0 text-rose-700" />;
    return <Info className="h-5 w-5 shrink-0 text-sky-700" />;
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900">নোটিফিকেশন</h1>
          <p className="mt-1 text-[12.5px] text-ink-500">{unread > 0 ? `${unread}টি নতুন বার্তা` : 'সব বার্তা পড়া হয়েছে।'}</p>
        </div>
        {unread > 0 && (
          <button type="button" onClick={markNotificationsReadAll}
            className="min-h-[40px] shrink-0 rounded-xl border border-brand-200 bg-brand-50 px-3 text-[12px] font-bold text-brand-800 hover:bg-brand-100">
            সব পড়া হয়েছে
          </button>
        )}
      </div>
      <div className="divide-y divide-brand-100/70 overflow-hidden rounded-2xl border border-brand-100 bg-white">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-10 w-10 text-brand-200" />
            <p className="mt-2 text-[13px] font-bold text-ink-900">কোনো নোটিফিকেশন নেই</p>
            <p className="mt-1 text-[12px] text-ink-500">পোস্ট অনুমোদন বা বাতিল হলে এখানে জানানো হবে।</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${n.isRead ? 'bg-white' : 'bg-brand-50/50'}`}>
              <div className="mt-0.5">{icon(n.type)}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate text-[13px] font-bold text-ink-900">{n.title}</h4>
                  <span className="shrink-0 text-[10.5px] text-ink-400">{bnRelativeTime(n.createdAt) ?? ''}</span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{n.body}</p>
                {n.linkHref && (
                  <Link href={n.linkHref} className="mt-1.5 inline-block text-[12px] font-bold text-brand-700 hover:underline">
                    বিস্তারিত দেখুন
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
