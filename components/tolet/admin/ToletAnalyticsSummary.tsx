'use client';

import { useEffect, useState } from 'react';
import { Eye, Home, MessageCircle, Phone } from 'lucide-react';
import { adminFetchToletPlatformSummary } from '@/lib/tolet-tracking';
import { toBengaliDigits } from '@/lib/bengali-numerals';

type Summary = Awaited<ReturnType<typeof adminFetchToletPlatformSummary>>;

const METRICS = [
  { key: 'directoryVisits', label: 'ভাড়া ডিরেক্টরি ভিজিট', icon: Home },
  { key: 'views', label: 'মোট বিজ্ঞাপন ভিউ', icon: Eye },
  { key: 'callClicks', label: 'কল বাটন চাপা', icon: Phone },
  { key: 'whatsappClicks', label: 'WhatsApp বাটন চাপা', icon: MessageCircle },
] as const;

export default function ToletAnalyticsSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let loading = false;
    const load = async () => {
      if (loading) return;
      loading = true;
      try {
        const result = await adminFetchToletPlatformSummary();
        if (active) {
          setSummary(result);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'পরিসংখ্যান লোড করা যায়নি।');
      } finally {
        loading = false;
      }
    };
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 30_000);
    return () => {
      active = false;
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section aria-label="বাসা ভাড়ার মোট পরিসংখ্যান" className="mb-4">
      {error ? (
        <p role="alert" className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {error}
        </p>
      ) : null}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METRICS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </dt>
            <dd className="mt-1 text-lg font-extrabold leading-none tabular-nums text-slate-900">
              {summary ? toBengaliDigits(summary[key]) : '—'}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-1 text-[10px] text-slate-500">
        সব বিজ্ঞাপনের মোট ইভেন্ট; কল ও WhatsApp সংখ্যা বাটন চাপার হিসাব, সম্পন্ন যোগাযোগ নয়।
      </p>
    </section>
  );
}
