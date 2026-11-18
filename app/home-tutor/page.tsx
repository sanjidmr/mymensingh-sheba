'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Loader2, PlusCircle, Search } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import ServiceFilterBar from '@/components/filters/ServiceFilterBar';
import EmptyFilterResults from '@/components/filters/EmptyFilterResults';
import TutorCard from '@/components/home-tutor/TutorCard';
import { fetchPublishedTutors } from '@/lib/home-tutor-service';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  TUTOR_EXPERIENCE_OPTIONS,
  TUTOR_FEE_PRESETS,
  TUTOR_SUBJECTS,
  type SortOption,
} from '@/lib/filter-definitions';
import { getAreaById } from '@/lib/locations';
import { areaNameKey } from '@/lib/area-names';
import {
  tutorClassMatches,
  isStandardTutorSubject,
  tutorSubjectMatches,
  matchesTutorEducation,
} from '@/lib/home-tutor-types';

const TUTOR_SORT_OPTIONS: SortOption[] = [
  { id: 'newest', labelBn: 'সর্বশেষ প্রকাশিত' },
  { id: 'rating', labelBn: 'ভালো রিভিউ (বাস্তব)' },
  { id: 'fee_low', labelBn: 'কম বেতন আগে' },
];

function HomeTutorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialArea = searchParams.get('area') || undefined;
  const initialClass = searchParams.get('class') || undefined;
  const initialSubject = searchParams.get('subject') || undefined;

  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({
    areaId: initialArea,
    classLevel: initialClass,
    subject: initialSubject,
  });
  const [sortBy, setSortBy] = useState('newest');
  const [query, setQuery] = useState('');
  const [tutors, setTutors] = useState<HomeTutorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedTutors().then((data) => {
      if (cancelled) return;
      setTutors(data);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilterValues(newFilters);
    const params = new URLSearchParams();
    if (newFilters.areaId) params.set('area', String(newFilters.areaId));
    if (newFilters.classLevel && newFilters.classLevel !== 'all') {
      params.set('class', String(newFilters.classLevel));
    }
    if (newFilters.subject && newFilters.subject !== 'all') {
      params.set('subject', String(newFilters.subject));
    }
    const query = params.toString();
    router.replace(`/home-tutor${query ? `?${query}` : ''}`, { scroll: false });
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSortBy('newest');
    router.replace('/home-tutor', { scroll: false });
  };

  const filteredTutors = useMemo(() => {
    let result = tutors.filter((t) => {
      const normalizedQuery = query.trim().toLocaleLowerCase();
      if (normalizedQuery) {
        const searchableText = [
          t.fullName,
          t.institution,
          t.department,
          ...t.preferredSubjects,
          ...t.preferredClasses,
          ...t.preferredAreas.flatMap((areaId) => {
            const area = getAreaById(areaId);
            return [areaId, area?.nameBn ?? ''];
          }),
        ].join(' ').toLocaleLowerCase();
        if (!searchableText.includes(normalizedQuery)) return false;
      }
      if (
        filterValues.areaId &&
        !t.preferredAreas.some((area) => areaNameKey(area) === areaNameKey(String(filterValues.areaId)))
      ) {
        return false;
      }
      if (filterValues.classLevel && filterValues.classLevel !== 'all') {
        if (!tutorClassMatches(String(filterValues.classLevel), t.preferredClasses)) return false;
      }
      if (filterValues.subject && filterValues.subject !== 'all') {
        if (!tutorSubjectMatches(String(filterValues.subject), t.preferredSubjects)) return false;
      }
      if (filterValues.mode && filterValues.mode !== 'all') {
        const mode = String(filterValues.mode);
        if (t.teachingMode !== mode && t.teachingMode !== 'both') return false;
      }
      if (filterValues.gender && filterValues.gender !== 'all') {
        if (t.gender !== String(filterValues.gender)) return false;
      }
      if (filterValues.experienceYears && filterValues.experienceYears !== 'all') {
        const band = TUTOR_EXPERIENCE_OPTIONS.find(
          (o) => o.id === filterValues.experienceYears
        );
        if (band) {
          let min = band.min ?? 0;
          let max = band.max ?? 1000;
          if (band.id === 'lt1') [min, max] = [0, 1];
          if (t.experienceYears < min || t.experienceYears >= max) return false;
        }
      }
      if (filterValues.education && filterValues.education !== 'all') {
        if (!matchesTutorEducation(t, String(filterValues.education))) return false;
      }
      if (filterValues.salaryPreset && filterValues.salaryPreset !== 'all') {
        const preset = TUTOR_FEE_PRESETS.find((p) => p.id === filterValues.salaryPreset);
        if (preset) {
          const low = preset.min ?? 0;
          const high = preset.max ?? Number.POSITIVE_INFINITY;
          if (t.expectedSalary < low || t.expectedSalary > high) return false;
        }
      }
      if (filterValues.availability && filterValues.availability !== 'all') {
        if (t.availability !== String(filterValues.availability)) return false;
      }
      if (filterValues.ratedOnly && Number(t.ratingCount) < 1) return false;
      return true;
    });

    if (sortBy === 'rating') {
      result = [...result].sort(
        (a, b) => Number(b.ratingCount ?? 0) - Number(a.ratingCount ?? 0)
      );
    } else if (sortBy === 'fee_low') {
      result = [...result].sort((a, b) => a.expectedSalary - b.expectedSalary);
    } else {
      result = [...result].sort((a, b) =>
        (b.publishedAt || b.createdAt || '').localeCompare(a.publishedAt || a.createdAt || '')
      );
    }
    return result;
  }, [tutors, filterValues, sortBy, query]);

  const subjectOptions = useMemo(() => {
    const customSubjects = new Map<string, string>();
    tutors.forEach((tutor) => {
      tutor.preferredSubjects.forEach((subject) => {
        if (!isStandardTutorSubject(subject)) {
          customSubjects.set(subject.toLocaleLowerCase(), subject);
        }
      });
    });
    return [
      ...TUTOR_SUBJECTS,
      ...Array.from(customSubjects.values())
        .sort((a, b) => a.localeCompare(b, 'bn'))
        .map((subject) => ({ id: subject, labelBn: subject })),
    ];
  }, [tutors]);

  const activeArea = getAreaById(
    typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined
  );

  return (
    <RoutePlaceholderShell
      title="গৃহশিক্ষক — ময়মনসিংহ"
      breadcrumbs={[{ label: 'গৃহশিক্ষক' }]}
      compact
    >
      <label className="mb-2.5 flex min-h-12 items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 shadow-xs focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-600/20">
        <Search className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="নাম, বিষয় বা এলাকা দিয়ে খুঁজুন"
          aria-label="গৃহশিক্ষক খুঁজুন"
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="খোঁজার লেখা মুছুন"
            className="rounded-md px-2 py-1 text-xs font-semibold text-ink-600 hover:bg-mist-50"
          >
            মুছুন
          </button>
        )}
      </label>

      {/* Filter control directly follows search, as on To-Let. */}
      <ServiceFilterBar
        serviceType="home-tutor"
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={filteredTutors.length}
        sortOptions={TUTOR_SORT_OPTIONS}
        currentSort={sortBy}
        onSortChange={setSortBy}
        subjectOptions={subjectOptions}
        inlineAction={
          <Link
            href="/profile/home-tutor/setup"
            className={`inline-flex h-12 w-full min-w-0 items-center justify-center gap-1 rounded-xl border border-brand-200 bg-brand-50 px-1.5 text-center text-[11px] font-bold leading-tight text-brand-800 transition-colors hover:bg-brand-100 min-[375px]:gap-1.5 min-[375px]:text-xs sm:basis-0 sm:flex-1 sm:gap-2 sm:px-3 sm:text-sm ${LIGHT_FOCUS}`}
          >
            <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">গৃহশিক্ষক খুলুন</span>
          </Link>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-ink-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <span className="text-sm">গৃহশিক্ষকদের তালিকা লোড হচ্ছে...</span>
        </div>
      ) : filteredTutors.length === 0 ? (
        <EmptyFilterResults
          onResetFilters={handleResetFilters}
          areaName={activeArea?.nameBn}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
          {filteredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-8 flex items-center gap-2 rounded-xl border border-mist-200 bg-mist-50 p-4 text-xs leading-relaxed text-ink-500">
        <Lock className="h-4 w-4 shrink-0 text-ink-400" />
        <span>
          সুরক্ষা নীতি: গৃহশিক্ষকের ব্যক্তিগত মোবাইল নম্বর উন্মুক্ত রাখা হয় না। অভিভাবকের প্রাথমিক
          রিকোয়েস্ট যাচাই সাপেক্ষে অ্যাডমিন টিম যোগাযোগ সমন্বয় করে। রিভিউ কেবল সম্পন্ন টিউশনের পর
          দেওয়া যায়।
        </span>
      </div>
    </RoutePlaceholderShell>
  );
}

export default function HomeTutorPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-12 text-center text-sm text-ink-500">
          গৃহশিক্ষকদের তালিকা লোড হচ্ছে...
        </div>
      }
    >
      <HomeTutorContent />
    </Suspense>
  );
}