import { redirect } from 'next/navigation';

/** Legacy plumbing profile URL → the canonical প্লাম্বার request form. */
export default async function PlumbingDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/plumber');
}
