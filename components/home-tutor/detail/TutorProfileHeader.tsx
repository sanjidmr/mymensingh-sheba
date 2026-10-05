'use client';

/**
 * TutorProfileHeader — the top of a tutor's profile page.
 *
 * Answers the three questions a parent decides on before reading anything else:
 * who is this, are they actually teaching, and are they taking students now.
 *
 * The photo is large on purpose. A tutor is the one service on this platform a
 * family hands a stranger's child for two hours a week, and the photo is the
 * single biggest signal of whether that feels right. Everywhere else in the app
 * a photo is a thumbnail; here it is the headline.
 *
 * Everything below the name is a fact the tutor typed. Nothing is inferred: if
 * there is no "বর্তমানে" line, the header says so rather than implying they are a
 * working professional, because "student" and "working" decide completely
 * different things about whether they can hold a fixed weekly slot.
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, MapPin, Sparkles, Star } from 'lucide-react';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  TUTOR_AVAILABILITY_LABELS,
  TUTOR_TEACHING_MODE_LABELS,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';
import { toBengaliDigits } from '@/lib/bengali-numerals';

/** Availability chips in ink/brand tones — the old palette was emerald-on-teal. */
const AVAILABILITY_CHIP: Record<string, string> = {
  available: 'border-brand-200 bg-brand-50 text-brand-700',
  limited: 'border-accent-200 bg-accent-100/70 text-accent-700',
  busy: 'border-mist-200 bg-mist-100 text-ink-500',
};

export function TutorProfileHeader({ tutor }: { tutor: HomeTutorProfile }) {
  const areas = tutor.preferredAreas
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const availability = TUTOR_AVAILABILITY_LABELS[tutor.availability];
  const activity = tutor.currentActivity;

  return (
    <header>
      {/* `min-h-11` not decoration: a 19px-tall back link is a 19px-tall target
          on the busiest page in the app. The padding is negative, so it eats
          into the gap below rather than pushing the portrait down. */}
      <Link
        href="/home-tutor"
        className="-ml-1 mb-2 inline-flex min-h-11 items-center gap-1.5 text-[12.5px] font-medium text-ink-500 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        সব শিক্ষক
      </Link>

      <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
        {/* Portrait — 4:3 on a phone so it does not eat the whole screen, and
            never taller than 22rem so the name stays above the fold. */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist-100 sm:aspect-[21/9]">
          {tutor.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tutor.profilePhotoUrl}
              alt={tutor.fullName}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-5xl font-black text-brand-300">
                {tutor.fullName.charAt(0) || '?'}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="text-xl font-black leading-tight text-ink-900 sm:text-2xl">
              {tutor.fullName}
            </h1>
            {tutor.isVerified && (
              <BadgeCheck className="h-5 w-5 shrink-0 text-brand-600" aria-label="অ্যাডমিন যাচাই করা" />
            )}
            {tutor.isDemo && <DemoBadge />}
          </div>

          {/* The one-line credential: the most recent qualification. Never the
              full timeline — that is the section's job. */}
          {tutor.qualification && (
            <p className="mt-1 text-[13.5px] font-medium leading-snug text-ink-700">
              {tutor.qualification}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${
                AVAILABILITY_CHIP[tutor.availability] ?? AVAILABILITY_CHIP.busy
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  tutor.availability === 'available'
                    ? 'bg-brand-500'
                    : tutor.availability === 'limited'
                      ? 'bg-accent-400'
                      : 'bg-ink-300'
                }`}
                aria-hidden="true"
              />
              {availability.labelBn}
            </span>

            <span className="inline-flex items-center rounded-full border border-mist-200 bg-mist-50 px-2.5 py-1 text-[11.5px] font-semibold text-ink-600">
              {TUTOR_TEACHING_MODE_LABELS[tutor.teachingMode]}
            </span>

            {(tutor.ratingCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-mist-200 bg-mist-50 px-2.5 py-1 text-[11.5px] font-semibold text-ink-700">
                <Star className="h-3.5 w-3.5 fill-accent-400 text-accent-400" aria-hidden="true" />
                {toBengaliDigits((tutor.ratingAvg ?? 0).toFixed(1))}
                <span className="text-ink-400">({toBengaliDigits(tutor.ratingCount ?? 0)})</span>
              </span>
            )}
          </div>

          {/* বর্তমানে কী করেন — the student-vs-employed question, answered up top
              because it decides whether a fixed slot is even possible. */}
          {activity && (
            <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-mist-200 bg-mist-50 p-3">
              <Sparkles
                className="mt-0.5 h-4 w-4 shrink-0 text-accent-500"
                aria-hidden="true"
              />
              <div className="min-w-0 text-[12.5px] leading-relaxed text-ink-600">
                {activity.roleLabelBn && (
                  <p className="text-[13px] font-bold text-ink-900">{activity.roleLabelBn}</p>
                )}
                {(activity.studyingAt || activity.teachingAt || activity.workingAt) && (
                  <p className="mt-0.5">
                    {activity.studyingAt && <span>পড়ছেন — {activity.studyingAt}</span>}
                    {activity.teachingAt && (
                      <span className={activity.studyingAt ? ' · ' : ''}>
                        পড়ান — {activity.teachingAt}
                      </span>
                    )}
                    {activity.workingAt && (
                      <span className={activity.studyingAt || activity.teachingAt ? ' · ' : ''}>
                        চাকরি — {activity.workingAt}
                      </span>
                    )}
                  </p>
                )}
                {activity.note && <p className="mt-1">{activity.note}</p>}
              </div>
            </div>
          )}

          {tutor.bio && (
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-ink-700">{tutor.bio}</p>
          )}

          {areas.length > 0 && (
            <p className="mt-3.5 flex items-start gap-1.5 text-[12.5px] text-ink-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>এলাকা — {areas.join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

/** The label a fallback profile always carries. Never decorative. */
export function DemoBadge() {
  return (
    <span className="shrink-0 rounded-full border border-accent-200 bg-accent-100/70 px-2 py-0.5 text-[10.5px] font-bold text-accent-700">
      নমুনা প্রোফাইল
    </span>
  );
}