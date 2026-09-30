import type { Metadata } from 'next';
import PostForm from '@/components/catalog/PostForm';
import PostAuthGate from '@/components/catalog/PostAuthGate';

export const metadata: Metadata = {
  title: 'সংবাদ পোস্ট — ময়মনসিংহ শেবা',
  description: 'স্থানীয় সংবাদ বা তথ্য জানাতে পোস্ট করুন। অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।',
  // A create form is never a search result, and the post behind it is not public
  // until a moderator approves it.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PostAuthGate>
      <PostForm kind="news" />
    </PostAuthGate>
  );
}