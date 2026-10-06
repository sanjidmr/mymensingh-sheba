'use client';

/**
 * DonorCard — the entire blood-donor surface.
 *
 * There is deliberately no donor detail page. `/blood-donor/[id]` redirects back
 * here. A donor record is six facts and one action; a second page would be six
 * facts and one action spread across two screens with a scroll in between, and
 * in an emergency nobody scrolls.
 *
 * What the card has to answer, in the order a reader asks:
 *   1. Is this the right blood group?               → the group token, top-left
 *   2. Are they fit to give right now?               → the recovery panel
 *   3. Where are they?                              → the area line
 *   4. How do I reach them?                         → the call button, bottom
 *
 * The call button
 * ----------------
 * It does NOT print a phone number, and that is not an oversight — it is the
 * product's safety contract. `app/safety/page.tsx` and `app/help/page.tsx` both
 * promise the public that a donor's number is never exposed, `private_phone` is
 * admin-only at the RLS layer, and `/safety` describes the release flow: an
 * admin verifies the prescription slip, then releases the contact to that one
 * requester through `blood_contact_releases`. Printing a number here would
 * contradict a promise the site makes in public and defeat the control.
 *
 * So the button has three states, each a function of data the reader is already
 * entitled to:
 *
 *   - An admin released this donor's contact to the signed-in reader → a real
 *     `tel:` link. The reader has earned the number; nothing is published.
 *   - The donor can give, reader has an account → the button files a tracked
 *     blood request for that donor, which is the flow that leads to a release.
 *   - The donor can give, reader is a guest → sign in first. An anonymous
 *     request could never be released a contact, so it would be a dead end.
 *
 * A donor inside the recovery window gets none of the above: the button is
 * disabled and says why. Calling someone whose body is still rebuilding is the
 * one outcome this card must not produce.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Droplets, MapPin, Phone } from 'lucide-react';
import { BloodRequestForm, RequestSheetHeader } from '@/components/blood-donor/BloodRequestForm';
import { useAuth } from '@/lib/auth-context';
import { fetchMyContactReleases, resolveDonorPhotoUrl } from '@/lib/blood-donor-service';
import { donorRecovery } from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodDonorProfile } from '@/lib/supabase/types';

export interface DonorCardProps {
  donor: BloodDonorProfile;
}

/**
 * Round avatar, kept because the admin console (`app/admin/blood`) and the
 * donor's own profile page (`app/profile/blood-donor`) both render it in a list.
 * The card itself does not use it — a face is not one of the six facts that
 * matter in an emergency, and a small photo next to a blood group adds nothing a
 * reader can act on.
 *
 * Falls back to the first letter, so a donor who never uploaded a photo still
 * renders as a person rather than a broken image.
 */
export function DonorAvatar({
  donor,
  className = 'h-14 w-14 text-lg',
}: {
  donor: BloodDonorProfile;
  className?: string;
}) {
  const photo = resolveDonorPhotoUrl(donor.profilePhotoUrl);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-black text-brand-700 ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={donor.fullName} className="h-full w-full object-cover" />
      ) : (
        <span>{donor.fullName.charAt(0) || '?'}</span>
      )}
    </div>
  );
}

