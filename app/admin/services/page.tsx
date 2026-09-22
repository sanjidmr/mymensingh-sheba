'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Search, Filter, Edit, Trash2, Eye, ShieldCheck, Zap, MoreVertical, Loader2 } from 'lucide-react';
import { adminFetchStaffProfiles, deleteStaffProfile } from '@/lib/staff-service';
import type { StaffProfile } from '@/lib/staff-types';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { STAFF_ACCENT_CLASSES, staffWorkTypeLabels } from '@/lib/staff-labels';
import { getAreaById } from '@/lib/locations';
import { resolveStaffImageUrl } from '@/lib/staff-service';
import Navbar from '@/components/Navbar';

const SERVICE_SLUGS = ['kajer-bua', 'electrician', 'plumber'] as const;

export default function AdminServicesPage() {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let all: StaffProfile[] = [];
      for (const slug of SERVICE_SLUGS) {
        const data = await adminFetchStaffProfiles(slug);
        all = [...all, ...data];
      }
      setProfiles(all);
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('এই প্রোফাইলটি স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?')) return;
    setDeletingId(id);
    const res = await deleteStaffProfile(id);
    if (res.success) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(res.error || 'মুছে ফেলা ব্যর্থ হয়েছে');
    }
    setDeletingId(null);
  };

  const filtered = React.useMemo(() => {
    let result = profiles;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nameBn.toLowerCase().includes(q) ||
          p.titleBn.toLowerCase().includes(q) ||
          p.id.includes(q)
      );
    }
    if (serviceFilter !== 'all') {
      result = result.filter((p) => p.serviceSlug === serviceFilter);
    }
    return result;
  }, [profiles, search, serviceFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">কর্মী প্রোফাইল বাঁচাই</h1>
            <p className="text-sm text-slate-600 mt-1">
              কাজের বুয়া, ইলেকট্রিশিয়ান ও প্লাম্বার প্রোফাইল তৈরি, সম্পাদনা ও পরিচালনা করুন।
            </p>
          </div>
          <Link
            href="/admin/services/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            নতুন প্রোফাইল
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="নাম, পদবি বা আইডি দিয়ে খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="all">সব সার্ভিস</option>
              <option value="kajer-bua">কাজের বুয়া</option>
              <option value="electrician">ইলেকট্রিশিয়ান</option>
              <option value="plumber">প্লাম্বার</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-xl mb-4" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">প্রোফাইল পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-500 mt-1">ফিল্টার বা সার্চ পরিবর্তন করে চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((profile) => {
              const ui = STAFF_SERVICE_UI[profile.serviceSlug];
              const accent = STAFF_ACCENT_CLASSES[ui?.accent || 'emerald'];
              const areas = profile.areaIds.map((id) => getAreaById(id)?.nameBn).filter(Boolean);
              const labels = staffWorkTypeLabels(profile.serviceSlug, profile.workTypes);

              return (
                <div
                  key={profile.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {profile.imageUrl ? (
                      <Image
                        src={resolveStaffImageUrl(profile.imageUrl)}
                        alt={profile.nameBn}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
                        <span className="text-4xl font-black text-white/90">{profile.nameBn.charAt(0)}</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${accent.chip}`}>
                        {ui?.nameBn || profile.serviceSlug}
                      </span>
                      <div className="flex items-center gap-1">
                        {profile.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700/95 px-2.5 py-1 rounded-full border border-white/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {profile.isEmergency && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-100 bg-rose-700/90 px-2.5 py-1 rounded-full border border-white/30">
                            <Zap className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <Link
                      href={`/admin/services/${profile.id}`}
                      className="block group"
                    >
                      <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {profile.nameBn}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{profile.titleBn}</p>
                    </Link>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {labels.slice(0, 2).map((l) => (
                        <span key={l} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {l}
                        </span>
                      ))}
                      {labels.length > 2 && <span className="text-[11px] text-slate-500">+{labels.length - 2}</span>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold">{profile.experienceYears} বছর অভিজ্ঞতা</span>
                        <span>•</span>
                        <span>{areas.join(', ') || 'সব এলাকা'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/services/${profile.id}`}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/services/${profile.id}/edit`}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                          title="সুনির্দিষ্ট করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          disabled={deletingId === profile.id}
                          className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 disabled:opacity-50"
                          title="মুছুন"
                        >
                          {deletingId === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}