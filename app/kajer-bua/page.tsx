import type { Metadata } from 'next';
import DirectoryPageClient from '@/components/directory/DirectoryPageClient';
import { KAJER_BUA_WORK_TYPES, KAJER_BUA_TIME_SLOTS } from '@/lib/filter-definitions';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';

export const metadata: Metadata = {
  title: 'কাজের বুয়া (গৃহকর্মী) — Mymensingh Sheba',
  description:
    'ময়মনসিংহে অ্যাডমিন-যাচাইকৃত কাজের বুয়া ও গৃহকর্মী খুঁজুন। এলাকা, কাজের ধরন ও সময় অনুযায়ী ফিল্টার করুন।',
};

export default function KajerBuaPage() {
  return (
    <DirectoryPageClient
      serviceKey="kajer-bua"
      title={STAFF_SERVICE_UI['kajer-bua'].heroTitle}
      subtitle={STAFF_SERVICE_UI['kajer-bua'].heroSubtitle}
      breadcrumbs={[{ label: 'কাজের বুয়া' }]}
      placeholder={STAFF_SERVICE_UI['kajer-bua'].supportsSearchPlaceholder}
      workTypes={KAJER_BUA_WORK_TYPES.filter((o) => o.id !== 'all')}
      timeSlots={KAJER_BUA_TIME_SLOTS.filter((o) => o.id !== 'all')}
      variant="profile"
      imageless
      highlights={['অ্যাডমিন পরিচালিত', 'ফোন নম্বর গোপন', 'সরাসরি অনুরোধ']}
    />
  );
}
