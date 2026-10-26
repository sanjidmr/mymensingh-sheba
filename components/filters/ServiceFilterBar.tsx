'use client';

import React, { useEffect, useState } from 'react';
import {
  SlidersHorizontal,
  X,
  MapPin,
  ArrowUpDown,
  RotateCcw,
  ChevronDown,
  Droplets,
  Check,
} from 'lucide-react';
import { BLOOD_GROUPS, ServiceType, SortOption } from '@/lib/filter-definitions';
import {
  TUTOR_CLASSES,
  TUTOR_SUBJECTS,
  TUTOR_TEACHING_MODES,
  TUTOR_GENDERS,
  TUTOR_EXPERIENCE_OPTIONS,
  TUTOR_EDUCATION_OPTIONS,
  TUTOR_FEE_PRESETS,
  TUTOR_AVAILABILITY_OPTIONS,
} from '@/lib/filter-definitions';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';
import ServiceFilterDrawer from './ServiceFilterDrawer';
import LocationPickerModal from '@/components/LocationPickerModal';

interface ServiceFilterBarProps {
  serviceType: ServiceType;
  filterValues: Record<string, unknown>;
  onFilterChange: (newFilters: Record<string, unknown>) => void;
  onResetFilters: () => void;
  totalResults: number;
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (sortId: string) => void;
  subjectOptions?: { id: string; labelBn: string }[];
  inlineAction?: React.ReactNode;
}

