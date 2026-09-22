'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, X, Loader2, ImagePlus, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 6;
const MAX_SIZE_MB = 5;

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  onUpload: (file: File) => Promise<string>;
  maxPhotos?: number;
  label?: string;
}

export function PhotoUploader({
  photos,
  onChange,
  onUpload,
  maxPhotos = MAX_PHOTOS,
  label = 'বাসার ছবি',
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      setError(`সর্বোচ্চ ${maxPhotos}টি ছবি যুক্ত করা যাবে।`);
      return;
    }

    const valid: File[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        setError('শুধুমাত্র ছবি ফাইল যুক্ত করা যাবে।');
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`প্রতিটি ছবির সর্বোচ্চ সাইজ ${MAX_SIZE_MB}MB।`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of valid) {
      try {
        const url = await onUpload(file);
        uploaded.push(url);
      } catch {
        setError('একটি ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    }
    setUploading(false);
    if (uploaded.length > 0) {
      onChange([...photos, ...uploaded].slice(0, maxPhotos));
    }
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const setCover = (index: number) => {
    if (index === 0) return;
    const next = [...photos];
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    onChange(next);
  };

  const full = photos.length >= maxPhotos;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs sm:text-sm font-semibold text-slate-800">
          {label} <span className="text-slate-400 font-normal">(সর্বোচ্চ {maxPhotos}টি)</span>
        </label>
        <span className="text-xs text-slate-500">{photos.length}/{maxPhotos}</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {photos.map((photo, idx) => (
          <div
            key={`${photo}-${idx}`}
            className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 snap-start"
          >
            <Image
              src={photo}
              alt={`ছবি ${idx + 1}`}
              fill
              sizes="112px"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            {idx === 0 ? (
              <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] font-bold">
                <Crown className="w-2.5 h-2.5" /> কভার
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setCover(idx)}
                title="কভার করতে"
                className="absolute top-1 left-1 p-1 rounded-md bg-white/90 hover:bg-white text-emerald-800 shadow-xs"
              >
                <Crown className="w-2.5 h-2.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => removePhoto(idx)}
              title="ছবি সরান"
              className="absolute top-1 right-1 p-1 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow-xs"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-700 bg-slate-50 hover:bg-emerald-50 flex flex-col items-center justify-center gap-1 text-slate-500 disabled:opacity-60 snap-start"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-emerald-700" />
                <span className="text-[10px] font-semibold">{photos.length === 0 ? 'ছবি যুক্ত করুন' : 'আরও ছবি'}</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        aria-label={label}
      />

      <p className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
        <ImagePlus className="w-3.5 h-3.5 text-emerald-700" />
        প্রথম ছবিটি কভার ছবি হিসেবে দেখানো হবে। JPG / PNG, সর্বোচ্চ {MAX_SIZE_MB}MB প্রতি ছবি।
      </p>
    </div>
  );
}