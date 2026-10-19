import type { Metadata } from 'next';
import PostsFeed from '@/components/posts/PostsFeed';

/**
 * `/posts` — the community feed.
 *
 * One route for everything the community published: news, jobs, buy-sell and
 * the service/other desks, filterable at the top of the page. The feed itself
 * is a client component (the rows arrive from Supabase after hydration), so
 * this wrapper exists to carry the route's metadata and keep the page
 * statically prerenderable like every other directory here.
 *
 * No `Footer` by design: category and detail pages in this project deliberately
 * render the Navbar alone — see `components/directory/DirectoryShell.tsx`.
 */
export const metadata: Metadata = {
  title: 'স্থানীয় খবর ও ঘোষণা',
  description:
    'ময়মনসিংহের মানুষদের প্রকাশিত খবর, চাকরি, কেনাবেচা ও সেবার পোস্ট — ক্যাটাগরি অনুযায়ী সাজানো কমিউনিটি ফিড।',
  alternates: { canonical: '/posts' },
  openGraph: {
    title: 'স্থানীয় খবর ও ঘোষণা — Mymensingh Sheba',
    description:
      'ময়মনসিংহের মানুষদের প্রকাশিত খবর, চাকরি, কেনাবেচা ও সেবার পোস্ট এক জায়গায়।',
    url: '/posts',
    type: 'website',
  },
};

export default function PostsPage() {
  return <PostsFeed />;
}
