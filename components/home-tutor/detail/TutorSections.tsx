'use client';

/**
 * The three "what is this tutor actually like" sections.
 *
 * Each one renders only when the data exists, and says nothing at all when it
 * does not. That is the whole design rule here: a section whose inputs are empty
 * is omitted rather than filled with a dash or a "not specified", because a
 * parent reading eight populated sections and one empty one learns something
 * true — they learn nobody recorded it — whereas a page of placeholders teaches
 * them to distrust every number on it.
 *
 * So:
 *   - `TutorEducationSection` prints a timeline, or nothing.
 *   - `TutorCurrentActivitySection` prints what they are doing now, or nothing.
 *   - `TutorTeachingSection` prints subjects / classes / logistics, and each
 *     block within it independently collapses.
 */

import React from 'react';
import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Clock,
  GraduationCap,
  Home,
  MapPin,
  Monitor,
  School,
  Timer,
  Users,
} from 'lucide-react';
import type { HomeTutorProfile, TutorEducation } from '@/lib/supabase/types';
import {
  TUTOR_EDUCATION_STATUS_LABELS,
  TUTOR_TEACHING_MODE_LABELS,
  formatClassDuration,
  sortTutorClasses,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';
import { toBengaliDigits } from '@/lib/bengali-numerals';

// ---------------------------------------------------------------------------
// Shared section shell
// ---------------------------------------------------------------------------

export function TutorSection({
  titleBn,
  icon: Icon,
  children,
  noteBn,
}: {
  titleBn: string;
  icon: React.ElementType;
  children: React.ReactNode;
  noteBn?: string;
}) {
  return (
    <section className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-[14.5px] font-extrabold text-ink-900">
        <Icon className="h-4 w-4 shrink-0 text-brand-600" strokeWidth={2.25} aria-hidden="true" />
        {titleBn}
      </h2>
      {noteBn ? <p className="mt-1 text-[12px] text-ink-400">{noteBn}</p> : null}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

/** A tag chip. Wraps rather than scrolls, so nothing is hidden off-screen. */
function Chips({ items, tone = 'brand' }: { items: string[]; tone?: 'brand' | 'neutral' }) {
  if (items.length === 0) return null;
  const cls =
    tone === 'brand'
      ? 'border-brand-200 bg-brand-50 text-brand-700'
      : 'border-mist-200 bg-mist-50 text-ink-700';
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium leading-snug ${cls}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// শিক্ষাগত যোগ্যতা
// ---------------------------------------------------------------------------

/**
 * The qualification timeline, newest first.
 *
 * An older profile carries only the single `institution` / `department` /
 * `qualification` triple. When `educations` is absent, one entry is synthesised
 * from that triple rather than the section disappearing — the information IS
 * there, it is just not a list yet. What is NOT done is padding a one-entry
 * history out to look like a three-entry one.
 */
export function TutorEducationSection({ tutor }: { tutor: HomeTutorProfile }) {
  const entries: TutorEducation[] =
    tutor.educations && tutor.educations.length > 0
      ? tutor.educations
      : tutor.institution || tutor.qualification
        ? [
            {
              institution: tutor.institution,
              department: tutor.department,
              degree: tutor.qualification,
              status: 'passed' as const,
            },
          ]
        : [];

  if (entries.length === 0) return null;

  return (
    <TutorSection
      titleBn="শিক্ষাগত যোগ্যতা"
      icon={GraduationCap}
      noteBn={entries.length > 1 ? 'সাম্প্রতিকটি প্রথমে' : undefined}
    >
      <ol className="space-y-0">
        {entries.map((entry, index) => (
          <EducationRow
            key={`${entry.institution}-${entry.degree}-${index}`}
            entry={entry}
            isLast={index === entries.length - 1}
          />
        ))}
      </ol>
    </TutorSection>
  );
}

function EducationRow({ entry, isLast }: { entry: TutorEducation; isLast: boolean }) {
  const status = TUTOR_EDUCATION_STATUS_LABELS[entry.status] ?? TUTOR_EDUCATION_STATUS_LABELS.passed;
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {/* The spine. The dot sits on it; the last row's line is dropped so the
          timeline does not appear to continue past the end. */}
      <div className="relative flex w-3.5 shrink-0 justify-center" aria-hidden="true">
        {!isLast && <span className="absolute top-4 bottom-0 w-px bg-mist-200" />}
        <span
          className={`relative mt-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
            entry.status === 'studying' ? 'bg-accent-400' : 'bg-brand-500'
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[13.5px] font-bold leading-snug text-ink-900">{entry.degree}</p>
          <span
            className={`rounded-full border px-1.5 py-0.5 text-[10.5px] font-bold ${status.className}`}
          >
            {status.labelBn}
          </span>
          {entry.year && (
            <span className="text-[11.5px] font-medium text-ink-400">
              {entry.status === 'studying' ? 'হবে' : ''} {toBengaliDigits(entry.year)}
            </span>
          )}
        </div>
        {entry.institution ? (
          <p className="mt-0.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink-600">
            <School className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden="true" />
            <span>
              {entry.institution}
              {entry.department ? ` — ${entry.department}` : ''}
            </span>
          </p>
        ) : null}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// বর্তমানে কী করেন
// ---------------------------------------------------------------------------

/**
 * What they are doing right now.
 *
 * Rendered even when only one of the three parts exists, because "পড়ছেন" on its
 * own is a complete and useful answer. Returns null when the block is absent
 * entirely — an older profile simply has no such line.
 */
export function TutorCurrentActivitySection({ tutor }: { tutor: HomeTutorProfile }) {
  const activity = tutor.currentActivity;
  const hasAny =
    activity &&
    (activity.roleLabelBn || activity.studyingAt || activity.teachingAt || activity.workingAt || activity.note);
  if (!hasAny) return null;

  return (
    <TutorSection titleBn="বর্তমানে কী করেন" icon={Briefcase}>
      <ul className="space-y-2.5">
        {activity!.studyingAt && (
          <ActivityRow icon={GraduationCap} labelBn="যেখানে পড়ছেন" value={activity!.studyingAt} />
        )}
        {activity!.teachingAt && (
          <ActivityRow icon={School} labelBn="যেখানে পড়ান" value={activity!.teachingAt} />
        )}
        {activity!.workingAt && (
          <ActivityRow icon={Briefcase} labelBn="যেখানে চাকরি করেন" value={activity!.workingAt} />
        )}
        {activity!.note && (
          <ActivityRow icon={Clock} labelBn="সময়সূচির কথা" value={activity!.note} />
        )}
      </ul>
    </TutorSection>
  );
}

function ActivityRow({
  icon: Icon,
  labelBn,
  value,
}: {
  icon: React.ElementType;
  labelBn: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-tight text-ink-400">{labelBn}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-800">{value}</p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// পড়ানোর বিস্তারিত
// ---------------------------------------------------------------------------

export function TutorTeachingSection({ tutor }: { tutor: HomeTutorProfile }) {
  const subjects = tutor.preferredSubjects.map((s) => s.trim()).filter(Boolean);
  // Sorted into primary → admission order; unrecognised values survive at the end.
  const classes = sortTutorClasses(tutor.preferredClasses);
  const areas = tutor.preferredAreas
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));

  const duration = formatClassDuration(tutor.classDurationMinutes);

  const modeIcons =
    tutor.teachingMode === 'online' ? Monitor : tutor.teachingMode === 'home' ? Home : School;

  // Nothing at all recorded: do not render an empty section.
  if (
    subjects.length === 0 &&
    classes.length === 0 &&
    areas.length === 0 &&
    !duration &&
    !tutor.daysPerWeek &&
    !tutor.experienceYears &&
    !tutor.preferredStudentType
  ) {
    return null;
  }

  return (
    <TutorSection titleBn="শিক্ষা সংক্রান্ত বিস্তারিত" icon={BookOpen}>
      <div className="space-y-4">
        {subjects.length > 0 && (
          <Block labelBn="যেসব বিষয় পড়ান" icon={BookOpen}>
            <Chips items={subjects} />
          </Block>
        )}

        {classes.length > 0 && (
          <Block labelBn="কোন কোন ক্লাসে পড়ান" icon={School}>
            <Chips items={classes} tone="neutral" />
          </Block>
        )}

        <Block labelBn="পড়ানোর বিস্তারিত" icon={Users}>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
            <Detail
              labelBn="মাধ্যম"
              value={TUTOR_TEACHING_MODE_LABELS[tutor.teachingMode]}
              icon={modeIcons}
            />
            {areas.length > 0 && (
              <Detail labelBn="এলাকা" value={areas.join(', ')} icon={MapPin} />
            )}
            {tutor.daysPerWeek > 0 && (
              <Detail
                labelBn="সপ্তাহে"
                value={`${toBengaliDigits(tutor.daysPerWeek)} দিন`}
                icon={CalendarDays}
              />
            )}
            {duration && (
              <Detail labelBn="প্রতি ক্লাসে" value={duration} icon={Timer} />
            )}
            {tutor.experienceYears > 0 && (
              <Detail
                labelBn="অভিজ্ঞতা"
                value={`${toBengaliDigits(tutor.experienceYears)} বছর`}
                icon={Briefcase}
              />
            )}
            {tutor.preferredStudentType && (
              <Detail
                labelBn="ছাত্র"
                value={tutor.preferredStudentType}
                icon={Users}
              />
            )}
          </dl>
        </Block>
      </div>
    </TutorSection>
  );
}

function Block({
  labelBn,
  icon: Icon,
  children,
}: {
  labelBn: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-ink-400">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {labelBn}
      </p>
      {children}
    </div>
  );
}

function Detail({
  labelBn,
  value,
  icon: Icon,
}: {
  labelBn: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10.5px] font-medium leading-tight text-ink-400">
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span className="truncate">{labelBn}</span>
      </dt>
      <dd className="mt-1 text-[13px] font-bold leading-snug text-ink-900">{value}</dd>
    </div>
  );
}