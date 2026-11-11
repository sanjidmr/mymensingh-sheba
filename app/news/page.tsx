import type { Metadata } from 'next';
import { Suspense } from 'react';
import NewsPageClient from '@/components/news/NewsPageClient';

export const metadata: Metadata = {
  title: 'ময়মনসিংহের নিউজ — স্থানীয় সংবাদ ও নাগরিক কণ্ঠ',
  description:
    'ময়মনসিংহ ও আশপাশের এলাকার স্থানীয় সংবাদ, নাগরিক কণ্ঠ ও প্রয়োজনীয় তথ্য। প্রকাশিত সংবাদ, ছবি ও প্রতিবেদন এক জায়গায়।',
};

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <NewsPageClient />
    </Suspense>
  );
}
