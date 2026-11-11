import { redirect } from 'next/navigation';

/**
 * Individual worker profiles are no longer public (see the staff directory
 * privacy migration). Old profile URLs land on the ইলেকট্রিশিয়ান request form.
 */
export function generateStaticParams() {
  return [{ "id": '__app_dynamic__' }];
}

export default async function ElectricianDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/electrician');
}
