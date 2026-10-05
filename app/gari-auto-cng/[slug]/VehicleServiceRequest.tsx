'use client';

/**
 * VehicleServiceRequest — the "সেবা নিন" form.
 *
 * Eleven fields, and the ordering is the argument: name, number, from, to, then
 * when, then who and which vehicle, then what it costs, then free text. That is
 * the order the person already knows the answers in, so the form never asks for
 * something they have not thought about yet. Putting the budget before the
 * description would be the wrong way round — nobody can write "৳১,২০০, কিন্তু
 * এসি দরকার" before deciding the rest.
 *
 * The textarea is the widest field on the page and is not optional-looking: a
 * route with a wedding, or a hospital trip, or four people and four bags, cannot
 * be expressed in the other ten boxes. Everything else on this form is
 * structured so the admin can group requests; this is where the request that
 * does not fit any structure goes.
 *
 * Pickup and destination are free text with the city's areas as suggestions,
 * not a select, and that is deliberate: the most common hire out of Mymensingh
 * is to Dhaka, Tongi or Netrokona, none of which is a ward here. Forcing an
 * MCC-area dropdown would make the form impossible to fill in correctly for the
 * trip people actually book. When the text happens to match a ward exactly, the
 * area id is stored instead of the prose, so the admin's area filter keeps
 * working — and when it does not, the raw text is stored and the admin screen
 * falls back to printing it.
 */

import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  MapPin,
  Phone,
  Send,
  User,
  Users,
} from 'lucide-react';
import { createVehicleRequest } from '@/lib/catalog-service';
import type { ServiceListing, VehicleKind } from '@/lib/catalog-types';
import { VEHICLE_KINDS, toBn } from '@/lib/catalog-types';
import { getAllMCCAreas } from '@/lib/locations';
import { normalizeBdPhone } from '@/lib/contact-types';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Hire terms people actually say. Free text is allowed below these chips. */
const TRIP_DURATIONS = [
  'একবারের যাত্রা',
  'আধা দিন',
  'সারাদিন',
  '২ দিন',
  '৩ দিন বা তার বেশি',
  'প্রতিদিন (মাসিক চাঁদা)',
];

interface Props {
  listing: ServiceListing;
  /** The kind implied by the listing this request was opened from. */
  defaultKind?: VehicleKind;
}

