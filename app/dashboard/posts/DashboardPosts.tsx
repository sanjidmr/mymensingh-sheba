'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, Loader2, Pencil, Archive, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchMyPosts, deleteCommunityPost } from '@/lib/catalog-service';
import { fetchMyListings, archiveOwnListing } from '@/lib/tolet-service';
import type { CommunityPost } from '@/lib/catalog-types';
import type { ToletListing } from '@/lib/tolet-types';
import { mergeRows, type DashboardRow, type StatusBucket } from '@/lib/dashboard';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

const FILTERS: { id: StatusBucket | 'all'; label: string }[] = [
  { id: 'all', label: 'সব' },
  { id: 'pending', label: 'অপেক্ষায়' },
  { id: 'approved', label: 'অনুমোদিত' },
  { id: 'rejected', label: 'বাতিল' },
];

export default function DashboardPosts() {
  const { user } = useAuth();
  const params = useSearchParams();
  const q = params.get('status');
  const [filter, setFilter] = useState<StatusBucket | 'all'>(
    q === 'pending' || q === 'approved' || q === 'rejected' ? q : 'all'
  );
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [p, l] = await Promise.all([fetchMyPosts(), fetchMyListings(user.id)]);
        if (!active) return;
        setPosts(p);
        setListings(l);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [user]);

  const rows = useMemo(() => mergeRows(posts, listings), [posts, listings]);
  const shown = filter === 'all' ? rows : rows.filter((r) => r.bucket === filter);

  const removeRow = async (row: DashboardRow) => {
    if (!user) return;
    if (!confirm(`"${row.title}" মুছে ফেলবেন?`)) return;
    setBusyId(row.id);
    setError('');
    try {
      if (row.source === 'post') {
        const res = await deleteCommunityPost(row.id);
        if (!res.success) throw new Error(res.error);
        setPosts((prev) => prev.filter((p) => p.id !== row.id));
      } else {
        const res = await archiveOwnListing(row.id, user.id);
        if (!res.success) throw new Error(res.error);
        setListings((prev) => prev.map((l) => (l.id === row.id ? { ...l, status: 'archived' as const } : l)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'মুছতে সমস্যা হয়েছে।');
    } finally {
      setBusyId(null);
    }
  };

  if (!loaded) {
    return <div className="h-64 animate-pulse rounded-2xl bg-mist-100" aria-hidden="true" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900">আমার পোস্ট</h1>
          <p className="mt-1 text-[12.5px] text-ink-500">মোট {rows.length}টি পোস্ট।</p>
        </div>
        <Link href="/dashboard/new" className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-[13px] font-bold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}>
          <PlusCircle className="h-4 w-4" /> নতুন
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-brand-100 bg-white p-1" role="tablist" aria-label="অবস্থা অনুযায়ী ছাঁকুন">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
            className={`min-h-[40px] rounded-lg text-[12px] font-bold ${filter === f.id ? 'bg-brand-700 text-white' : 'text-ink-500 hover:bg-mist-50'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] font-medium text-red-800">{error}</p>}
      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center">
          <p className="text-[13px] font-bold text-ink-900">এই তালিকায় কিছু নেই</p>
          <p className="mx-auto mt-1 max-w-xs text-[12px] text-ink-500">অন্য ফিল্টার দেখুন অথবা নতুন পোস্ট করুন।</p>
          <Link href="/dashboard/new" className={`mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-700 px-5 text-[13px] font-bold text-white ${LIGHT_FOCUS}`}>
            <PlusCircle className="h-4 w-4" /> নতুন পোস্ট করুন
          </Link>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((row) => (
            <li key={`${row.source}-${row.id}`} className="rounded-2xl border border-brand-100 bg-white p-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist-100">
                  <ListingMedia src={row.image} alt={row.title} label={row.title} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-px text-[10px] font-extrabold ${row.statusClass}`}>{row.statusLabel}</span>
                    <span className="text-[10.5px] font-bold text-brand-600">{row.typeLabel}{row.categoryLabel ? ` · ${row.categoryLabel}` : ''}</span>
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-ink-900">{row.title}</h3>
                  {row.rejectionReason && (
                    <p className="mt-1 rounded-lg bg-red-50 px-2 py-1.5 text-[11.5px] leading-relaxed text-red-800">কারণ: {row.rejectionReason}</p>
                  )}
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-brand-100/70 pt-2.5">
                <Link href={row.viewHref} className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-brand-200 text-[12px] font-bold text-brand-700 hover:bg-mist-50 ${LIGHT_FOCUS}`}>
                  <Eye className="h-3.5 w-3.5" /> দেখুন
                </Link>
                {row.editHref ? (
                  <Link href={row.editHref} className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-brand-200 text-[12px] font-bold text-brand-700 hover:bg-mist-50 ${LIGHT_FOCUS}`}>
                    <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                  </Link>
                ) : (
                  <span className="flex min-h-[40px] items-center justify-center rounded-lg bg-mist-50 text-[11px] font-bold text-ink-400">সম্পাদনা নয়</span>
                )}
                <button type="button" disabled={busyId === row.id} onClick={() => removeRow(row)}
                  className="flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-red-200 text-[12px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">
                  {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                  {row.source === 'tolet' ? 'আর্কাইভ' : 'মুছুন'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
