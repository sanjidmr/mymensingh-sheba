'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlusCircle, Lock, Loader2 } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import ServiceFilterBar from '@/components/filters/ServiceFilterBar';
import EmptyFilterResults from '@/components/filters/EmptyFilterResults';
import TutorCard from '@/components/home-tutor/TutorCard';
import { fetchPublishedTutors } from '@/lib/home-tutor-service';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  TUTOR_EXPERIENCE_OPTIONS,
  TUTOR_FEE_PRESETS,
  type SortOption,
} from '@/lib/filter-definitions';
import { getAreaById } from '@/lib/locations';
import {
  tutorClassMatches,
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
  const [tutors, setTutors] = useState<HomeTutorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedTutors().then((data) => {
      if (cancelled) return;
      setTutors(data);
      setLoading(false);
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
      if (filterValues.areaId && !t.preferredAreas.includes(String(filterValues.areaId))) {
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
          // overlapping ranges: the tutor's expected fee band overlaps the preset
          const overlap = t.expectedSalaryMax >= low && t.expectedSalaryMin <= high;
          if (!overlap) return false;
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
      result = [...result].sort((a, b) => a.expectedSalaryMin - b.expectedSalaryMin);
    } else {
      result = [...result].sort((a, b) =>
        (b.publishedAt || b.createdAt || '').localeCompare(a.publishedAt || a.createdAt || '')
      );
    }
    return result;
  }, [tutors, filterValues, sortBy]);

  const activeArea = getAreaById(
    typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined
  );

  return (
    <RoutePlaceholderShell
      title="গৃহশিক্ষক (Home Tutor) — ময়মনসিংহ"
      subtitle="ময়মনসিংহ মেডিকেল, আনন্দ মোহন কলেজ ও বাকৃবির শিক্ষার্থীদের যাচাই করা শিক্ষক প্রোফাইল। আপনার সন্তানের জন্য নির্ভরযোগ্য টিউটর খুঁজুন।"
      categoryBadge="শিক্ষা সেবা"
      breadcrumbs={[{ label: 'গৃহশিক্ষক' }]}
    >
      {/* Top Banner with Post Profile CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              মেডিকেল • আনন্দ মোহন • বাকৃবি
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            শিক্ষার্থী ও অভিজ্ঞ গৃহশিক্ষক খুঁজুন অথবা পড়াতে প্রোফাইল খুলুন
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            একই অ্যাকাউন্ট ব্যবহার করে গৃহশিক্ষক প্রোফাইল তৈরি ও আপডেট করতে পারবেন।
          </p>
        </div>

        <Link
          href="/profile/home-tutor/setup"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-900 transition-colors shrink-0 shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>গৃহশিক্ষক প্রোফাইল খুলুন</span>
        </Link>
      </div>

      {/* Centralized Filter Bar */}
      <ServiceFilterBar
        serviceType="home-tutor"
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={filteredTutors.length}
        sortOptions={TUTOR_SORT_OPTIONS}
        currentSort={sortBy}
        onSortChange={setSortBy}
      />

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-sm">গৃহশিক্ষকদের তালিকা লোড হচ্ছে...</span>
        </div>
      ) : filteredTutors.length === 0 ? (
        <EmptyFilterResults
          onResetFilters={handleResetFilters}
          areaName={activeArea?.nameBn}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTutors.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
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
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
          গৃহশিক্ষকদের তালিকা লোড হচ্ছে...
        </div>
      }
    >
      <HomeTutorContent />
    </Suspense>
  );
}