export default function ServiceFilterBar({
  serviceType,
  filterValues,
  onFilterChange,
  onResetFilters,
  totalResults,
  sortOptions,
  currentSort = 'newest',
  onSortChange,
  subjectOptions,
  inlineAction,
}: ServiceFilterBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isBloodGroupOpen, setIsBloodGroupOpen] = useState(false);

  // The blood-group picker is a bottom sheet on a phone, so it owns the
  // viewport while it is open: Escape closes it and the page behind it must not
  // scroll. Without the scroll lock the sheet looked clipped on iOS because the
  // page kept moving underneath a `fixed` element.
  useEffect(() => {
    if (!isBloodGroupOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsBloodGroupOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isBloodGroupOpen]);

  // Calculate active filter count (excluding default 'all' and undefined)
  const activeChips: { key: string; label: string }[] = [];

  // 1. Area chip
  if (typeof filterValues.areaId === 'string' && filterValues.areaId) {
    const area = getAreaById(filterValues.areaId);
    if (area) {
      activeChips.push({
        key: 'areaId',
        label: `${area.nameBn}`,
      });
    }
  }

  // 2. Pickup & Destination (Home Moving)
  if (typeof filterValues.pickupAreaId === 'string' && filterValues.pickupAreaId) {
    const p = getAreaById(filterValues.pickupAreaId);
    if (p) activeChips.push({ key: 'pickupAreaId', label: `পিকআপ: ${p.nameBn}` });
  }
  if (typeof filterValues.destinationAreaId === 'string' && filterValues.destinationAreaId) {
    const d = getAreaById(filterValues.destinationAreaId);
    if (d) activeChips.push({ key: 'destinationAreaId', label: `গন্তব্য: ${d.nameBn}` });
  }

  // 3. Property Type
  if (typeof filterValues.propertyType === 'string' && filterValues.propertyType !== 'all') {
    const pType = filterValues.propertyType;
    const labelMap: Record<string, string> = {
      family: 'ফ্যামিলি ফ্ল্যাট',
      flat: 'স্ট্যান্ডার্ড ফ্ল্যাট',
      sublet: 'সাবলেট রুম',
      bachelor: 'ব্যাচেলর বাসা',
      mess: 'মেস বাসা',
      seat: 'সিট ভাড়া',
      hostel: 'হোস্টেল',
    };
    activeChips.push({
      key: 'propertyType',
      label: labelMap[pType] || pType,
    });
  }

  // 4. Rent Budget
  if (typeof filterValues.rentPreset === 'string' && filterValues.rentPreset !== 'all') {
    const preset = filterValues.rentPreset;
    const presetMap: Record<string, string> = {
      under5k: '৳৫,০০০ এর নিচে',
      '5k-10k': '৳৫,০০০ – ১০,০০০',
      '10k-20k': '৳১০,০০০ – ২০,০০০',
      above20k: '৳২০,০০০ এর বেশি',
    };
    activeChips.push({
      key: 'rentPreset',
      label: presetMap[preset] || 'বাজেট নির্ধারিত',
    });
  }

  // 5. Bedrooms
  if (filterValues.bedrooms && filterValues.bedrooms !== 'all') {
    activeChips.push({
      key: 'bedrooms',
      label: `${String(filterValues.bedrooms)} বেড`,
    });
  }

  // 5b. Bathrooms
  if (filterValues.bathrooms && filterValues.bathrooms !== 'all') {
    activeChips.push({
      key: 'bathrooms',
      label: `${String(filterValues.bathrooms)}+ বাথ`,
    });
  }

  // 5c. Availability
  if (filterValues.availability && filterValues.availability !== 'all') {
    activeChips.push({
      key: 'availability',
      label: 'তাৎক্ষণিক প্রস্তুত',
    });
  }

  // 6. Blood Group
  if (typeof filterValues.bloodGroup === 'string' && filterValues.bloodGroup !== 'all') {
    activeChips.push({
      key: 'bloodGroup',
      label: `গ্রুপ: ${filterValues.bloodGroup}`,
    });
  }

  // 7. Emergency toggle
  if (filterValues.isEmergency) {
    activeChips.push({
      key: 'isEmergency',
      label: '⚡ জরুরি অন-কল',
    });
  }

  // 8. Available now toggle
  if (filterValues.isAvailableNow) {
    activeChips.push({
      key: 'isAvailableNow',
      label: '🩸 রক্তদানে প্রস্তুত',
    });
  }

  // 9. Work Type (Kajer Bua)
  if (filterValues.workType && filterValues.workType !== 'all') {
    activeChips.push({
      key: 'workType',
      label: 'কাজের ধরন ফিল্টার',
    });
  }

  // 9b. Work Mode (Full-time / Part-time / Live-in)
  if (filterValues.workMode && filterValues.workMode !== 'all') {
    const modeMap: Record<string, string> = {
      full_time: 'ফুল-টাইম',
      part_time: 'পার্ট-টাইম',
      live_in: 'বাসায় থেকে',
      day_based: 'দিন ভিত্তিক',
    };
    activeChips.push({
      key: 'workMode',
      label: modeMap[String(filterValues.workMode)] || 'কাজের সময়সূচি',
    });
  }

  // 9c. Experience (Staff services)
  if (
    serviceType !== 'home-tutor' &&
    typeof filterValues.experienceYears === 'string' &&
    filterValues.experienceYears !== 'all'
  ) {
    activeChips.push({
      key: 'experienceYears',
      label: 'অভিজ্ঞতা ফিল্টার',
    });
  }

  // 9d. Monthly salary / rate (Kajer Bua + Tutor fee presets)
  if (
    typeof filterValues.salaryPreset === 'string' &&
    filterValues.salaryPreset !== 'all'
  ) {
    const feeOption =
      serviceType === 'home-tutor'
        ? TUTOR_FEE_PRESETS.find((f) => f.id === filterValues.salaryPreset)
        : undefined;
    const salMap: Record<string, string> = {
      under_3000: '৩,০০০৳ এর নিচে',
      '3000_5000': '৩,০০০ – ৫,০০০৳',
      '5000_8000': '৫,০০০ – ৮,০০০৳',
      above_8000: '৮,০০০৳ এর বেশি',
    };
    activeChips.push({
      key: 'salaryPreset',
      label: feeOption?.labelBn || salMap[String(filterValues.salaryPreset)] || 'সম্মানী',
    });
  }

  // 10. Class / Subject (Home Tutor)
  if (serviceType === 'home-tutor') {
    if (filterValues.classLevel && filterValues.classLevel !== 'all') {
      const cls = TUTOR_CLASSES.find((c) => c.id === filterValues.classLevel);
      activeChips.push({
        key: 'classLevel',
        label: cls?.labelBn || 'শ্রেণি ফিল্টার',
      });
    }
    if (filterValues.subject && filterValues.subject !== 'all') {
      const sub = (subjectOptions ?? TUTOR_SUBJECTS).find((s) => s.id === filterValues.subject);
      activeChips.push({
        key: 'subject',
        label: sub?.labelBn || 'বিষয় ফিল্টার',
      });
    }
    if (filterValues.mode && filterValues.mode !== 'all') {
      const mode = TUTOR_TEACHING_MODES.find((m) => m.id === filterValues.mode);
      activeChips.push({ key: 'mode', label: mode?.labelBn || 'মাধ্যম ফিল্টার' });
    }
    if (filterValues.gender && filterValues.gender !== 'all') {
      const g = TUTOR_GENDERS.find((x) => x.id === filterValues.gender);
      activeChips.push({ key: 'gender', label: g?.labelBn || 'জেন্ডার ফিল্টার' });
    }
    if (
      typeof filterValues.experienceYears === 'string' &&
      filterValues.experienceYears !== 'all'
    ) {
      const exp = TUTOR_EXPERIENCE_OPTIONS.find((x) => x.id === filterValues.experienceYears);
      activeChips.push({
        key: 'experienceYears',
        label: `অভিজ্ঞতা: ${exp?.labelBn || 'ফিল্টার'}`,
      });
    }
    if (filterValues.education && filterValues.education !== 'all') {
      const edu = TUTOR_EDUCATION_OPTIONS.find((x) => x.id === filterValues.education);
      activeChips.push({
        key: 'education',
        label: `যোগ্যতা: ${edu?.labelBn || 'ফিল্টার'}`,
      });
    }
    if (filterValues.availability && filterValues.availability !== 'all') {
      const av = TUTOR_AVAILABILITY_OPTIONS.find((x) => x.id === filterValues.availability);
      activeChips.push({ key: 'availability', label: av?.labelBn || 'প্রাপ্যতা ফিল্টার' });
    }
    if (filterValues.ratedOnly) {
      activeChips.push({ key: 'ratedOnly', label: 'শুধু বাস্তব রিভিউসহ' });
    }
  } else if (filterValues.classLevel && filterValues.classLevel !== 'all') {
    activeChips.push({
      key: 'classLevel',
      label: 'শ্রেণি ফিল্টার',
    });
  }

  const activeCount = activeChips.length;

  const handleRemoveChip = (key: string) => {
    const updated: Record<string, unknown> = { ...filterValues };
    if (key === 'rentPreset') {
      delete updated.rentPreset;
      delete updated.minRent;
      delete updated.maxRent;
    } else if (key === 'salaryPreset') {
      delete updated.salaryPreset;
      delete updated.salaryMin;
      delete updated.salaryMax;
    } else {
      delete updated[key];
    }
    onFilterChange(updated);
  };

  /*
   * Blood donors get ONE control: the blood group.
   *
   * The shared bar used to show a general "ফিল্টার" drawer and a separate area
   * picker. Neither belongs on an emergency screen — a reader arrives knowing
   * the group, and the extra chrome pushed the actual filter off the first
   * screen on a phone. The picker is a single full-width button that opens a
   * viewport-anchored bottom sheet, so it can never be clipped or pushed below
   * the fold by the header above it.
   */
  if (serviceType === 'blood-donor') {
    const selectedGroup =
      typeof filterValues.bloodGroup === 'string' && filterValues.bloodGroup
        ? filterValues.bloodGroup
        : 'all';
    const selectedLabel =
      BLOOD_GROUPS.find((group) => group.id === selectedGroup)?.labelBn ?? 'সকল গ্রুপ';

    const chooseGroup = (groupId: string) => {
      const next: Record<string, unknown> = { ...filterValues };
      if (groupId === 'all') delete next.bloodGroup;
      else next.bloodGroup = groupId;
      onFilterChange(next);
      setIsBloodGroupOpen(false);
    };

    return (
      <div className="mb-6">
        <div className="rounded-2xl border border-brand-100 bg-white p-3 shadow-[0_1px_3px_rgba(7,39,31,0.06)] sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setIsBloodGroupOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isBloodGroupOpen}
              className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl border-2 border-rose-200 bg-rose-50 px-3.5 text-left transition-colors hover:border-rose-300 hover:bg-rose-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[280px]"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-700 text-white">
                  <Droplets className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-rose-700">
                    রক্তের গ্রুপ
                  </span>
                  <span className="block truncate text-[15px] font-black text-rose-950">
                    {selectedLabel}
                  </span>
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-rose-700 transition-transform ${
                  isBloodGroupOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-[12.5px] font-medium text-ink-500">
                মোট <strong className="font-extrabold text-ink-900">{totalResults}</strong> জন
                রক্তদাতা
              </span>
              {selectedGroup !== 'all' && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[12px] font-bold text-rose-700 transition-colors hover:bg-rose-50 hover:text-rose-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  সব গ্রুপ
                </button>
              )}
            </div>
          </div>
        </div>

        {isBloodGroupOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-label="রক্তের গ্রুপ নির্বাচন"
          >
            <button
              type="button"
              onClick={() => setIsBloodGroupOpen(false)}
              aria-label="গ্রুপ নির্বাচন বন্ধ করুন"
              className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-[2px]"
            />

            <div className="relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[80dvh] sm:rounded-3xl">
              <div className="flex items-center justify-between gap-3 border-b border-mist-100 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                    <Droplets className="h-4.5 w-4.5" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-[14.5px] font-extrabold text-ink-900">রক্তের গ্রুপ</h2>
                    <p className="text-[11.5px] text-ink-500">যে গ্রুপ দরকার সেটি বেছে নিন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBloodGroupOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist-50 text-ink-500 transition-colors hover:bg-mist-100 hover:text-ink-900"
                  aria-label="বন্ধ করুন"
                >
                  <X className="h-4.5 w-4.5" aria-hidden="true" />
                </button>
              </div>

              <div
                className="grid grid-cols-3 gap-2 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:grid-cols-4"
                role="listbox"
                aria-label="রক্তের গ্রুপসমূহ"
              >
                {BLOOD_GROUPS.map((group) => {
                  const active = selectedGroup === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => chooseGroup(group.id)}
                      className={`flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl border-2 px-2 text-[14px] font-extrabold transition-all ${
                        active
                          ? 'border-rose-700 bg-rose-700 text-white shadow-sm'
                          : 'border-mist-200 bg-white text-ink-700 hover:border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                      {group.labelBn}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedArea = getAreaById(
    typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined
  );

  if (serviceType === 'home-tutor') {
    const areas = getAllMCCAreas({ activeOnly: true }).map((area) => ({
      id: area.id,
      labelBn: area.nameBn,
    }));
    const updateTutorFilter = (key: string, value: string) => {
      const next = { ...filterValues };
      if (!value || value === 'all') delete next[key];
      else next[key] = value;
      onFilterChange(next);
    };

    return (
      <section className="mb-3 rounded-xl border border-mist-200 bg-white p-2 sm:mb-4 sm:rounded-2xl sm:p-3">
        <div className="flex min-w-0 items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
            {inlineAction}
            <button
              type="button"
              aria-expanded={isDrawerOpen}
              onClick={() => setIsDrawerOpen((open) => !open)}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-brand-700 px-2 text-[11px] font-bold text-white transition-colors hover:bg-brand-800 sm:min-h-10 sm:gap-2 sm:rounded-xl sm:px-3.5 sm:text-[13px]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              ফিল্টার
              {activeCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-400 px-1 text-[10px] font-extrabold text-brand-950 sm:h-5 sm:min-w-5 sm:text-[11px]">
                  {activeCount}
                </span>
              )}
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                aria-label="সব ফিল্টার মুছুন"
                className="inline-flex min-h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-1.5 text-xs font-bold text-ink-500 hover:bg-mist-50 sm:min-h-10 sm:px-2"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">মুছুন</span>
              </button>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-3">
            <span className="shrink-0 text-[10px] text-ink-500 sm:text-xs">
              <strong className="text-ink-800">{totalResults}</strong> জন
            </span>
            {sortOptions && onSortChange && (
              <label className="flex min-w-0 items-center gap-1 sm:gap-1.5">
                <span className="sr-only sm:not-sr-only">সাজান</span>
                <select
                  aria-label="গৃহশিক্ষক সাজান"
                  value={currentSort}
                  onChange={(event) => onSortChange(event.target.value)}
                  className="min-h-9 w-[86px] min-w-0 rounded-lg border border-brand-100 bg-mist-50 px-1 text-[10px] font-medium text-ink-800 sm:min-h-10 sm:w-auto sm:max-w-36 sm:px-2 sm:text-xs"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.labelBn}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {isDrawerOpen && (
          <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-mist-100 pt-3 sm:grid-cols-3 lg:grid-cols-4">
            <TutorSelect
              label="এলাকা"
              value={String(filterValues.areaId ?? 'all')}
              options={[{ id: 'all', labelBn: 'সব এলাকা' }, ...areas]}
              onChange={(value) => updateTutorFilter('areaId', value)}
            />
            <TutorSelect
              label="শ্রেণি"
              value={String(filterValues.classLevel ?? 'all')}
              options={TUTOR_CLASSES}
              onChange={(value) => updateTutorFilter('classLevel', value)}
            />
            <TutorSelect
              label="বিষয়"
              value={String(filterValues.subject ?? 'all')}
              options={subjectOptions ?? TUTOR_SUBJECTS}
              onChange={(value) => updateTutorFilter('subject', value)}
            />
            <TutorSelect
              label="পড়ানোর মাধ্যম"
              value={String(filterValues.mode ?? 'all')}
              options={TUTOR_TEACHING_MODES}
              onChange={(value) => updateTutorFilter('mode', value)}
            />
            <TutorSelect
              label="শিক্ষকের ধরন"
              value={String(filterValues.gender ?? 'all')}
              options={TUTOR_GENDERS}
              onChange={(value) => updateTutorFilter('gender', value)}
            />
            <TutorSelect
              label="অভিজ্ঞতা"
              value={String(filterValues.experienceYears ?? 'all')}
              options={TUTOR_EXPERIENCE_OPTIONS}
              onChange={(value) => updateTutorFilter('experienceYears', value)}
            />
            <TutorSelect
              label="শিক্ষাগত যোগ্যতা"
              value={String(filterValues.education ?? 'all')}
              options={TUTOR_EDUCATION_OPTIONS}
              onChange={(value) => updateTutorFilter('education', value)}
            />
            <TutorSelect
              label="মাসিক বেতন"
              value={String(filterValues.salaryPreset ?? 'all')}
              options={TUTOR_FEE_PRESETS}
              onChange={(value) => updateTutorFilter('salaryPreset', value)}
            />
            <TutorSelect
              label="প্রাপ্যতা"
              value={String(filterValues.availability ?? 'all')}
              options={TUTOR_AVAILABILITY_OPTIONS}
              onChange={(value) => updateTutorFilter('availability', value)}
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="mb-6 space-y-3">
      {/* Top Bar: Controls + Results Counter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        {/* Left: Quick Area Picker + Filter Drawer Trigger */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Main Filter Button (Mobile + Desktop) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>ফিল্টার</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-extrabold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {/* Location Quick Button (if service uses single areaId) */}
          {serviceType !== 'home-moving' && (
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                selectedArea
                  ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <MapPin
                className={`w-3.5 h-3.5 ${
                  selectedArea ? 'text-emerald-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">
                {selectedArea ? selectedArea.nameBn : 'এলাকা নির্বাচন'}
              </span>
            </button>
          )}

          {/* Quick Clear if any active filters */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline px-2 py-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>মুছুন</span>
            </button>
          )}
        </div>

        {/* Right: Results Count & Sorting */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            মোট <strong>{totalResults}</strong> টি ফলাফল
          </span>

          {sortOptions && sortOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                aria-label="ফলাফল সাজান"
                value={currentSort}
                onChange={(e) => onSortChange?.(e.target.value)}
                className="min-h-10 rounded-lg border border-mist-200 bg-mist-50 px-2.5 text-xs font-medium text-ink-800 outline-none transition-colors focus:border-brand-500"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.labelBn}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Compact Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            সক্রিয় ফিল্টার:
          </span>

          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold px-2.5 py-1 rounded-lg"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveChip(chip.key)}
                className="hover:text-emerald-950 p-0.5 rounded-full hover:bg-emerald-100"
                aria-label={`${chip.label} ফিল্টার সরান`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 hover:underline ml-1"
          >
            ফিল্টার পরিবর্তন করুন
          </button>
        </div>
      )}

      {/* Main Filter Drawer / Bottom Sheet */}
      <ServiceFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        serviceType={serviceType}
        filterValues={filterValues}
        onApplyFilters={onFilterChange}
        onResetFilters={onResetFilters}
        resultCount={totalResults}
        subjectOptions={subjectOptions}
      />

      {/* Quick Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        selectedAreaId={typeof filterValues.areaId === 'string' ? filterValues.areaId : null}
        onSelectArea={(area) => {
          onFilterChange({
            ...filterValues,
            areaId: area ? area.id : undefined,
          });
        }}
        title="সেবার এলাকা বেছে নিন"
      />
    </div>
  );
}

function TutorSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; labelBn: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block truncate text-[11px] font-semibold text-ink-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 w-full min-w-0 rounded-lg border border-brand-100 bg-white px-2 text-xs text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.labelBn}</option>
        ))}
      </select>
    </label>
  );
}
