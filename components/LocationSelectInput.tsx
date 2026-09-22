'use client';

import React, { useState } from 'react';
import { MapPin, X, ChevronDown } from 'lucide-react';
import { MCCArea, getAreaById } from '@/lib/locations';
import LocationPickerModal from './LocationPickerModal';

interface LocationSelectInputProps {
  value?: string | null; // areaId
  onChange: (areaId: string | null, area?: MCCArea | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  allowClear?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWardBadge?: boolean;
}

export default function LocationSelectInput({
  value,
  onChange,
  placeholder = 'আপনার এলাকা বেছে নিন',
  label,
  error,
  allowClear = true,
  className = '',
  size = 'md',
  showWardBadge = true,
}: LocationSelectInputProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedArea = getAreaById(value);

  const handleSelectArea = (area: MCCArea | null) => {
    if (area) {
      onChange(area.id, area);
    } else {
      onChange(null, null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  // Size specific styling
  const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-2.5 px-3.5 text-sm',
    lg: 'py-3.5 px-4 text-base',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        className={`w-full bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-700 ${
          sizeClasses[size]
        } ${
          error
            ? 'border-rose-400 bg-rose-50/20'
            : selectedArea
            ? 'border-emerald-700/60 bg-emerald-50/20 hover:border-emerald-700'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MapPin
            className={`shrink-0 ${
              selectedArea ? 'text-emerald-700' : 'text-slate-400'
            } ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
          />

          {selectedArea ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-slate-900 truncate">
                {selectedArea.nameBn}
              </span>
              {showWardBadge && (
                <span className="shrink-0 text-[11px] bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded-md font-medium">
                  {selectedArea.wardLabelBn}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedArea ? (
            <>
              {allowClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="এলাকা মুছুন"
                  title="এলাকা মুছুন"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors">
                পরিবর্তন
              </span>
            </>
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {/* Location Modal */}
      <LocationPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedAreaId={value}
        onSelectArea={handleSelectArea}
        title={label || 'আপনার এলাকা বেছে নিন'}
        allowClear={allowClear}
      />
    </div>
  );
}
