import { redirect } from 'next/navigation';

export function generateStaticParams() {
  return [{ "id": '__app_dynamic__' }];
}

/**
 * Individual worker profiles are no longer public (see the staff directory
 * privacy migration). Old profile URLs land on the এসি ও ফ্রিজ request form.
 */
export default async function AcFridgeDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/ac-fridge');
}
