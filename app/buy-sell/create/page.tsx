import type { Metadata } from 'next';
import PostForm from '@/components/catalog/PostForm';
import PostAuthGate from '@/components/catalog/PostAuthGate';

export const metadata: Metadata = {
  title: 'বিক্রয়ের পোস্ট দিন — ময়মনসিংহ শেবা',
  description: 'পণ্য বিক্রি বা কেনার পোস্ট দিন। অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।',
  // A create form is never a search result, and the post behind it is not public
  // until a moderator approves it.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <PostAuthGate>
      <PostForm kind="buy_sell" />
    </PostAuthGate>
  );
}