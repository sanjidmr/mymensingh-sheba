'use client';

import { useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadMedia } from '@/app/admin/actions/media';
import { cn } from '@/lib/utils';

/**
 * Admin image upload controls.
 *
 * Every image the admin panel needs is a storage object, not a hand-typed
 * address. These fields upload through the same `uploadMedia` action the media
 * library and the hero manager already use, so there is one writer, one bucket
 * (`site`) and one size/type rule. The resulting public URL is handed back
 * through `onChange` exactly where the old text input used to be.
 */

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

async function uploadImageFile(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('folder', folder);
  const result = (await uploadMedia(formData)) as UploadResult;
  if (!result.ok) throw new Error(result.error ?? 'ছবি আপলোড ব্যর্থ হয়েছে।');
  if (!result.url) throw new Error('আপলোড সম্পন্ন হয়েছে, তবে ছবির URL পাওয়া যায়নি।');
  return result.url;
}

interface BaseProps {
  label?: string;
  folder: string;
  helperText?: string;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  className?: string;
}

export interface ImageUploadProps extends BaseProps {
  value: string;
  onChange: (url: string) => void;
}

/** Single image picker: preview, upload/replace and remove. */
export function ImageUpload({
  label,
  value,
  onChange,
  folder,
  helperText,
  disabled,
  onBusyChange,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    onBusyChange?.(true);
    try {
      const url = await uploadImageFile(file, folder);
      onChange(url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  const locked = disabled || busy;

  return (
    <div className={cn('w-full space-y-1.5 text-left', className)}>
      {label && (
        <span className="block text-xs font-semibold text-slate-800 sm:text-sm">{label}</span>
      )}
      <div className="flex items-start gap-3">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-400" aria-hidden="true" />
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            disabled={locked}
            onChange={pick}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={locked}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {busy ? 'আপলোড হচ্ছে…' : value ? 'ছবি বদলান' : 'ছবি আপলোড করুন'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  onChange('');
                }}
                disabled={locked}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> সরান
              </button>
            )}
          </div>
          {helperText && <p className="text-xs leading-relaxed text-slate-500">{helperText}</p>}
          {error && (
            <p className="flex items-center gap-1 text-xs font-medium text-rose-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export interface ImageGalleryUploadProps extends BaseProps {
  values: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

/** Multi-image picker: thumbnail strip with per-image removal. */
export function ImageGalleryUpload({
  label,
  values,
  onChange,
  folder,
  helperText,
  max = 10,
  disabled,
  onBusyChange,
  className,
}: ImageGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    const room = max - values.length;
    if (room <= 0) {
      setError(`সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে।`);
      return;
    }

    setBusy(true);
    setError('');
    onBusyChange?.(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, room)) {
        uploaded.push(await uploadImageFile(file, folder));
      }
      onChange([...values, ...uploaded]);
      if (files.length > room) {
        setError(`সর্বোচ্চ ${max}টি ছবি যোগ করা যাবে, তাই প্রথম ${room}টি যোগ হয়েছে।`);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  const locked = disabled || busy || values.length >= max;

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <span className="block text-xs font-semibold text-slate-800 sm:text-sm">{label}</span>
      )}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="ছবি সরান"
                onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
                disabled={disabled || busy}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        disabled={locked}
        onChange={pick}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={locked}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" />
        )}
        {busy ? 'আপলোড হচ্ছে…' : 'ছবি যোগ করুন'}
      </button>
      {helperText && <p className="text-xs leading-relaxed text-slate-500">{helperText}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
