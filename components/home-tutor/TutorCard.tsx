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
import { MapPin, GraduationCap, BadgeCheck, ArrowRight, Star, Clock, Landmark } from 'lucide-react';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  TUTOR_TEACHING_MODE_LABELS,
  TUTOR_AVAILABILITY_LABELS,
  formatTutorFee,
  sortTutorClasses,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';
import { resolveTutorPhotoUrl } from '@/lib/home-tutor-service';
import { toBengaliDigits } from '@/lib/bengali-numerals';

/** Availability chips in ink/brand tones, matching the detail page header. */
const AVAILABILITY_CHIP: Record<string, string> = {
  available: 'border-brand-200 bg-brand-50 text-brand-700',
  limited: 'border-accent-200 bg-accent-100/70 text-accent-700',
  busy: 'border-mist-200 bg-mist-100 text-ink-500',
};

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
    <span className="inline-flex items-center gap-1 rounded-full border border-mist-200 bg-mist-50 px-2 py-0.5 text-[11px] font-bold text-ink-700">
      <Star className="h-3 w-3 fill-accent-400 text-accent-400" aria-hidden="true" />
      {Number(tutor.ratingAvg ?? 0).toFixed(1)}
      <span className="font-medium text-ink-400">({toBengaliDigits(tutor.ratingCount)})</span>
    </span>
  );
}

export default function TutorCard({ tutor }: { tutor: HomeTutorProfile }) {
  const areas = tutor.preferredAreas
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const availability = TUTOR_AVAILABILITY_LABELS[tutor.availability];
  const subjects = tutor.preferredSubjects.filter(Boolean);
  // Class chips in primary → admission order, matching the detail page, so a
  // reader moving between the two sees the same order and not a reshuffle.
  const classes = sortTutorClasses(tutor.preferredClasses);

  return (
    <Link
      href={`/home-tutor/${tutor.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-mist-200 bg-white no-underline transition-shadow duration-150 hover:border-brand-200 hover:shadow-[0_4px_16px_rgba(7,39,31,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      {/* Photo strip. Fixed 4:3 so a row of cards never jitters while images
          load, and short enough that the fee is still above the fold. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist-100">
        {tutor.profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tutor.profilePhotoUrl}
            alt={tutor.fullName}
            loading="lazy"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl font-black text-brand-300">
              {tutor.fullName.charAt(0) || '?'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start gap-1.5">
          <h3 className="min-w-0 flex-1 truncate text-[15px] font-extrabold leading-tight text-ink-900">
            {tutor.fullName}
          </h3>
          {tutor.isVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-label="অ্যাডমিন যাচাই করা" />
          )}
          {tutor.isDemo && (
            <span className="shrink-0 rounded-full border border-accent-200 bg-accent-100/70 px-1.5 py-0.5 text-[10px] font-bold text-accent-700">
              নমুনা
            </span>
          )}
        </div>

        {tutor.qualification ? (
          <p className="mt-1 flex items-start gap-1 text-[12px] leading-snug text-ink-600">
            <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
            <span className="line-clamp-1">{tutor.qualification}</span>
          </p>
        ) : null}

        {/* The fee, first and largest. It is the comparison number. */}
        <p className="mt-2.5 text-[13.5px] font-black leading-tight text-brand-800">
          {formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax)}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
              AVAILABILITY_CHIP[tutor.availability] ?? AVAILABILITY_CHIP.busy
            }`}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            {availability.labelBn}
          </span>
          <TutorRatingBadge tutor={tutor} />
        </div>

        {classes.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {classes.slice(0, 2).map((c) => (
              <li
                key={c}
                className="rounded-md border border-mist-200 bg-mist-50 px-2 py-0.5 text-[11px] font-medium leading-snug text-ink-700"
              >
                {c}
              </li>
            ))}
            {classes.length > 2 && (
              <li className="text-[11px] font-semibold text-ink-400">
                +{toBengaliDigits(classes.length - 2)}
              </li>
            )}
          </ul>
        )}

        {subjects.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {subjects.slice(0, 3).map((s) => (
              <li
                key={s}
                className="rounded-md border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-medium leading-snug text-brand-700"
              >
                {s}
              </li>
            ))}
            {subjects.length > 3 && (
              <li className="text-[11px] font-semibold text-ink-400">
                +{toBengaliDigits(subjects.length - 3)}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="flex min-w-0 items-start gap-1 text-[11.5px] leading-snug text-ink-500">
            {areas.length > 0 ? (
              <>
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
                <span className="line-clamp-2">{areas.join(', ')}</span>
              </>
            ) : tutor.institution ? (
              <>
                <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
                <span className="line-clamp-2">{tutor.institution}</span>
              </>
            ) : null}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-700 px-2.5 py-1.5 text-[11.5px] font-bold text-white transition-colors group-hover:bg-brand-800">
            বিস্তারিত
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}