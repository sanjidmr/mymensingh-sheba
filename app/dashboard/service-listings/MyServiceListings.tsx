'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { deleteCustomerServiceListing, fetchMyServiceListings } from '@/lib/catalog-service';
import { SERVICE_LISTING_STATUS_META, type ServiceListing } from '@/lib/catalog-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export default function MyServiceListings() {
  const router = useRouter();
  const [rows, setRows] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchMyServiceListings(true);
        if (active) {
          setRows(data);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'আপনার তালিকা লোড করা যায়নি।');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const remove = async (listing: ServiceListing) => {
    if (!window.confirm(`“${listing.titleBn}” তালিকাটি মুছে ফেলবেন?`)) return;
    setBusyId(listing.id);
    setMessage('');
    const result = await deleteCustomerServiceListing(listing.id);
    setBusyId('');
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setRows((current) => current.filter((row) => row.id !== listing.id));
    setMessage('তালিকাটি মুছে ফেলা হয়েছে।');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-3 py-5 sm:px-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-ink-900">আমার কোচিং ও WiFi তালিকা</h1>
          <p className="mt-1 text-sm text-ink-500">জমা, অনুমোদন এবং হালনাগাদের অবস্থা এখানে দেখুন।</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={`inline-flex min-h-11 items-center gap-1 rounded-lg bg-brand-700 px-3 text-sm font-bold text-white ${LIGHT_FOCUS}`} href="/dashboard/coaching/new"><Plus className="h-4 w-4" />কোচিং জমা</Link>
          <Link className={`inline-flex min-h-11 items-center gap-1 rounded-lg border border-brand-200 px-3 text-sm font-bold text-brand-800 ${LIGHT_FOCUS}`} href="/dashboard/wifi/new"><Plus className="h-4 w-4" />WiFi জমা</Link>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-brand-100 bg-white p-3 text-sm text-ink-700">{message}</p>}
      {loading ? <p className="py-8 text-center text-sm text-ink-500">তালিকা লোড হচ্ছে…</p> : rows.length === 0 ? (
        <section className="rounded-xl border border-brand-100 bg-white p-6 text-center">
          <p className="font-bold text-ink-800">এখনো কোনো তালিকা জমা দেননি।</p>
          <p className="mt-1 text-sm text-ink-500">কোচিং সেন্টার অথবা WiFi প্রদানকারীর তথ্য যোগ করুন।</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const status = SERVICE_LISTING_STATUS_META[row.status ?? 'draft'];
            return (
              <li key={row.id} className="rounded-xl border border-brand-100 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${status.className}`}>{status.labelBn}</span>
                    <h2 className="mt-2 font-extrabold text-ink-900">{row.titleBn}</h2>
                    {row.publicCode && <p className="mt-1 font-mono text-xs font-bold text-brand-700">আইডি: {row.publicCode}</p>}
                    <p className="mt-1 text-sm text-ink-500">{row.category === 'coaching' ? 'কোচিং সেন্টার' : 'WiFi প্রদানকারী'} · {status.descriptionBn}</p>
                    {row.rejectionReason && <p className="mt-2 rounded-md bg-rose-50 p-2 text-sm text-rose-800">কারণ: {row.rejectionReason}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Link className={`inline-flex min-h-10 items-center rounded-lg border border-brand-200 px-3 text-sm font-bold text-brand-800 ${LIGHT_FOCUS}`} href={`/dashboard/${row.category}/${row.id}/edit`}>সম্পাদনা</Link>
                    <button type="button" disabled={busyId === row.id} onClick={() => void remove(row)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-rose-200 px-3 text-sm font-bold text-rose-700 disabled:opacity-60">
                      <Trash2 className="h-4 w-4" />মুছুন
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
