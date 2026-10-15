import { redirect } from 'next/navigation';

/**
 * Individual worker profiles are no longer public (see the staff directory
 * privacy migration). Old profile URLs land on the প্লাম্বার request form.
 */
export default async function PlumberDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/plumber');
}
