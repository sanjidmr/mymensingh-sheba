import { redirect } from 'next/navigation';

/**
 * There is no donor detail page — by design.
 *
 * `/blood-donor/[id]` used to be a full profile screen. It is now a redirect to
 * the directory, because the card already carries everything a reader needs
 * (blood group, recovery window, area, and the call button) and a second page
 * meant an extra tap in the middle of an emergency.
 *
 * The redirect exists so URLs already shared on Facebook, WhatsApp and in search
 * results do not 404. A dead link to a page people may have bookmarked is worse
 * than a redirect to the list they can actually use.
 *
 * The donor id rides along as `?donor=`, which `app/blood-donor/page.tsx` reads
 * to scroll that card into view. It deliberately does NOT auto-open the request
 * sheet: a shared link that immediately opens a form about a patient's hospital
 * and prescription is not something to hand someone who just wanted to look.
 */
export default async function DonorDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/blood-donor?donor=${encodeURIComponent(id)}`);
}