'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export interface AuthFieldProps {
  label: string;
  /** Rendered after the label, e.g. "(ঐচ্ছিক)". */
  labelSuffix?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  autoComplete?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  maxLength?: number;
  required?: boolean;
  error?: string;
  /** Friendly hint under the field. */
  hint?: string;
  /** Adds the show/hide toggle and switches type accordingly. */
  isPassword?: boolean;
  children?: React.ReactNode;
}

/**
 * AuthField — one field definition for both auth pages.
 *
 * The icon, the text and the trailing button all sit inside a 44px control
 * using one padding scale (`pl-11 pr-11`), so labels, inputs and icons share a
 * single left edge on every field of every form. This is what stops the
 * "heading here, box there" drift that the previous layout had.
 */
export default function AuthField({
  label,
  labelSuffix,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  inputMode,
  maxLength,
  required,
  error,
  hint,
  isPassword = false,
  children,
}: AuthFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-bold text-ink-700"
      >
        {label}
        {required && <span className="text-rose-500">*</span>}
        {labelSuffix && <span className="text-[11.5px] font-medium text-ink-400">{labelSuffix}</span>}
      </label>

      <div className="relative">
        {icon && (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}

        <input
          id={id}
          type={isPassword ? (revealed ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`w-full rounded-lg border bg-white py-3 pl-11 text-[15px] text-ink-900 transition-colors placeholder:text-ink-300 focus:outline-none ${
            isPassword ? 'pr-11' : 'pr-3.5'
          } ${
            error
              ? 'border-rose-300 bg-rose-50/50'
              : 'border-brand-200 hover:border-brand-300 focus:border-brand-500'
          } ${LIGHT_FOCUS}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((prev) => !prev)}
            aria-label={revealed ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখান'}
            className={`absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-mist-50 hover:text-ink-600 ${LIGHT_FOCUS}`}
          >
            {revealed ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Reserve the hint/error line so adding one does not shift the layout. */}
      <div className="mt-1.5 min-h-[18px]">
        {error ? (
          <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[12px] font-semibold text-rose-700">
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-[11.5px] leading-relaxed text-ink-400">
            {hint}
          </p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

/** Primary submit button with a loading label. Shared so both pages match. */
export function AuthSubmit({
  loading,
  loadingLabel,
  label,
  icon,
}: {
  loading: boolean;
  loadingLabel: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={`flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-[15px] font-extrabold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-65 ${LIGHT_FOCUS}`}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
            aria-hidden="true"
          />
          {loadingLabel}
        </>
      ) : (
        <>
          {label}
          {icon}
        </>
      )}
    </button>
  );
}

/**
 * A deliberately quiet password strength hint: three segments plus one short
 * sentence. It appears only after typing, so an untouched form shows nothing
 * and nobody is told they are failing before they have started.
 */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;

  const score = Math.min(
    3,
    (value.length >= 6 ? 1 : 0) +
      (value.length >= 10 ? 1 : 0) +
      (/[0-9]|[^\p{L}\s]/u.test(value) ? 1 : 0)
  );
  const tone = ['bg-brand-200', 'bg-brand-300', 'bg-brand-500', 'bg-brand-600'][score];
  const text = [
    'আরও কিছু অক্ষর যোগ করুন',
    'ভালো হচ্ছে',
    'আরও শক্তিশালী করতে পারেন',
    'শক্তিশালী পাসওয়ার্ড',
  ][score];

  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1 w-6 rounded-full transition-colors ${i < score + 1 ? tone : 'bg-brand-100'}`}
          />
        ))}
      </span>
      <span className="text-[11px] text-ink-400">{text}</span>
    </div>
  );
}
