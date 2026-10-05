import { fetchHeroSlides } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import HeroManager from '@/components/admin/hero/HeroManager';

export const dynamic = 'force-dynamic';

export default async function AdminHeroPage() {
  const { rows, unavailable } = await fetchHeroSlides();

  return (
    <>
      <PageHeader
        title="হিরো ম্যানেজমেন্ট"
        description="হোমপেজের ব্যানার ক্যারোসেল। ছবি আপলোড, বদলানো, ক্রম ঠিক করা এবং স্লাইড চালু/বন্ধ করা যায়। পরিবর্তন সাথে সাথে ওয়েবসাইটে কার্যকর হয়।"
      />

      {unavailable ? (
        <AdminError
          title="ডেটাবেজ সংযুক্ত নেই"
          message="হিরো স্লাইড টেবিলটি পাওয়া যায়নি। মাইগ্রেশন চালান।"
        />
      ) : (
        <HeroManager initialSlides={rows} />
      )}
    </>
  );
}