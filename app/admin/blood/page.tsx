'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Droplets,
  Lock,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  adminFetchBloodRequests,
  adminFetchDonorProfiles,
  adminUpdateDonorProfile,
} from '@/lib/blood-donor-service';
import { DonorAvatar } from '@/components/blood-donor/DonorCard';
import {
  BLOOD_REQUEST_STATUS_META,
  DONOR_STATUS_META,
} from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodDonorProfile, BloodDonorStatus, BloodRequest } from '@/lib/supabase/types';

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
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('requests');
  const [reqTab, setReqTab] = useState('open');
  const [reqs, setReqs] = useState<BloodRequest[]>([]);
  const [profiles, setProfiles] = useState<BloodDonorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([adminFetchBloodRequests(), adminFetchDonorProfiles()])
      .then(([r, p]) => {
        if (!active) return;
        setReqs(r);
        setProfiles(p);
      })
      .catch(() => {
        if (active) setError('ডেটা লোড ব্যর্থ হয়েছে।');
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-32 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-rose-700" />
          <span className="text-sm">রক্ত মডারেশন ডেটা লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">রক্ত মডারেশন</h1>
            <p className="text-xs text-slate-500 mt-1">
              রক্তের অনুরোধ যাচাই ও রক্তদাতা প্রোফাইল মডারেশন। ব্যক্তিগত নম্বর শুধুমাত্র এখানে ও নিয়ন্ত্রিত মুক্তিতে প্রদর্শিত হয়।
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-[11px] text-rose-950 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-rose-700" />
            রক্ত কেনা-বেচা সম্পূর্ণ নিষিদ্ধ
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          {(
            [
              { id: 'requests', labelBn: 'রক্তের অনুরোধ', count: openReqs.length },
              { id: 'profiles', labelBn: 'রক্তদাতা প্রোফাইল', count: profiles.filter((p) => p.status === 'pending_approval').length },
            ] as { id: Tab; labelBn: string; count: number }[]
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
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${tab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>
        )}

        {tab === 'requests' ? (
          <RequestList reqTab={reqTab} setReqTab={setReqTab} filteredReqs={filteredReqs} />
        ) : (
          <ProfileList profiles={profiles} setProfiles={setProfiles} setError={setError} />
        )}
      </main>
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

function ProfileList({
  profiles,
  setProfiles,
  setError,
}: {
  profiles: BloodDonorProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<BloodDonorProfile[]>>;
  setError: (s: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [pTab, setPTab] = useState<'all' | BloodDonorStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const patch = async (id: string, p: Parameters<typeof adminUpdateDonorProfile>[1]) => {
    setBusyId(id);
    setError('');
    const res = await adminUpdateDonorProfile(id, p);
    setBusyId(null);
    setExpandedId(null);
    if (res.success && res.profile) {
      setProfiles((prev) => prev.map((x) => (x.id === id ? res.profile! : x)));
    } else {
      setError(res.error || 'আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleReject = async (p: BloodDonorProfile) => {
    const reason = window.prompt(`প্রত্যাখ্যান / পরিবর্তনের কারণ লিখুন (তিনি দেখতে পাবেন):\n${p.fullName}`);
    if (reason == null) return;
    if (!reason.trim()) {
      setError('প্রত্যাখ্যানের কারণ লিখতে হবে।');
      return;
    }
    await patch(p.id, { status: 'rejected', rejectionReason: reason.trim() });
  };

  const filtered = profiles.filter((p) => {
    if (pTab !== 'all' && p.status !== pTab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.fullName.toLowerCase().includes(q) && !p.bloodGroup.toLowerCase().includes(q) && !p.id.includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম / রক্তের গ্রুপ খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', labelBn: 'সব' },
              { id: 'pending_approval', labelBn: 'পর্যালোচনায়' },
              { id: 'approved', labelBn: 'সক্রিয়' },
              { id: 'rejected', labelBn: 'প্রত্যাখ্যাত' },
              { id: 'suspended', labelBn: 'নিষ্ক্রিয়' },
            ] as { id: 'all' | BloodDonorStatus; labelBn: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                pTab === t.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.labelBn}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
          কোনো রক্তদাতা পাওয়া যায়নি।
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const meta = DONOR_STATUS_META[p.status];
            const area = getAreaById(p.areaId);
            const isOpen = expandedId === p.id;
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <DonorAvatar donor={p} className="w-12 h-12 text-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{p.fullName}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badge}`}>
                        {meta.labelBn}
                      </span>
                      {p.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3 h-3" /> ভেরিফাইড
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {p.bloodGroup} • {area?.nameBn || p.areaId} • {p.donationCount} বার দান
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : p.id)}
                      className="p-2 rounded-lg hover:bg-slate-100"
                    >
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong>ফোন (শুধু অ্যাডমিন):</strong> {p.privatePhone}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          <strong>এলাকা:</strong> {area?.nameBn || p.areaId}
                        </span>
                      </div>
                      {p.intro && (
                        <p className="text-[11px] text-slate-500">{p.intro}</p>
                      )}
                      {p.rejectionReason && (
                        <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg">
                          <strong>প্রত্যাখ্যানের কারণ:</strong> {p.rejectionReason}
                        </p>
                      )}
                      {p.adminNotes && (
                        <p className="text-[11px] text-slate-500">
                          <strong>অ্যাডমিন নোট:</strong> {p.adminNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {p.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => patch(p.id, { status: 'approved' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          অনুমোদন ও প্রকাশ
                        </button>
                      )}
                      {!p.isVerified && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => patch(p.id, { isVerified: true })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          ভেরিফাইড করুন
                        </button>
                      )}
                      {p.status === 'approved' && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => patch(p.id, { status: 'suspended' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold disabled:opacity-50"
                        >
                          <PauseCircle className="w-4 h-4" />
                          নিষ্ক্রিয় করুন
                        </button>
                      )}
                      {!['rejected', 'suspended'].includes(p.status) && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => handleReject(p)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-semibold disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          প্রত্যাখ্যান
                        </button>
                      )}
                      {(p.status === 'rejected' || p.status === 'suspended') && (
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => patch(p.id, { status: 'pending_approval' })}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4" />
                          পর্যালোচনায় ফেরত
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}