'use client';

import React, { useEffect } from 'react';
import {
  X,
  RotateCcw,
  Check,
  MapPin,
  Home,
  Sparkles,
  Zap,
  Wrench,
  Truck,
  GraduationCap,
  HeartHandshake,
} from 'lucide-react';
import LocationSelectInput from '@/components/LocationSelectInput';
import HomeMovingLocationPair from '@/components/HomeMovingLocationPair';
import {
  ServiceType,
  TOLET_PROPERTY_TYPES,
  TOLET_BEDROOM_OPTIONS,
  TOLET_BATHROOM_OPTIONS,
  TOLET_AVAILABILITY_OPTIONS,
  TOLET_RENT_PRESETS,
  TOLET_FACILITY_OPTIONS,
  KAJER_BUA_WORK_TYPES,
  KAJER_BUA_TIME_SLOTS,
  KAJER_BUA_WORK_MODES,
  KAJER_BUA_SALARY_PRESETS,
  STAFF_EXPERIENCE_OPTIONS,
  STAFF_AVAILABILITY_OPTIONS,
  ELECTRICIAN_SERVICE_TYPES,
  PLUMBING_SERVICE_TYPES,
  HOME_MOVING_PACKAGES,
  TUTOR_CLASSES,
  TUTOR_SUBJECTS,
  TUTOR_TEACHING_MODES,
  TUTOR_GENDERS,
  TUTOR_EXPERIENCE_OPTIONS,
  TUTOR_EDUCATION_OPTIONS,
  TUTOR_FEE_PRESETS,
  TUTOR_AVAILABILITY_OPTIONS,
  BLOOD_GROUPS,
} from '@/lib/filter-definitions';

interface ServiceFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  serviceType: ServiceType;
  filterValues: Record<string, unknown>;
  onApplyFilters: (newFilters: Record<string, unknown>) => void;
  onResetFilters: () => void;
  resultCount?: number;
}

