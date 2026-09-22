import { redirect } from 'next/navigation';

export default async function PlumbingDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/plumber/${id}`);
}