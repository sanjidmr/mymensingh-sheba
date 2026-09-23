import { redirect } from 'next/navigation';
import { SERVICE_REDIRECTS } from '@/lib/service-redirects';

export function generateStaticParams() {
  return SERVICE_REDIRECTS.map((r) => ({ slug: r.slug }));
}

export default async function ServiceRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const match = SERVICE_REDIRECTS.find((r) => r.slug === slug);
  redirect(match ? match.target : '/services');
}