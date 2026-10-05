import { Suspense } from 'react';
import ServicesContent from '@/components/services/ServicesContent';
import { mergeLaunchServices } from '@/lib/site-content';
import { getSiteContentOverrides } from '@/lib/site-content-server';

export const metadata = {
  title: 'সেবা সমূহ',
  description:
    'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেকট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।',
};

/**
 * The public services directory.
 *
 * Server-rendered so the admin's catalog overrides (hidden services, custom
 * titles and images, reordering) are applied before the first byte of HTML.
 * With no overrides saved this renders the built-in catalog unchanged.
 */
export default async function ServicesPage() {
  const overrides = await getSiteContentOverrides();
  const services = mergeLaunchServices(undefined, overrides.launch_services);

  return (
    <Suspense fallback={<div className="p-8 text-center">সেবা তালিকা লোড হচ্ছে…</div>}>
      <ServicesContent services={services} />
    </Suspense>
  );
}