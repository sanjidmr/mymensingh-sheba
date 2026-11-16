'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerListingForm from '@/components/catalog/CustomerListingForm';
import OwnerCoachingSections from '@/components/catalog/OwnerCoachingSections';
import OwnerWifiPackages from '@/components/catalog/OwnerWifiPackages';
import { fetchMyServiceListing } from '@/lib/catalog-service';
import { areaNames, COACHING_CATEGORIES, SERVICE_LISTING_STATUS_META, type CustomerServiceCategory, type ServiceListing } from '@/lib/catalog-types';
import { useAuth } from '@/lib/auth-context';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import SubmissionConfirmation from '@/components/submissions/SubmissionConfirmation';

export default function ServiceListingEditor({
  category,
  listingId,
}: {
  category: CustomerServiceCategory;
  listingId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(Boolean(listingId));
  const [error, setError] = useState('');
  const [submittedListing, setSubmittedListing] = useState<ServiceListing | null>(null);

  useEffect(() => {
    if (!listingId) return;
    let active = true;
    void fetchMyServiceListing(listingId).then((row) => {
      if (!active) return;
      if (!row || row.ownerId !== user?.id || row.category !== category) {
        setError('তালিকাটি পাওয়া যায়নি অথবা এটি সম্পাদনার অনুমতি আপনার নেই।');
      } else {
        setListing(row);
      }
      setLoading(false);
    }).catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : 'তালিকা লোড করা যায়নি।');
      setLoading(false);
    });
    return () => { active = false; };
  }, [category, listingId, user?.id]);

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-ink-500">তালিকা লোড হচ্ছে…</p>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-8"><p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p><button className={`mt-3 min-h-11 rounded-lg border px-4 text-sm font-bold ${LIGHT_FOCUS}`} onClick={() => router.push('/dashboard/profiles')}>আমার তালিকায় ফিরুন</button></div>;
  if (listingId && !listing) return null;
  if (submittedListing) {
    const serviceName = submittedListing.category === 'wifi' ? 'WiFi সার্ভিস' : 'কোচিং';
    return (
      <SubmissionConfirmation
        type="profile"
        id={submittedListing.id}
        serviceName={serviceName}
        summary={[
          `প্রতিষ্ঠানের নাম: ${submittedListing.titleBn}`,
          submittedListing.coachingCategory
            ? `কোচিং ক্যাটাগরি: ${COACHING_CATEGORIES.find((item) => item.id === submittedListing.coachingCategory)?.labelBn ?? submittedListing.coachingCategory}`
            : '',
          areaNames(submittedListing.areaIds) ? `এলাকা: ${areaNames(submittedListing.areaIds)}` : '',
          submittedListing.addressBn ? `ঠিকানা: ${submittedListing.addressBn}` : '',
          submittedListing.contactPhonePublic ? `যোগাযোগ: ${submittedListing.contactPhonePublic}` : '',
          submittedListing.category === 'coaching' && submittedListing.monthlyFeeMin != null
            ? `মাসিক ফি: ৳${submittedListing.monthlyFeeMin.toLocaleString('bn-BD')}`
            : '',
          submittedListing.category === 'wifi' && submittedListing.speedMbps
            ? `সর্বোচ্চ গতি: ${submittedListing.speedMbps} Mbps`
            : '',
          submittedListing.category === 'wifi' && submittedListing.priceMin != null
            ? `মাসিক প্যাকেজ মূল্য: ৳${submittedListing.priceMin.toLocaleString('bn-BD')}${submittedListing.priceMax !== submittedListing.priceMin ? `–৳${submittedListing.priceMax?.toLocaleString('bn-BD') ?? ''}` : ''}`
            : '',
          submittedListing.tags.length ? `বিষয় / সুবিধা: ${submittedListing.tags.join(' · ')}` : '',
          submittedListing.descriptionBn ? `বিস্তারিত: ${submittedListing.descriptionBn}` : '',
        ].filter(Boolean)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-3 py-5 sm:px-5">
      {listing && <div className="rounded-xl border border-brand-100 bg-white p-4"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-bold ${SERVICE_LISTING_STATUS_META[listing.status ?? 'draft'].className}`}>{SERVICE_LISTING_STATUS_META[listing.status ?? 'draft'].labelBn}</span>{listing.publicCode && <p className="mt-2 font-mono text-xs font-bold text-brand-700">তালিকার ID: {listing.publicCode}</p>}<p className="mt-2 text-sm text-ink-600">{listing.status === 'approved' ? 'তথ্য পরিবর্তন করে জমা দিলে নতুন পরিবর্তন অনুমোদিত না হওয়া পর্যন্ত প্রকাশিত হবে না।' : SERVICE_LISTING_STATUS_META[listing.status ?? 'draft'].descriptionBn}</p>{listing.rejectionReason && <p className="mt-2 text-sm text-rose-700">প্রত্যাখ্যানের কারণ: {listing.rejectionReason}</p>}</div>}
      {listing && category === 'coaching' && (
        <OwnerCoachingSections
          listingId={listing.id}
          batchYearEnabled={['ssc', 'hsc', 'bba'].includes(listing.coachingCategory ?? '')}
        />
      )}
      {listing && category === 'wifi' && <OwnerWifiPackages listingId={listing.id} />}
      <CustomerListingForm
        category={category}
        initialListing={listing}
        onSaved={(savedListing, mode) => {
          if (!listingId && mode === 'submit' && savedListing) {
            setSubmittedListing(savedListing);
            return;
          }
          router.push('/dashboard/profiles');
        }}
      />
    </div>
  );
}
