import { redirect } from 'next/navigation';

/**
 * Individual worker profiles are no longer public: worker names, phone numbers
 * and details live only in the admin worker directory. Any old bookmarked
 * profile URL lands on the কাজের বুয়া service-request form instead.
 */
export default async function KajerBuaDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect('/kajer-bua');
}
