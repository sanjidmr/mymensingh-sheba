'use client';

import { PostDetail } from '@/components/catalog/PostDetail';

export default function Page({ slug }: { slug: string }) {
  return <PostDetail kind="buy_sell" slug={slug} />;
}