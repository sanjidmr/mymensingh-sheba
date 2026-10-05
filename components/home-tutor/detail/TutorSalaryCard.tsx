'use client';

/**
 * TutorSalaryCard — the fee, and the CTA to act on it.
 *
 * Why the fee gets its own panel instead of one more fact in a grid: it is the
 * only number on the page a reader is going to compare against every other tutor
 * before deciding whether to keep reading. Giving it the same weight as
 * "অভিজ্ঞতা: ৩ বছর" would bury it.
 *
 * It is set larger, in the brand's deep green, on a tinted panel — not in a
 * gradient, not in a badge, not with a strikethrough "was" price. A tutor's fee
 * is a quote, and quotes should look like quotes.
 *
 * Three fee shapes render, all from `formatTutorFee`:
 *   - a band  "৳৫,০০০ – ৳৭,০০০ (মাসিক)"
 *   - fixed   "৳৫,০০০ (মাসিক)"          (min === max)
 *   - open    "আলোচনা সাপেক্ষে"          (nothing recorded)
 *
 * The "open" case is a real state, not an error: plenty of tutors genuinely
 * decide the fee after seeing the student. It says so plainly rather than
 * rendering "৳0".
 */

import React from 'react';
import { Check, Wallet } from 'lucide-react';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import { formatTutorFee, formatClassDuration } from '@/lib/home-tutor-types';
import { toBengaliDigits } from '@/lib/bengali-numerals';

export function TutorSalaryCard({ tutor }: { tutor: HomeTutorProfile }) {
  const fee = formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax);
  const duration = formatClassDuration(tutor.classDurationMinutes);

  // The honest per-class figure, when both halves of it exist. A parent budgets
  // in classes per month, not in "how much is a month" — ₹6,000 a month means
  // something entirely different at 8 classes than at 24.
  const perClass = derivePerClass(tutor);

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700">
          <Wallet className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            মাসিক বেতন
          </p>
          <p className="mt-1 text-lg font-black leading-tight text-brand-900 sm:text-xl">
            {fee}
          </p>

          {(perClass || duration) && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-brand-800/80">
              {perClass ? (
                <>
                  সপ্তাহে {toBengaliDigits(tutor.daysPerWeek)} দিন হিসাবে প্রায়{' '}
                  <strong className="font-bold text-brand-900">{perClass}</strong> প্রতি ক্লাসে
                  {duration ? ` · একটি ক্লাস ${duration}` : ''}
                </>
              ) : (
                <>একটি ক্লাস {duration}</>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Per-class cost, derived — and only when the derivation is sound.
 *
 * It needs three recorded numbers: a fee, how many days a week, and how long one
 * class runs. Missing any one of them and the answer would be a guess dressed as
 * arithmetic, so nothing is shown instead. Four weeks a month is the convention
 * every tutor in the country quotes by, and the result is labelled "প্রায়"
 * because the months with 30 days quietly cost more.
 */
function derivePerClass(tutor: HomeTutorProfile): string | null {
  const { expectedSalaryMin: min, expectedSalaryMax: max, daysPerWeek, classDurationMinutes } =
    tutor;
  if (!min && !max) return null;
  if (!daysPerWeek || daysPerWeek <= 0) return null;
  if (!classDurationMinutes || classDurationMinutes <= 0) return null;

  // Use the top of the band: quoting the lower end as "the" per-class cost
  // would be the number that turns out wrong.
  const monthly = max || min || 0;
  const classesPerMonth = daysPerWeek * 4;
  if (classesPerMonth <= 0) return null;
  const perClass = Math.round(monthly / classesPerMonth);
  if (!Number.isFinite(perClass) || perClass <= 0) return null;
  return `৳${toBengaliDigits(perClass.toLocaleString('bn-BD'))}`;
}

/** The bullet points shown under the CTA, derived — never invented. */
export function TutorCtaBullets({ tutor }: { tutor: HomeTutorProfile }) {
  const points: string[] = [];
  if (tutor.daysPerWeek > 0) {
    points.push(`সপ্তাহে ${toBengaliDigits(tutor.daysPerWeek)} দিন ক্লাস নেওয়া যায়`);
  }
  if (tutor.experienceYears > 0) {
    points.push(`${toBengaliDigits(tutor.experienceYears)} বছরের পড়ানোর অভিজ্ঞতা`);
  }
  points.push('অনুরোধ পাঠালে অ্যাডমিন সরাসরি যোগাযোগ করিয়ে দেবে');

  return (
    <ul className="mt-3 space-y-1.5">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-600">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" strokeWidth={3} aria-hidden="true" />
          <span>{point}</span>
        </li>
      ))}
    </ul>
  );
}