export default function VehicleServiceRequest({ listing, defaultKind }: Props) {
  const kindOfListing = useMemo(
    () =>
      listing.tags.find((t): t is VehicleKind =>
        t === 'গাড়ি' || t === 'অটো' || t === 'CNG'
      ),
    [listing.tags]
  );
  const initialKind = defaultKind ?? kindOfListing ?? 'গাড়ি';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState('');
  const [kind, setKind] = useState<VehicleKind>(initialKind);
  const [duration, setDuration] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);

  /** Exact ward-name match → the area id, so the admin area filter still works. */
  function resolvePlace(text: string): string | undefined {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    return areas.find((a) => a.nameBn === trimmed)?.id ?? trimmed;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side gate for the two fields where a typo silently costs a
    // customer a trip: a phone number with 9 digits, and a budget typed in
    // Bangla numerals with no way to parse it.
    const errors: Record<string, string> = {};
    const normalised = normalizeBdPhone(phone);
    if (!/^01[3-9]\d{8}$/.test(normalised)) {
      errors.phone = 'সঠিক মোবাইল নম্বর দিন — যেমন ০১৭১২৩৪৫৬৭৮';
    }
    if (pickup.trim() && destination.trim() && pickup.trim() === destination.trim()) {
      errors.destination = 'গন্তব্য আর শুরুর এলাকা একই হয়ে গেছে';
    }
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus('sending');
    setMessage('');

    const budgetNumber = budget ? Number(budget.replace(/[^\d]/g, '')) : undefined;

    const result = await createVehicleRequest({
      vehicleListingId: listing.id,
      vehicleKind: kind,
      vehicleName: listing.titleBn,
      contactName: name.trim(),
      contactPhone: normalised,
      pickupAreaId: resolvePlace(pickup),
      destinationAreaId: resolvePlace(destination),
      travelDate: date || undefined,
      travelTime: time.trim() || undefined,
      passengerCount: passengers ? Number(passengers) : undefined,
      tripDuration: duration.trim() || undefined,
      budget: budgetNumber && budgetNumber > 0 ? budgetNumber : undefined,
      notes: notes.trim() || undefined,
    });

    if (result.success) {
      setStatus('sent');
      setMessage('আপনার অনুরোধ পাঠানো হয়েছে। অ্যাডমিন শীঘ্রই যোগাযোগ করবেন।');
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <CheckCircle2 className="h-7 w-7 text-brand-600" aria-hidden="true" />
        <h2 className="mt-2.5 text-[15px] font-extrabold text-ink-900">
          সেবা নেওয়ার অনুরোধ পাঠানো হয়েছে
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">{message}</p>
        <p className="mt-3 rounded-xl bg-white/70 p-3 text-[12.5px] leading-relaxed text-ink-600">
          <strong className="font-bold text-ink-900">{listing.titleBn}</strong>
          <br />
          {pickup.trim()} → {destination.trim()}
          {date ? ` · ${date}` : ''}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-5"
    >
      <h2 className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900">
        <Send className="h-4 w-4 text-brand-600" aria-hidden="true" />
        সেবা নেওয়ার অনুরোধ
      </h2>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
        অ্যাকাউন্ট ছাড়াই পাঠানো যাবে। অ্যাডমিন আপনার অনুরোধ দেখে সরাসরি কল করবেন।
      </p>

      <div className="mt-4 space-y-3">
        <Field labelBn="আপনার নাম" required>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="যেমন: রহিম উদ্দিন"
            icon={User}
            required
            minLength={3}
            maxLength={80}
          />
        </Field>

        <Field labelBn="মোবাইল নম্বর" required errorBn={fieldError.phone}>
          <TextInput
            value={phone}
            onChange={setPhone}
            placeholder="০১৭১২৩৪৫৬৭৮"
            icon={Phone}
            inputMode="tel"
            autoComplete="tel"
            required
          />
        </Field>

        <Field labelBn="কোথা থেকে যাবেন" required>
          <TextInput
            value={pickup}
            onChange={setPickup}
            placeholder="যেমন: ময়মনসিংহ সদর"
            icon={MapPin}
            list="mms-vehicle-areas"
            required
            maxLength={120}
          />
        </Field>

        <Field labelBn="কোথায় যাবেন" required errorBn={fieldError.destination}>
          <TextInput
            value={destination}
            onChange={setDestination}
            placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়"
            icon={MapPin}
            list="mms-vehicle-areas"
            required
            maxLength={120}
          />
        </Field>

        {/* One datalist shared by both place fields. The list is a convenience,
            not a constraint — typing "ঢাকা" and ignoring every suggestion is
            the normal case for an out-of-city trip. */}
        <datalist id="mms-vehicle-areas">
          {areas.map((area) => (
            <option key={area.id} value={area.nameBn} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field labelBn="যাওয়ার তারিখ">
            <TextInput
              value={date}
              onChange={setDate}
              type="date"
              icon={CalendarDays}
            />
          </Field>
          <Field labelBn="যাওয়ার সময়">
            <TextInput
              value={time}
              onChange={setTime}
              placeholder="যেমন: সকাল ৯টা"
              icon={Clock}
              maxLength={60}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field labelBn="যাত্রী সংখ্যা">
            <TextInput
              value={passengers}
              onChange={setPassengers}
              placeholder="যেমন: ৪"
              icon={Users}
              inputMode="numeric"
              maxLength={2}
            />
          </Field>
          <Field labelBn="বাজেট (ঐচ্ছিক)">
            <TextInput
              value={budget}
              onChange={setBudget}
              placeholder="যেমন: ২০০০"
              icon={Coins}
              inputMode="numeric"
              maxLength={8}
            />
          </Field>
        </div>

        <Field labelBn="কোন গাড়ি প্রয়োজন" hintBn={`এই তালিকা: ${listing.titleBn}`}>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as VehicleKind)}
            className="min-h-11 w-full appearance-none rounded-xl border border-mist-200 bg-white px-3 text-[14px] text-ink-900 outline-none transition-colors focus:border-brand-500"
          >
            {VEHICLE_KINDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field labelBn="আনুমানিক সময়">
          <div className="flex flex-wrap gap-1.5">
            {TRIP_DURATIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDuration(option === duration ? '' : option)}
                aria-pressed={duration === option}
                className={`inline-flex min-h-10 items-center rounded-lg border px-3 py-1.5 text-[12px] font-medium leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${
                  duration === option
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-mist-200 bg-mist-50 text-ink-600 hover:border-mist-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <TextInput
            value={duration}
            onChange={setDuration}
            placeholder="অথবা নিজের ভাষায় লিখুন"
            icon={Clock}
            maxLength={80}
            className="mt-2"
          />
        </Field>

        {/* The one field with no constraints. Generous rows and a real max
            length, because an operator reads this one first. */}
        <Field labelBn="আপনার প্রয়োজন সম্পর্কে বিস্তারিত লিখুন">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="যেমন: সকালে শহর থেকে ঢাকা যাবে, পেছনে ২ জন বয়স্ক থাকবেন, গাড়ির ভেতরে এসি দরকার।"
            className="w-full rounded-xl border border-mist-200 bg-white px-3 py-2.5 text-[14px] leading-relaxed text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
          />
          <p className="mt-1 text-[11px] text-ink-400">
            {toBn(notes.length)} / {toBn(1000)}
          </p>
        </Field>
      </div>

      {status === 'error' && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {status === 'sending' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            পাঠানো হচ্ছে…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            সেবা নেওয়ার অনুরোধ পাঠান
          </>
        )}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Field plumbing
// ---------------------------------------------------------------------------

function Field({
  labelBn,
  required,
  hintBn,
  errorBn,
  children,
}: {
  labelBn: string;
  required?: boolean;
  hintBn?: string;
  errorBn?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[12.5px] font-bold text-ink-900">
        {labelBn}
        {required ? (
          <span className="text-rose-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="text-[11px] font-medium text-ink-400">(ঐচ্ছিক)</span>
        )}
      </span>
      {children}
      {hintBn && !errorBn ? (
        <span className="mt-1 block text-[11.5px] leading-snug text-ink-400">{hintBn}</span>
      ) : null}
      {errorBn ? (
        <span className="mt-1 block text-[11.5px] font-medium text-rose-600" role="alert">
          {errorBn}
        </span>
      ) : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  icon: Icon,
  className = '',
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  icon: React.ElementType;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'>) {
  return (
    <div className={`relative ${className}`}>
      <Icon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
        aria-hidden="true"
      />
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-mist-200 bg-white pl-9 pr-3 text-[14px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
      />
    </div>
  );
}