export default function DonorCard({ donor }: DonorCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [requestOpen, setRequestOpen] = useState(false);
  // Keyed by the donor the answer belongs to. Without the key, a grid that
  // recycles these cards would show donor A's released number on donor B for
  // the frame before the fetch resolves — the exact leak this component exists
  // to prevent.
  const [release, setRelease] = useState<{ donorId: string; phone: string | null } | null>(null);

  const area = getAreaById(donor.areaId);
  const recovery = donorRecovery(donor);

  // Ask only for THIS viewer's own releases, and only when signed in. The effect
  // never calls setState on the way in or out — a signed-out reader has no
  // release by definition, so `releasedPhone` is derived as `null` below rather
  // than reset here.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    fetchMyContactReleases(user.id).then((releases) => {
      if (cancelled) return;
      const mine = releases.find((r) => r.donorProfileId === donor.id);
      setRelease({ donorId: donor.id, phone: mine?.contactPhone ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, donor.id]);

  const releasedPhone = user?.id && release?.donorId === donor.id ? release.phone : null;

  return (
    <>
      <article className="flex flex-col rounded-2xl border border-mist-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,39,31,0.04)] sm:p-4">
        {/* Identity row: group token + name + area */}
        <div className="flex items-start gap-3">
          <span
            className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-brand-200 bg-brand-50 leading-none"
            aria-label={`রক্তের গ্রুপ ${donor.bloodGroup}`}
          >
            <Droplets
              className="mb-0.5 h-3.5 w-3.5 text-brand-600"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <span className="text-[15px] font-black text-brand-700">{donor.bloodGroup}</span>
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[15px] font-extrabold leading-tight text-ink-900 sm:text-base">
                {donor.fullName}
              </h3>
              {donor.isVerified && (
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-brand-600"
                  aria-label="অ্যাডমিন যাচাই করা"
                />
              )}
              {donor.isDemo && (
                <span className="shrink-0 rounded-full border border-accent-200 bg-accent-100/70 px-1.5 py-0.5 text-[11px] font-bold text-accent-700 sm:text-[10px]">
                  নমুনা
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 truncate text-[12.5px] text-ink-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{area?.nameBn || 'এলাকা জানা নেই'}</span>
              {donor.weightKg ? (
                <span className="shrink-0 text-ink-400">· {donor.weightKg} কেজি</span>
              ) : null}
            </p>
          </div>
        </div>

        {/* Recovery — the fact that decides whether calling is even sensible */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-mist-200 bg-mist-50 p-2.5">
          <span
            className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${recovery.chipClassName}`}
          >
            {recovery.labelBn}
          </span>
          <p className="text-[12px] leading-relaxed text-ink-600">{recovery.detailBn}</p>
        </div>

        {donor.intro ? (
          <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600">
            {donor.intro}
          </p>
        ) : null}

        <div className="mt-3.5 pt-3.5">
          <CallButton
            canRequest={recovery.canRequest}
            releasedPhone={releasedPhone}
            isSignedIn={Boolean(user?.id)}
            onOpenRequest={() => setRequestOpen(true)}
            onNeedAuth={() =>
              router.push(`/login?next=${encodeURIComponent('/blood-donor')}`)
            }
          />
        </div>
      </article>

      {requestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 sm:items-center"
          onClick={() => setRequestOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white pb-[max(env(safe-area-inset-bottom),1rem)] sm:max-w-lg sm:rounded-3xl sm:pb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <RequestSheetHeader onClose={() => setRequestOpen(false)} />
            <div className="p-4 sm:p-5">
              <BloodRequestForm donor={donor} user={user} onClose={() => setRequestOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The one action on the card.
 *
 * `releasedPhone` beats `canRequest`, deliberately: if an admin has already
 * handed this reader a number for an in-flight emergency, the fact that the
 * four-month clock has not run out is not a reason to hide the number from the
 * person the admin chose to help.
 */
function CallButton({
  canRequest,
  releasedPhone,
  isSignedIn,
  onOpenRequest,
  onNeedAuth,
}: {
  canRequest: boolean;
  releasedPhone: string | null;
  isSignedIn: boolean;
  onOpenRequest: () => void;
  onNeedAuth: () => void;
}) {
  const base =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2';

  // 1. An admin released this donor's contact to the signed-in reader.
  if (releasedPhone) {
    return (
      <a
        href={`tel:${releasedPhone}`}
        className={`${base} bg-brand-700 text-white hover:bg-brand-800`}
      >
        <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        <span>📞 কল করুন</span>
      </a>
    );
  }

  // 2. In the recovery window / on an explicit break. No call, and no pretending
  //    the button works — a disabled control that explains itself beats a live
  //    button that leads nowhere.
  if (!canRequest) {
    return (
      <button
        type="button"
        disabled
        className={`${base} cursor-not-allowed border border-mist-200 bg-mist-100 text-ink-400`}
      >
        <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        <span>এখন কল করা যাবে না</span>
      </button>
    );
  }

  // 3. The normal path. Rose, not brand: red is the colour every reader already
  //    associates with an emergency in this context, and the brand green is
  //    saved for "go".
  return (
    <button
      type="button"
      onClick={isSignedIn ? onOpenRequest : onNeedAuth}
      className={`${base} bg-rose-700 text-white hover:bg-rose-800`}
    >
      <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span>📞 কল করুন</span>
    </button>
  );
}