'use client';

/**
 * CoachingDetailSections — the coaching-only body of the detail page:
 * teachers, batch announcements, then the shared review section.
 *
 * It is fetched client-side (like the rest of the curated directories) so the
 * detail page keeps its data-access contract and stays honest: if the tables
 * are not migrated yet, each section degrades to an empty state rather than
 * inventing a teacher or a batch.
 */
import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, GraduationCap, Loader2, UserRound } from 'lucide-react';
import DirectoryReviews from '@/components/catalog/DirectoryReviews';
import { fetchCoachingBatches, fetchCoachingTeachers } from '@/lib/catalog-service';
import { bnDate, tagLabel, type CoachingBatch, type CoachingTeacher } from '@/lib/catalog-types';

export default function CoachingDetailSections({
  listingId,
  ratingAvg,
  ratingCount,
}: {
  listingId: string;
  ratingAvg?: number;
  ratingCount?: number;
}) {
  const [teachers, setTeachers] = useState<CoachingTeacher[]>([]);
  const [batches, setBatches] = useState<CoachingBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [t, b] = await Promise.all([
        fetchCoachingTeachers(listingId),
        fetchCoachingBatches(listingId),
      ]);
      if (!active) return;
      setTeachers(t);
      setBatches(b);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  return (
    <>
      {/* --- teachers --- */}
      <section aria-labelledby="coaching-teachers-heading">
        <h2 id="coaching-teachers-heading" className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900 sm:text-base">
          <GraduationCap className="h-4 w-4 text-brand-600" aria-hidden="true" /> শিক্ষকমণ্ডলী
        </h2>
        {loading ? (
          <p className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> লোড হচ্ছে…
          </p>
        ) : teachers.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-ink-500">এখনো কোনো শিক্ষকের তথ্য যোগ করা হয়নি।</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {teachers.map((t) => (
              <li key={t.id} className="rounded-xl border border-brand-100 bg-white p-3">
                <div className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist-100 text-brand-500"
                  >
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink-900">{t.nameBn}</p>
                    {t.subjects.length > 0 && (
                      <p className="mt-0.5 text-[11.5px] text-ink-500">
                        বিষয়: {t.subjects.map(tagLabel).join(', ')}
                      </p>
                    )}
                    {t.qualificationBn && (
                      <p className="text-[11.5px] text-ink-500">যোগ্যতা: {t.qualificationBn}</p>
                    )}
                    {t.experienceBn && (
                      <p className="text-[11.5px] text-ink-500">অভিজ্ঞতা: {t.experienceBn}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- batches --- */}
      <section className="mt-6" aria-labelledby="coaching-batches-heading">
        <h2 id="coaching-batches-heading" className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900 sm:text-base">
          <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" /> নতুন ব্যাচের ঘোষণা
        </h2>
        {loading ? (
          <p className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> লোড হচ্ছে…
          </p>
        ) : batches.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-ink-500">এখন কোনো সক্রিয় ব্যাচের ঘোষণা নেই।</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {batches.map((b) => (
              <li key={b.id} className="rounded-xl border border-brand-100 bg-white p-3">
                <p className="text-[13.5px] font-bold text-ink-900">{b.titleBn}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-500">
                  {bnDate(b.startDate) && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                      শুরু: {bnDate(b.startDate)}
                    </span>
                  )}
                  {b.startTime && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                      {b.startTime}
                    </span>
                  )}
                </div>
                {b.noteBn && <p className="mt-1 text-[12px] leading-relaxed text-ink-600">{b.noteBn}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <DirectoryReviews
        category="coaching"
        listingId={listingId}
        ratingAvg={ratingAvg}
        ratingCount={ratingCount}
      />
    </>
  );
}
