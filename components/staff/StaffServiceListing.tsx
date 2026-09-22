'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { fetchPublicStaffProfiles } from '@/lib/staff-service';
import type { StaffProfile, StaffServiceKey } from '@/lib/staff-types';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { STAFF_ACCENT_CLASSES } from '@/lib/staff-labels';
import {
  STAFF_EXPERIENCE_OPTIONS,
  KAJER_BUA_SALARY_PRESETS,
} from '@/lib/filter-definitions';
import ServiceFilterBar from '@/components/filters/ServiceFilterBar';
import EmptyFilterResults from '@/components/filters/EmptyFilterResults';
import { StaffProfileCard } from '@/components/staff/StaffProfileCard';
import { getAllMCCAreas } from '@/lib/locations';

const AREAS = getAllMCCAreas({ activeOnly: true });

export default function StaffServiceListing({ serviceSlug }: { serviceSlug: StaffServiceKey }) {
  const serviceUi = STAFF_SERVICE_UI[serviceSlug];
  const accent = STAFF_ACCENT_CLASSES[serviceUi.accent] || STAFF_ACCENT_CLASSES.emerald;

  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const data = await fetchPublicStaffProfiles(serviceSlug);
      if (active) setProfiles(data);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [serviceSlug]);

  const filtered = useMemo(() => {
    let result = profiles;
    if (typeof filters.areaId === 'string' && filters.areaId) {
      result = result.filter((p) => p.areaIds.includes(filters.areaId as string));
    }
    const workKey = serviceSlug === 'kajer-bua' ? 'workType' : 'serviceType';
    if (typeof filters[workKey] === 'string' && filters[workKey] && filters[workKey] !== 'all') {
      const wt = filters[workKey] as string;
      result = result.filter((p) => p.workTypes.includes(wt));
    }
    if (typeof filters.workMode === 'string' && filters.workMode && filters.workMode !== 'all') {
      result = result.filter((p) => p.workMode === filters.workMode && !!p.workMode);
    }
    if (
      typeof filters.experienceYears === 'string' &&
      filters.experienceYears &&
      filters.experienceYears !== 'all'
    ) {
      const opt = STAFF_EXPERIENCE_OPTIONS.find((o) => o.id === filters.experienceYears);
      if (opt && opt.min != null) {
        result = result.filter(
          (p) => p.experienceYears >= opt.min! && p.experienceYears <= (opt.max ?? 100)
        );
      }
    }
    if (
      typeof filters.availability === 'string' &&
      filters.availability &&
      filters.availability !== 'all'
    ) {
      result = result.filter((p) => p.availability === filters.availability);
    }
    if (
      typeof filters.salaryPreset === 'string' &&
      filters.salaryPreset &&
      filters.salaryPreset !== 'all'
    ) {
      const pre = KAJER_BUA_SALARY_PRESETS.find((o) => o.id === filters.salaryPreset);
      if (pre) {
        const min = pre.min ?? 0;
        const max = pre.max ?? Infinity;
        result = result.filter(
          (p) => (p.salaryMin ?? 0) >= min && (p.salaryMax ?? Infinity) <= max
        );
      }
    }
    if (filters.isEmergency === true) {
      result = result.filter((p) => p.isEmergency);
    }
    return result;
  }, [profiles, filters, serviceSlug]);

  const hasActiveFilters = useMemo(
    () =>
      Object.entries(filters).some(([k, v]) => {
        if (k === 'isEmergency') return v === true;
        if (v === undefined || v === '' || v === 'all') return false;
        return true;
      }),
    [filters]
  );

  const handleReset = () => setFilters({});

  const areaName =
    typeof filters.areaId === 'string' && filters.areaId
      ? AREAS.find((a) => a.id === filters.areaId)?.nameBn
      : undefined;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${accent.gradient} text-white overflow-hidden`}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold mb-3">
                {serviceUi.categoryBadge}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{serviceUi.heroTitle}</h1>
              <p className="mt-2 text-sm sm:text-base max-w-2xl opacity-95 leading-relaxed">
                {serviceUi.heroSubtitle}
              </p>
            </div>
          </div>

          <ServiceFilterBar
            serviceType={serviceSlug}
            filterValues={filters}
            onFilterChange={setFilters}
            onResetFilters={handleReset}
            totalResults={filtered.length}
          />
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{filtered.length}</span> প্রোফাইল পাওয়া গেছে
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-sm font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              ফিল্টার বাতিল
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
                <div className="h-48 bg-slate-200 rounded-xl mb-4" />
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyFilterResults onResetFilters={handleReset} areaName={areaName} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((profile) => (
              <StaffProfileCard key={profile.id} profile={profile} serviceUi={serviceUi} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}