'use client';

import React from 'react';
import { ArrowDownUp, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { MCCArea, getAreaById } from '@/lib/locations';
import LocationSelectInput from './LocationSelectInput';

interface HomeMovingLocationPairProps {
  pickupAreaId: string | null;
  destinationAreaId: string | null;
  onPickupChange: (areaId: string | null, area?: MCCArea | null) => void;
  onDestinationChange: (areaId: string | null, area?: MCCArea | null) => void;
  onSwap?: () => void;
  className?: string;
  error?: string;
}

export default function HomeMovingLocationPair({
  pickupAreaId,
  destinationAreaId,
  onPickupChange,
  onDestinationChange,
  onSwap,
  className = '',
  error,
}: HomeMovingLocationPairProps) {
  const pickupArea = getAreaById(pickupAreaId);
  const destinationArea = getAreaById(destinationAreaId);

  const handleSwap = () => {
    if (onSwap) {
      onSwap();
    } else {
      const prevPickup = pickupAreaId;
      onPickupChange(destinationAreaId, destinationArea);
      onDestinationChange(prevPickup, pickupArea);
    }
  };

  const isBothSelected = Boolean(pickupAreaId && destinationAreaId);
  const isSameLocation = pickupAreaId && destinationAreaId && pickupAreaId === destinationAreaId;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            ময়মনসিংহ সিটির ভেতরে শিফটিং রুট
          </span>
        </div>
        <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold">
          ১০০% সিটি কর্পোরেশন এরিয়া
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-center">
        {/* Pickup Field */}
        <div>
          <span className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>কোথা থেকে (বর্তমান বাসা / পিকআপ এলাকা)</span>
          </span>
          <LocationSelectInput
            value={pickupAreaId}
            onChange={onPickupChange}
            placeholder="পিকআপ এলাকা বেছে নিন..."
            allowClear={true}
            size="md"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 sm:my-0 sm:pt-5">
          <button
            type="button"
            onClick={handleSwap}
            disabled={!pickupAreaId && !destinationAreaId}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 border border-slate-200 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="পিকআপ ও গন্তব্য এলাকা অদল-বদল করুন"
            aria-label="এলাকা অদল-বদল করুন"
          >
            <ArrowDownUp className="w-4 h-4" />
          </button>
        </div>

        {/* Destination Field */}
        <div>
          <span className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>কোথায় যাবেন (নতুন বাসা / গন্তব্য এলাকা)</span>
          </span>
          <LocationSelectInput
            value={destinationAreaId}
            onChange={onDestinationChange}
            placeholder="গন্তব্য এলাকা বেছে নিন..."
            allowClear={true}
            size="md"
          />
        </div>
      </div>

      {/* Route Status feedback */}
      {isBothSelected && !isSameLocation && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-800 font-medium bg-emerald-50/50 p-2.5 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            নির্বাচিত রুট: <strong>{pickupArea?.nameBn}</strong> ({pickupArea?.wardLabelBn}) →{' '}
            <strong>{destinationArea?.nameBn}</strong> ({destinationArea?.wardLabelBn})
          </span>
        </div>
      )}

      {isSameLocation && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-800 font-medium bg-amber-50 p-2.5 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>পিকআপ ও গন্তব্য একই এলাকা নির্বাচিত হয়েছে (একই এলাকার ভেতর শিফটিং)।</span>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
