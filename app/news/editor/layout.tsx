import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NewsEditorHeader } from '@/components/news/editor/NewsEditorHeader';
import { getNewsRouteRole } from '@/lib/news/news-authorization.server';

export const dynamic = 'force-dynamic';

export default async function NewsEditorLayout({ children }: { children: React.ReactNode }) {
  const role = await getNewsRouteRole();
  if (role === 'admin') redirect('/admin/news');
  if (role !== 'news_editor') redirect('/login?next=%2Fnews%2Feditor');

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f2] text-[#141414]">
      <header className="border-b border-[#ded9ce] bg-white">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#8a6b2f]">ময়মনসিংহ শেবা · সংবাদ ডেস্ক</p>
            <p className="mt-0.5 truncate font-[family-name:var(--font-news-serif)] text-lg font-black">নিউজ এডিটর ড্যাশবোর্ড</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/news" target="_blank" rel="noreferrer" className="hidden min-h-10 items-center rounded-md border border-[#ded9ce] px-3 text-xs font-semibold text-[#0c3b2e] hover:bg-[#faf8f2] sm:inline-flex">
              নিউজ পোর্টাল
            </Link>
            <NewsEditorHeader />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-10 sm:px-6 sm:py-7">
        {children}
      </main>
      <footer className="border-t border-[#ded9ce] bg-white px-4 py-3 text-center text-[11px] text-[#6d685f]">
        সংবাদ সম্পাদনা ও প্রকাশনা · ময়মনসিংহ শেবা
      </footer>
    </div>
  );
}
