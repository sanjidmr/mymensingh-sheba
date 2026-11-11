'use client';

import React, { useEffect, useId, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getAreaById, MCC_AREA_SOURCE, type AreaSource, type MCCArea } from '@/lib/locations';
import { normalizeAreaName } from '@/lib/area-names';

interface LocationSelectInputProps {
  id?: string;
  value?: string | null;
  onChange: (areaName: string | null, area?: MCCArea | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  allowClear?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  source?: AreaSource;
}

let areaOptionsRequest: Promise<string[]> | null = null;

async function fetchAreaOptions(): Promise<string[]> {
  if (!areaOptionsRequest) {
    areaOptionsRequest = fetch('/api/area-options')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(typeof result.error === 'string' ? result.error : 'এলাকার তালিকা লোড করা যায়নি।');
        }
        if (!Array.isArray(result.areas) || !result.areas.every((area: unknown) => typeof area === 'string')) {
          throw new Error('এলাকার তালিকার উত্তর সঠিক নয়।');
        }
        return result.areas as string[];
      })
      .catch((error: unknown) => {
        areaOptionsRequest = null;
        throw error;
      });
  }
  return areaOptionsRequest;
}

export default function LocationSelectInput({
  id,
  value,
  onChange,
  placeholder = 'আপনার এলাকার নাম লিখুন',
  label,
  error,
  allowClear = true,
  className = '',
  size = 'md',
  source = MCC_AREA_SOURCE,
}: LocationSelectInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listId = `${inputId}-area-options`;
  const [areas, setAreas] = useState<string[]>([]);
  const [optionsError, setOptionsError] = useState('');
  const selectedArea = value ? source.byId(value) ?? getAreaById(value) : undefined;
  const displayValue = selectedArea?.nameBn ?? value ?? '';

  useEffect(() => {
    let active = true;
    fetchAreaOptions()
      .then((options) => {
        if (active) setAreas(options);
      })
      .catch((fetchError: unknown) => {
        if (active) {
          setOptionsError(
            fetchError instanceof Error ? fetchError.message : 'এলাকার তালিকা লোড করা যায়নি।'
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const sizeClasses = {
    sm: 'min-h-10 px-3 py-2 text-xs',
    md: 'min-h-11 px-3.5 py-2.5 text-sm',
    lg: 'min-h-12 px-4 py-3 text-base',
  };
  const inputClasses = `${sizeClasses[size]} w-full border bg-white pl-10 text-slate-900 outline-none transition-colors focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 ${
    error ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
  }`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-slate-800 sm:text-sm">
          {label}
        </label>
      )}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          value={displayValue}
          onChange={(event) => {
            const areaName = event.target.value;
            onChange(areaName || null, source.byId(areaName) ?? getAreaById(areaName) ?? null);
          }}
          onBlur={(event) => {
            const normalized = normalizeAreaName(event.target.value);
            if (normalized !== event.target.value) {
              onChange(normalized || null, source.byId(normalized) ?? getAreaById(normalized) ?? null);
            }
          }}
          placeholder={placeholder}
          list={listId}
          autoComplete="off"
          maxLength={100}
          className={inputClasses}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : optionsError ? `${inputId}-options-error` : undefined}
        />
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
            aria-label="এলাকা মুছুন"
          >
            মুছুন
          </button>
        )}
        <datalist id={listId}>
          {areas.map((area) => (
            <option key={area} value={area} label={source.byId(area)?.nameBn ?? getAreaById(area)?.nameBn ?? area} />
          ))}
        </datalist>
      </div>
      {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-rose-600">{error}</p>}
      {optionsError && (
        <p id={`${inputId}-options-error`} className="mt-1 text-xs text-amber-700">
          সংরক্ষিত এলাকার পরামর্শ লোড হয়নি; এলাকার নাম নিজে লিখতে পারবেন।
        </p>
      )}
    </div>
  );
}
