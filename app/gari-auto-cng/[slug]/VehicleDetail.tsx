'use client';

import React, { useEffect, useState } from 'react';
import CatalogDetailView, {
  CatalogDetailMissing,
  ContactBlock,
  DetailSkeleton,
  type DetailFact,
} from '@/components/catalog/CatalogDetailView';
import { createVehicleRequest, fetchServiceListingForContact } from '@/lib/catalog-service';
import { areaNames, CATEGORY_UI, toBn, type ServiceListing, type VehicleKind } from '@/lib/catalog-types';

const ui = CATEGORY_UI.vehicle;

export default function VehicleDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListingForContact('vehicle', slug);
        if (active) setListing(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <DetailSkeleton />;
  if (!listing) return <CatalogDetailMissing ui={ui} />;

  const facts: DetailFact[] = [
    ...(listing.seatCount != null
      ? [{ label: 'সিট সংখ্যা', value: `${toBn(listing.seatCount)} জন` }]
      : []),
    ...(listing.areaIds.length > 0
      ? [{ label: 'এলাকা', value: areaNames(listing.areaIds) }]
      : []),
  ];

  return (
    <CatalogDetailView
      ui={ui}
      listing={listing}
      facts={facts}
      action={<ContactBlock phone={listing.contactPhonePrivate} />}
    >
      <div id="request">
        <VehicleRequestForm listing={listing} />
      </div>
    </CatalogDetailView>
  );
}

function VehicleRequestForm({ listing }: { listing: ServiceListing }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    const kind = listing.tags.find(
      (t): t is VehicleKind => t === 'গাড়ি' || t === 'অটো' || t === 'CNG'
    );
    const result = await createVehicleRequest({
      vehicleListingId: listing.id,
      vehicleKind: kind ?? 'গাড়ি',
      vehicleName: listing.titleBn,
      contactName: name,
      contactPhone: phone,
      travelDate: date || undefined,
      notes: notes || undefined,
    });
    if (result.success) {
      setStatus('sent');
      setMessage('আপনার অনুরোধ পাঠানো হয়েছে। অ্যাডমিন শীঘ্রই যোগাযোগ করবেন।');
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4">
        <h2 className="text-[14px] font-bold text-ink-900 sm:text-base">অনুরোধ পাঠানো হয়েছে</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-600">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4"
    >
      <h2 className="text-[14px] font-bold text-ink-900 sm:text-base">ভাড়ার অনুরোধ</h2>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
        অ্যাকাউন্ট ছাড়াই অনুরোধ পাঠানো যাবে।
      </p>

      <div className="mt-3 space-y-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
          placeholder="আপনার নাম"
          className="min-h-[44px] w-full rounded-lg border border-brand-100 px-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          inputMode="tel"
          placeholder="মোবাইল নম্বর"
          className="min-h-[44px] w-full rounded-lg border border-brand-100 px-3 text-sm outline-none focus:border-brand-500"
        />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          className="min-h-[44px] w-full rounded-lg border border-brand-100 px-3 text-sm outline-none focus:border-brand-500"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="কোন এলাকা থেকে কোন এলাকায়, কত সময়ের জন্য..."
          className="w-full rounded-lg border border-brand-100 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>

      {status === 'error' && (
        <p className="mt-2 text-[12px] font-medium text-red-700" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-3 min-h-[44px] w-full rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {status === 'sending' ? 'পাঠানো হচ্ছে…' : 'অনুরোধ পাঠান'}
      </button>
    </form>
  );
}
