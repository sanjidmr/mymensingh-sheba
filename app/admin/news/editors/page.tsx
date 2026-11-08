import { PageHeader } from '@/components/admin/PageHeader';
import NewsEditorManagement from '@/components/admin/news/NewsEditorManagement';

export const dynamic = 'force-dynamic';

export default function NewsEditorsPage() {
  return (
    <>
      <PageHeader
        title="নিউজ এডিটর ম্যানেজমেন্ট"
        description="নিউজ এডিটর আমন্ত্রণ, অ্যাকাউন্টের অবস্থা, প্রকাশনার অনুমতি ও সংবাদ কার্যক্রম পরিচালনা করুন।"
      />
      <NewsEditorManagement />
    </>
  );
}
