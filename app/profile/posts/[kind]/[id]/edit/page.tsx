import type { Metadata } from 'next';
import EditPost from './EditPost';

export const metadata: Metadata = {
  title: 'পোস্ট সম্পাদনা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { id } = await params;
  // `kind` is deliberately not passed on. The post's own kind comes from the
  // fetched row, so a mismatched URL segment cannot push a job post through the
  // buy-sell form.
  return <EditPost postId={id} />;
}
