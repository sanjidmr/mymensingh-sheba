'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Droplets,
  Lock,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import {
  adminFetchBloodRequests,
} from '@/lib/blood-donor-service';
import {
  BLOOD_REQUEST_STATUS_META,
} from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodRequest } from '@/lib/supabase/types';

type Tab = 'requests' | 'profiles';

const REQUEST_TABS: { id: string; labelBn: string }[] = [
  { id: 'open', labelBn: 'সকল চলমান' },
  { id: 'pending_review', labelBn: 'পর্যালোচনায়' },
  { id: 'approved', labelBn: 'অনুমোদিত' },
  { id: 'donor_contacted', labelBn: 'যোগাযোগ হয়েছে' },
  { id: 'in_progress', labelBn: 'চলমান' },
  { id: 'completed', labelBn: 'সম্পন্ন' },
  { id: 'rejected', labelBn: 'প্রত্যাখ্যাত' },
  { id: 'cancelled', labelBn: 'বাতিল' },
];

export default function AdminBloodPage() {
  return <AdminBloodDetail />;
}

function AdminBloodDetail() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() =>
    searchParams.get('tab') === 'profiles' ? 'profiles' : 'requests'
  );
  const [reqTab, setReqTab] = useState('open');
  const [reqs, setReqs] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    adminFetchBloodRequests()
      .then((r) => {
        if (!active) return;
        setReqs(r);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'ডেটা লোড ব্যর্থ হয়েছে।');
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openReqs = reqs.filter((r) =>
    ['pending_review', 'approved', 'donor_contacted', 'in_progress'].includes(r.status)
  );
  const filteredReqs = reqTab === 'open' ? openReqs : reqs.filter((r) => r.status === reqTab);

  if (loading) {
    return (
      <AdminLoading label="রক্ত মডারেশন ডেটা লোড হচ্ছে..." />
    );
  }

  return (
    <div>
      <PageHeader
        title="রক্ত মডারেশন"
        description="রক্তের অনুরোধ যাচাই ও রক্তদাতা প্রোফাইল মডারেশন। ব্যক্তিগত নম্বর শুধুমাত্র এখানে ও নিয়ন্ত্রিত মুক্তিতে প্রদর্শিত হয়।"
        count={`মোট ${reqs.length} টি অনুরোধ`}
        actions={<div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-[11px] text-rose-950 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-700" />
            রক্ত কেনা-বেচা সম্পূর্ণ নিষিদ্ধ
          </div>}
      />

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(
            [
              { id: 'requests', labelBn: 'রক্তের অনুরোধ', count: openReqs.length },
              { id: 'profiles', labelBn: 'রক্তদাতা প্রোফাইল' },
            ] as { id: Tab; labelBn: string; count?: number }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-rose-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.labelBn}
              {t.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${tab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <AdminError title="রক্ত মডারেশনে সমস্যা" message={error} className="mb-4" />
        )}

        {loadError ? null : tab === 'requests' ? (
          <RequestList reqTab={reqTab} setReqTab={setReqTab} filteredReqs={filteredReqs} />
        ) : (
          <ProfileList />
        )}
    </div>
  );
}

function RequestList({
  reqTab,
  setReqTab,
  filteredReqs,
}: {
  reqTab: string;
  setReqTab: (t: string) => void;
  filteredReqs: BloodRequest[];
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {REQUEST_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setReqTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              reqTab === t.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.labelBn}
          </button>
        ))}
      </div>

      {filteredReqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          এই অবস্থায় কোনো অনুরোধ নেই।
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReqs.map((r) => {
            const meta = BLOOD_REQUEST_STATUS_META[r.status];
            const area = getAreaById(r.areaId);
            return (
              <Link
                key={r.id}
                href={`/admin/blood/${r.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-rose-300 hover:shadow-sm transition-all no-underline group"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-11 h-11 rounded-xl bg-rose-50 text-rose-800 font-black text-base flex items-center justify-center border border-rose-100 shrink-0">
                      {r.bloodGroup}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{r.patientName}</h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badge}`}>
                          {meta.labelBn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {r.hospitalName} {r.hospitalLocation ? `• ${r.hospitalLocation}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Droplets className="w-3 h-3" /> {r.units} ইউনিট
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {area?.nameBn || r.areaId}
                        </span>
                        {r.donorName && (
                          <span className="inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> {r.donorName}
                            {r.contactReleasedAt ? ' (নম্বর মুক্ত হয়েছে)' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(r.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function ProfileList() {
  return (
    <section className="rounded-admin-card border border-admin-border bg-white p-5 sm:p-7">
      <h2 className="text-base font-bold text-ink-900">রক্তদাতা প্রোফাইল মডারেশন</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-600">
        প্রোফাইল এখন সার্ভার-সাইড অনুসন্ধান, ফিল্টার, পৃষ্ঠা, সুরক্ষিত বিস্তারিত এবং অনুমোদিত অ্যাকশনসহ আলাদা ব্যবস্থাপনা স্ক্রিনে রয়েছে।
      </p>
      <Link href="/admin/blood/donors" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-admin-navy px-4 text-sm font-semibold text-white">
        রক্তদাতা তালিকা খুলুন
      </Link>
    </section>
  );
}