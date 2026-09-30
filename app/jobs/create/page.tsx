import type { Metadata } from 'next';
import PostForm from '@/components/catalog/PostForm';
import PostAuthGate from '@/components/catalog/PostAuthGate';

export const metadata: Metadata = {
  title: 'চাকরির খবর দিন — ময়মনসিংহ শেবা',
  description: 'ময়মনসিংহে চাকরির খবর দিন। অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।',
  // A create form is never a search result, and the post behind it is not public
  // until a moderator approves it.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PostAuthGate>
      <PostForm kind="job" />
    </PostAuthGate>
  );
}