'use client';

import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  MapPin,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { ServiceType, SortOption } from '@/lib/filter-definitions';
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
import { getAreaById } from '@/lib/locations';
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
}: ServiceFilterBarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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
      const sub = TUTOR_SUBJECTS.find((s) => s.id === filterValues.subject);
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

  const selectedArea = getAreaById(
    typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined
  );

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
                value={currentSort}
                onChange={(e) => onSortChange?.(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
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