/** Reusable block for staff services: experience + availability (electrician/plumber). */
function StaffFiltersBlock({
  draftFilters,
  updateDraft,
}: {
  draftFilters: Record<string, unknown>;
  updateDraft: (key: string, val: unknown) => void;
}) {
  return (
    <>
      {/* Experience */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
          অভিজ্ঞতা
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STAFF_EXPERIENCE_OPTIONS.map((opt) => {
            const isSelected = (draftFilters.experienceYears || 'all') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDraft('experienceYears', opt.id)}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {opt.labelBn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
          প্রাপ্যতা
        </label>
        <div className="grid grid-cols-2 gap-2">
          {STAFF_AVAILABILITY_OPTIONS.map((opt) => {
            const isSelected = (draftFilters.availability || 'all') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateDraft('availability', opt.id)}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                  isSelected
                    ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {opt.labelBn}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ServiceFilterDrawerModal({
  onClose,
  serviceType,
  filterValues,
  onApplyFilters,
  onResetFilters,
  resultCount,
}: Omit<ServiceFilterDrawerProps, 'isOpen'>) {
  // Local state inside drawer initialized cleanly upon mount
  const [draftFilters, setDraftFilters] = React.useState<Record<string, unknown>>(filterValues);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateDraft = (key: string, val: unknown) => {
    setDraftFilters((prev) => ({ ...prev, [key]: val }));
  };

  const toggleFacility = (id: string) => {
    const current = (draftFilters.facilities as string[]) || [];
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id];
    updateDraft('facilities', updated);
  };

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  const handleReset = () => {
    onResetFilters();
    setDraftFilters({});
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span>ফিল্টার নির্বাচন করুন</span>
              {resultCount !== undefined && (
                <span className="text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                  {resultCount}টি ফলাফল
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              পছন্দমতো শর্ত নির্বাচন করে সহজেই কাঙ্ক্ষিত সেবা খুঁজে নিন
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* ========================================================= */}
          {/* SERVICE SPECIFIC FILTERS */}
          {/* ========================================================= */}

          {/* 1. TO-LET FILTERS */}
          {serviceType === 'tolet' && (
            <>
              {/* Centralized MCC Area */}
              <div>
                <LocationSelectInput
                  value={(draftFilters.areaId as string) || null}
                  onChange={(areaId) => updateDraft('areaId', areaId)}
                  label="এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)"
                  placeholder="সকল এলাকা (সিটি কর্পোরেশন)"
                  size="md"
                />
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  বাসার ধরন
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TOLET_PROPERTY_TYPES.map((type) => {
                    const isSelected = (draftFilters.propertyType || 'all') === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateDraft('propertyType', type.id)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rent Range Presets */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  ভাড়া বাজেট (মাসিক)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TOLET_RENT_PRESETS.map((preset) => {
                    const isSelected = (draftFilters.rentPreset || 'all') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          updateDraft('rentPreset', preset.id);
                          updateDraft('minRent', preset.min);
                          updateDraft('maxRent', preset.max);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  বেডরুম সংখ্যা
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TOLET_BEDROOM_OPTIONS.map((bed) => {
                    const isSelected = (draftFilters.bedrooms || 'all') === bed.id;
                    return (
                      <button
                        key={bed.id}
                        type="button"
                        onClick={() => updateDraft('bedrooms', bed.id)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bed.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  বাথরুম সংখ্যা
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TOLET_BATHROOM_OPTIONS.map((bath) => {
                    const isSelected = (draftFilters.bathrooms || 'all') === bath.id;
                    return (
                      <button
                        key={bath.id}
                        type="button"
                        onClick={() => updateDraft('bathrooms', bath.id)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bath.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্রাপ্যতার সময়
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TOLET_AVAILABILITY_OPTIONS.map((avail) => {
                    const isSelected = (draftFilters.availability || 'all') === avail.id;
                    return (
                      <button
                        key={avail.id}
                        type="button"
                        onClick={() => updateDraft('availability', avail.id)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {avail.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্রয়োজনীয় সুযোগ-সুবিধা
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TOLET_FACILITY_OPTIONS.map((facility) => {
                    const isSelected = ((draftFilters.facilities as string[]) || []).includes(
                      facility.id
                    );
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => toggleFacility(facility.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-700 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{facility.labelBn}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 2. কাজের বুয়া FILTERS */}
          {serviceType === 'kajer-bua' && (
            <>
              {/* Centralized MCC Area */}
              <div>
                <LocationSelectInput
                  value={(draftFilters.areaId as string) || null}
                  onChange={(areaId) => updateDraft('areaId', areaId)}
                  label="এলাকা (ময়মনসিংহ সিটি)"
                  placeholder="সকল এলাকা"
                  size="md"
                />
              </div>

              {/* Work Type */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  কাজের ধরন
                </label>
                <div className="space-y-1.5">
                  {KAJER_BUA_WORK_TYPES.map((type) => {
                    const isSelected = (draftFilters.workType || 'all') === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateDraft('workType', type.id)}
                        className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{type.labelBn}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Work Time Slot */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  কাজের সময়সূচি
                </label>
                <div className="space-y-1.5">
                  {KAJER_BUA_TIME_SLOTS.map((slot) => {
                    const isSelected = (draftFilters.workTime || 'all') === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => updateDraft('workTime', slot.id)}
                        className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{slot.labelBn}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full-time / Part-time / Live-in / Day-based */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  ফুল-টাইম / পার্ট-টাইম / লাইভ-ইন
                </label>
                <div className="space-y-1.5">
                  {KAJER_BUA_WORK_MODES.map((mode) => {
                    const isSelected = (draftFilters.workMode || 'all') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateDraft('workMode', mode.id)}
                        className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{mode.labelBn}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  অভিজ্ঞতা
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STAFF_EXPERIENCE_OPTIONS.map((opt) => {
                    const isSelected = (draftFilters.experienceYears || 'all') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateDraft('experienceYears', opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্রাপ্যতা
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STAFF_AVAILABILITY_OPTIONS.map((opt) => {
                    const isSelected = (draftFilters.availability || 'all') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateDraft('availability', opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expected monthly salary / rate */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্রত্যাশিত সম্মানী / বেতন (মাসিক)
                </label>
                <div className="flex flex-wrap gap-2">
                  {KAJER_BUA_SALARY_PRESETS.map((preset) => {
                    const isSelected = (draftFilters.salaryPreset || 'all') === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          updateDraft('salaryPreset', preset.id);
                          updateDraft('salaryMin', preset.min);
                          updateDraft('salaryMax', preset.max);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 3. ELECTRICIAN FILTERS */}
          {serviceType === 'electrician' && (
            <>
              <div>
                <LocationSelectInput
                  value={(draftFilters.areaId as string) || null}
                  onChange={(areaId) => updateDraft('areaId', areaId)}
                  label="এলাকা (যেখানে সেবা প্রয়োজন)"
                  placeholder="সকল এলাকা (ময়মনসিংহ সিটি)"
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  কাজের ধরন / সমস্যা
                </label>
                <div className="space-y-1.5">
                  {ELECTRICIAN_SERVICE_TYPES.map((type) => {
                    const isSelected = (draftFilters.serviceType || 'all') === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateDraft('serviceType', type.id)}
                        className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{type.labelBn}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emergency Only */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={Boolean(draftFilters.isEmergency)}
                    onChange={(e) => updateDraft('isEmergency', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      জরুরি সার্ভিস প্রয়োজন (অন-কল)
                    </span>
                    <span className="text-[11px] text-amber-800 block">
                      ৩০-৬০ মিনিটের মধ্যে উপস্থিত হতে পারেন এমন টেকনিশিয়ান
                    </span>
                  </div>
                </label>
              </div>

              <StaffFiltersBlock draftFilters={draftFilters} updateDraft={updateDraft} />
            </>
          )}

          {/* 4. PLUMBER FILTERS */}
          {serviceType === 'plumber' && (
            <>
              <div>
                <LocationSelectInput
                  value={(draftFilters.areaId as string) || null}
                  onChange={(areaId) => updateDraft('areaId', areaId)}
                  label="এলাকা (যেখানে সেবা প্রয়োজন)"
                  placeholder="সকল এলাকা (ময়মনসিংহ সিটি)"
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্লাম্বিং সমস্যার ধরন
                </label>
                <div className="space-y-1.5">
                  {PLUMBING_SERVICE_TYPES.map((type) => {
                    const isSelected = (draftFilters.serviceType || 'all') === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => updateDraft('serviceType', type.id)}
                        className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{type.labelBn}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emergency Only */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer bg-amber-50/70 border border-amber-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={Boolean(draftFilters.isEmergency)}
                    onChange={(e) => updateDraft('isEmergency', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      জরুরি প্লাম্বিং সার্ভিস প্রয়োজন (অন-কল)
                    </span>
                    <span className="text-[11px] text-amber-800 block">
                      পাইপ/ট্যাঙ্ক ব্লকেজ বা লিক সংক্রান্ত তাৎক্ষণিক মেরামত
                    </span>
                  </div>
                </label>
              </div>

              <StaffFiltersBlock draftFilters={draftFilters} updateDraft={updateDraft} />
            </>
          )}

          {/* 5. বাসা পাল্টানো (HOME MOVING) FILTERS */}
          {serviceType === 'home-moving' && (
            <>
              {/* Specialized Pickup + Destination Pair */}
              <HomeMovingLocationPair
                pickupAreaId={(draftFilters.pickupAreaId as string) || null}
                destinationAreaId={(draftFilters.destinationAreaId as string) || null}
                onPickupChange={(id) => updateDraft('pickupAreaId', id)}
                onDestinationChange={(id) => updateDraft('destinationAreaId', id)}
              />

              {/* Package Type */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  শিফটিং প্যাকেজ ধরন
                </label>
                <div className="space-y-1.5">
                  {HOME_MOVING_PACKAGES.map((pkg) => {
                    const isSelected = (draftFilters.packageType || 'all') === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => updateDraft('packageType', pkg.id)}
                        className={`w-full p-2.5 rounded-xl text-xs text-left border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 font-bold shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{pkg.labelBn}</span>
                        {isSelected && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 6. গৃহশিক্ষক (HOME TUTOR) FILTERS */}
          {serviceType === 'home-tutor' && (
            <>
              <div>
                <LocationSelectInput
                  value={(draftFilters.areaId as string) || null}
                  onChange={(areaId) => updateDraft('areaId', areaId)}
                  label="পড়ানোর এলাকা (ময়মনসিংহ সিটি)"
                  placeholder="সকল এলাকা"
                  size="md"
                />
              </div>

              {/* Class Level */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  শ্রেণি / স্তর
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TUTOR_CLASSES.map((cls) => {
                    const isSelected = (draftFilters.classLevel || 'all') === cls.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => updateDraft('classLevel', cls.id)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cls.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  নির্দিষ্ট বিষয়
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TUTOR_SUBJECTS.map((sub) => {
                    const isSelected = (draftFilters.subject || 'all') === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => updateDraft('subject', sub.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {sub.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Teaching Mode */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  পড়ানোর মাধ্যম
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TUTOR_TEACHING_MODES.map((mode) => {
                    const isSelected = (draftFilters.mode || 'all') === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateDraft('mode', mode.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {mode.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tutor Gender */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  শিক্ষক জেন্ডার
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TUTOR_GENDERS.map((gen) => {
                    const isSelected = (draftFilters.gender || 'all') === gen.id;
                    return (
                      <button
                        key={gen.id}
                        type="button"
                        onClick={() => updateDraft('gender', gen.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {gen.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  অভিজ্ঞতা
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TUTOR_EXPERIENCE_OPTIONS.map((exp) => {
                    const isSelected = (draftFilters.experienceYears || 'all') === exp.id;
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => updateDraft('experienceYears', exp.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {exp.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  শিক্ষাগত যোগ্যতা
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TUTOR_EDUCATION_OPTIONS.map((edu) => {
                    const isSelected = (draftFilters.education || 'all') === edu.id;
                    return (
                      <button
                        key={edu.id}
                        type="button"
                        onClick={() => updateDraft('education', edu.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {edu.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expected monthly fee */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্রত্যাশিত মাসিক বেতন
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TUTOR_FEE_PRESETS.map((fee) => {
                    const isSelected = (draftFilters.salaryPreset || 'all') === fee.id;
                    return (
                      <button
                        key={fee.id}
                        type="button"
                        onClick={() => updateDraft('salaryPreset', fee.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {fee.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  প্রাপ্যতা
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TUTOR_AVAILABILITY_OPTIONS.map((av) => {
                    const isSelected = (draftFilters.availability || 'all') === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => updateDraft('availability', av.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {av.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Only tutors with genuine reviews */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(draftFilters.ratedOnly)}
                    onChange={(e) => updateDraft('ratedOnly', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                  />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    একমাত্র যাদের বাস্তব রিভিউ আছে তাদের দেখান
                  </span>
                </label>
              </div>
            </>
          )}

          {/* 7. রক্তদাতা (BLOOD DONOR) FILTERS */}
          {serviceType === 'blood-donor' && (
            <>
              {/* Blood Group */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                  রক্তের গ্রুপ
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {BLOOD_GROUPS.map((bg) => {
                    const isSelected = (draftFilters.bloodGroup || 'all') === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => updateDraft('bloodGroup', bg.id)}
                        className={`p-3 rounded-xl text-sm font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {bg.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Area */}
              <div>
                <LocationSelectInput
                  value={(draftFilters.areaId as string) || null}
                  onChange={(areaId) => updateDraft('areaId', areaId)}
                  label="রক্তদাতার এলাকা (ময়মনসিংহ সিটি)"
                  placeholder="সকল এলাকা (মেডিকেল সংলগ্ন ইত্যাদি)"
                  size="md"
                />
              </div>

              {/* Available Now */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={Boolean(draftFilters.isAvailableNow)}
                    onChange={(e) => updateDraft('isAvailableNow', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-700 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      বর্তমানে রক্তদানে প্রস্তুত
                    </span>
                    <span className="text-[11px] text-emerald-800 block">
                      শেষ রক্তদানের পর ৩ মাসের বেশি সময় অতিক্রান্ত হয়েছে
                    </span>
                  </div>
                </label>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                রক্তদাতার ফোন নম্বর সরাসরি প্রদর্শিত হয় না। প্রেসক্রিপশন যাচাই সাপেক্ষে জরুরি ভিত্তিতে অ্যাডমিন সমন্বয়ের মাধ্যমে যোগাযোগ করিয়ে দেওয়া হয়।
              </div>
            </>
          )}
        </div>

        {/* Drawer Sticky Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="w-1/3 py-3 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>মুছুন</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="w-2/3 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700"
          >
            <span>ফিল্টার প্রয়োগ করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ServiceFilterDrawer(props: ServiceFilterDrawerProps) {
  if (!props.isOpen) return null;
  return <ServiceFilterDrawerModal {...props} />;
}
