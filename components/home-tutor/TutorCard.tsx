'use client';

/**
 * TutorCard — the directory card for one teacher.
 *
 * Restyled off the old `emerald → teal` gradient header onto the app's brand
 * ramp. Two reasons, beyond consistency:
 *
 *  1. The gradient header pushed the card's real content below a coloured band
 *     that carried no information. On a phone, the fold of a two-column grid
 *     landed inside it. The photo is the signal here, so the photo is the header.
 *  2. Emerald/teal is a different hue from `brand-700`, so tapping through from
 *     a tolet listing into a tutor listing changed the whole page's colour
 *     temperature. One ramp, one site.
 *
 * `TutorAvatar` and `TutorRatingBadge` are kept as named exports — the admin
 * console and the tutor's own profile page both use them.
 */

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  sortTutorClasses,
} from '@/lib/home-tutor-types';
import { resolveTutorPhotoUrl } from '@/lib/home-tutor-service';
import { toBengaliDigits } from '@/lib/bengali-numerals';

export function TutorAvatar({
  tutor,
  className = 'h-14 w-14 text-lg',
}: {
  tutor: HomeTutorProfile;
  className?: string;
}) {
  const photo = resolveTutorPhotoUrl(tutor.profilePhotoUrl);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-black text-brand-700 ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={tutor.fullName} className="h-full w-full object-cover" />
      ) : (
        <span>{tutor.fullName.charAt(0) || '?'}</span>
      )}
    </div>
  );
}

export function TutorRatingBadge({ tutor }: { tutor: HomeTutorProfile }) {
  if (!tutor.ratingCount) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-mist-200 bg-mist-50 px-2.5 py-1 text-xs font-bold text-ink-800">
      <Star className="h-3 w-3 fill-accent-400 text-accent-400" aria-hidden="true" />
      {Number(tutor.ratingAvg ?? 0).toFixed(1)}
      <span className="font-medium text-ink-400">({toBengaliDigits(tutor.ratingCount)})</span>
    </span>
  );
}

export default function TutorCard({ tutor }: { tutor: HomeTutorProfile }) {
  const subjects = tutor.preferredSubjects.filter(Boolean);
  const classes = sortTutorClasses(tutor.preferredClasses);
  const photo = resolveTutorPhotoUrl(tutor.profilePhotoUrl);

  return (
    <Link
      href={`/home-tutor/${tutor.id}`}
      className="group flex min-w-0 items-stretch overflow-hidden rounded-2xl border border-brand-100 bg-white p-2 shadow-[0_2px_10px_rgba(7,39,31,0.04)] no-underline transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_10px_24px_rgba(7,39,31,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:p-2.5"
    >
      <div className="relative h-[100px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-mist-100 sm:h-[112px] sm:w-24">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={tutor.fullName}
            loading="lazy"
            className="h-full w-full object-cover object-[center_25%] transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl font-black text-brand-300">
              {tutor.fullName.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-1 sm:px-4">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-[14px] font-extrabold leading-snug text-ink-900 sm:text-base">
            {tutor.fullName}
          </h3>
        </div>

        {classes.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {classes.slice(0, 3).map((c) => (
              <li
                key={c}
                className="max-w-full truncate rounded-md border border-mist-200 bg-mist-50 px-2 py-0.5 text-[10px] font-semibold leading-snug text-ink-700 sm:text-[11px]"
              >
                {c}
              </li>
            ))}
            {classes.length > 3 && (
              <li className="rounded-md bg-mist-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-500">
                +{toBengaliDigits(classes.length - 3)}
              </li>
            )}
          </ul>
        )}

        {subjects.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {subjects.slice(0, 2).map((s) => (
              <li
                key={s}
                className="max-w-full truncate rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold leading-snug text-brand-800 sm:text-[11px]"
              >
                {s}
              </li>
            ))}
            {subjects.length > 2 && (
              <li className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                +{toBengaliDigits(subjects.length - 2)}
              </li>
            )}
          </ul>
        )}
      </div>
    </Link>
  );
}