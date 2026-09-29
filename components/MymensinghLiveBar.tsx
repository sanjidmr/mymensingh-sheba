'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Droplet,
  Gauge,
  MapPin,
  Moon,
  Phone,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import {
  PrayerTime,
  DhakaDateParts,
  PRAYER_ORDER,
  fetchPrayers,
  fetchWeather,
  weatherLabel,
  toBn,
  dhakaTodayParts,
  isSameDhakaDay,
  formatPrayerTime,
  countdownText,
  formatBanglaDate,
  LIVE_FRESHNESS_MS,
  PRAYER_METHOD_NAME,
} from '@/lib/mymensingh-live';
import { SITE_CONTACT, CONTACT_FORM_ANCHOR } from '@/lib/site-contact';

interface PrayerState {
  status: 'loading' | 'ok' | 'error';
  prayers: PrayerTime[] | null;
  date: DhakaDateParts | null;
}

interface WeatherValue {
  temp: number;
  feelsLike: number;
  humidity: number;
  high: number;
  low: number;
  isDay: boolean;
  label: string;
}

interface WeatherState {
  status: 'loading' | 'ok' | 'error';
  value: WeatherValue | null;
}

/**
 * Small modal shell for the mobile live-bar buttons (আবহাওয়া / নামাজের সময়).
 * Closes on backdrop click, Esc key or the X button.
 *
 * Rendered through a portal into <body> on purpose. The live bar's own root is
 * `relative z-40`, which establishes a stacking context — a `z-[70]` modal
 * nested inside it would still paint *below* the sticky navbar (`z-50`), so the
 * panel used to slide up underneath the header. Portalling puts the overlay in
 * the root stacking context where its z-index actually competes.
 */
function BarModal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // `open` can only ever become true from a tap in the browser, so the portal
  // target is guaranteed to exist by the time this renders — no mounted flag
  // (and no setState-in-effect) needed.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock the page behind the sheet so a scroll gesture never slides content
    // out from under the panel on touch devices.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={onClose}
        className="absolute inset-0 bg-brand-950/70 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-brand-100 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl sm:rounded-2xl sm:pb-0">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-100 p-4 sm:p-5">
          <h3 className="text-lg font-extrabold tracking-tight text-ink-900">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-mist-50 hover:text-ink-900"
            aria-label="মোডাল বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default function MymensinghLiveBar() {
  const [prayers, setPrayers] = useState<PrayerState>({
    status: 'loading',
    prayers: null,
    date: null,
  });
  const [weather, setWeather] = useState<WeatherState>({
    status: 'loading',
    value: null,
  });
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [showWeather, setShowWeather] = useState(false);
  const [showPrayers, setShowPrayers] = useState(false);

  const prayerStampRef = useRef(0);
  const prayerDateRef = useRef<DhakaDateParts | null>(null);
  const weatherStampRef = useRef(0);

  const closeWeather = useCallback(() => setShowWeather(false), []);
  const closePrayers = useCallback(() => setShowPrayers(false), []);

  const loadPrayers = useCallback(async () => {
    const stamp = Date.now();
    try {
      const { prayers: list, date } = await fetchPrayers(stamp);
      prayerStampRef.current = stamp;
      prayerDateRef.current = date;
      setPrayers({ status: 'ok', prayers: list, date });
    } catch {
      setPrayers((s) =>
        s.prayers ? s : { status: 'error', prayers: null, date: null }
      );
    }
  }, []);

  const loadWeather = useCallback(async () => {
    const stamp = Date.now();
    try {
      const w = await fetchWeather(stamp);
      weatherStampRef.current = stamp;
      setWeather({
        status: 'ok',
        value: {
          temp: w.temp,
          feelsLike: w.feelsLike,
          humidity: w.humidity,
          high: w.high,
          low: w.low,
          isDay: w.isDay,
          label: weatherLabel(w.code),
        },
      });
    } catch {
      setWeather((s) => (s.value ? s : { status: 'error', value: null }));
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      loadPrayers();
      loadWeather();
    }, 0);
    const interval = setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      const today = dhakaTodayParts(now);
      const dateChanged =
        prayerDateRef.current !== null && !isSameDhakaDay(today, prayerDateRef.current);
      if (
        prayerStampRef.current === 0 ||
        now - prayerStampRef.current >= LIVE_FRESHNESS_MS ||
        dateChanged
      ) {
        loadPrayers();
      }
      if (
        weatherStampRef.current === 0 ||
        now - weatherStampRef.current >= LIVE_FRESHNESS_MS
      ) {
        loadWeather();
      }
    }, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [loadPrayers, loadWeather]);

  const today = dhakaTodayParts(nowTick);

  let nextPrayer: PrayerTime | null = null;
  let nextEpoch = 0;
  let nextIsTomorrow = false;
  if (prayers.prayers) {
    for (const p of prayers.prayers) {
      if (p.epoch > nowTick) {
        nextPrayer = p;
        nextEpoch = p.epoch;
        break;
      }
    }
    if (!nextPrayer) {
      nextPrayer = prayers.prayers[0];
      nextEpoch = nextPrayer.epoch + 24 * 3600 * 1000;
      nextIsTomorrow = true;
    }
  }

  const divider = <span className="h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />;

  // Hotline badge. Reads from SITE_CONTACT so it can never point at a number
  // that isn't published. Until a real number exists this becomes a link to
  // the contact form instead of a dead tel: action.
  const hotline = SITE_CONTACT.phone ? (
    <a
      href={`tel:${SITE_CONTACT.phone}`}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-1 text-[11px] font-bold text-accent-300 transition-colors hover:bg-accent-400/20 hover:text-accent-200"
    >
      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
      হটলাইন: {SITE_CONTACT.phone}
    </a>
  ) : (
    <Link
      href={`/contact#${CONTACT_FORM_ANCHOR}`}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-1 text-[11px] font-bold text-accent-300 transition-colors hover:bg-accent-400/20 hover:text-accent-200"
    >
      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
      বার্তা পাঠান
    </Link>
  );

  return (
    <div className="relative z-40 border-b border-brand-900 bg-brand-950 text-brand-100/90">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="no-scrollbar flex h-11 items-center gap-3 overflow-x-auto lg:h-12 lg:justify-center lg:gap-4 lg:overflow-visible">
          {/* Live dot + location / date (desktop only) */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-accent-300">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              লাইভ · ময়মনসিংহ
            </span>
            <span className="hidden whitespace-nowrap text-[11px] text-brand-100/70 lg:inline">
              {formatBanglaDate(today)}
            </span>
            {divider}

            {/* Hotline */}
            {hotline}

            {/* Weather — current temperature only */}
            {weather.value && (
              <>
                {divider}
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap"
                  title={`আবহাওয়া: ${weather.value.label}`}
                >
                  {weather.value.isDay ? (
                    <Sun
                      className="h-3.5 w-3.5 text-accent-300"
                      aria-hidden="true"
                    />
                  ) : (
                    <Moon
                      className="h-3.5 w-3.5 text-brand-100/70"
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[11px] text-brand-100/70">আবহাওয়া</span>
                  <span className="text-[11px] font-bold text-white">
                    {toBn(weather.value.temp)}°
                  </span>
                </span>
              </>
            )}
          </div>

          {/* Prayers (desktop) */}
          <div
            className="hidden shrink-0 items-center gap-1 lg:flex"
            title={`নামাজের সময়: ${PRAYER_METHOD_NAME} পদ্ধতি অনুযায়ী`}
          >
            {PRAYER_ORDER.map((meta, i) => {
              const p = prayers.prayers?.[i];
              const isNext =
                nextPrayer !== null && p !== undefined && p.epoch === nextPrayer.epoch;
              return (
                <span
                  key={meta.key}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${
                    isNext ? 'bg-accent-400/15 ring-1 ring-accent-400/40' : ''
                  }`}
                >
                  <span className="whitespace-nowrap text-[11px] font-medium text-brand-100/80">
                    {meta.nameBn}
                  </span>
                  <span
                    className={`whitespace-nowrap text-[11px] font-bold ${
                      isNext ? 'text-accent-300' : 'text-white'
                    }`}
                  >
                    {p ? formatPrayerTime(p.epoch) : '–'}
                  </span>
                </span>
              );
            })}
            {nextPrayer && (
              <span className="ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent-400/40 bg-accent-400/10 px-2.5 py-1 text-[11px] font-semibold text-accent-300">
                পরবর্তী {nextPrayer.nameBn}
                {nextIsTomorrow ? ' (কাল)' : ''} · {countdownText(nextEpoch, nowTick)}
              </span>
            )}
          </div>

          {/* Mobile — compact bar: live text (no dot/icon) + weather & prayer modal buttons */}
          <div className="flex shrink-0 items-center gap-2 lg:hidden">
            <span className="whitespace-nowrap text-[10px] font-bold tracking-wide text-brand-100/85">
              লাইভ · ময়মনসিংহ
            </span>
            {divider}

            <button
              type="button"
              onClick={() => setShowWeather(true)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-brand-100/90 transition-colors hover:bg-white/10 hover:text-white"
              aria-haspopup="dialog"
            >
              {weather.value ? (
                weather.value.isDay ? (
                  <Sun className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-brand-100/80" aria-hidden="true" />
                )
              ) : null}
              আবহাওয়া
            </button>

            <button
              type="button"
              onClick={() => setShowPrayers(true)}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-brand-100/90 transition-colors hover:bg-white/10 hover:text-white"
              aria-haspopup="dialog"
            >
              নামাজের সময়
            </button>
            {divider}

            {hotline}
          </div>
        </div>
      </div>

      {/* Weather modal (mobile) */}
      <BarModal title="আবহাওয়া" open={showWeather} onClose={closeWeather}>
        {weather.value ? (
          <div>
            {/* Hero row — current temperature with the condition beside it */}
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                {weather.value.isDay ? (
                  <Sun className="h-8 w-8 text-accent-500" aria-hidden="true" />
                ) : (
                  <Moon className="h-8 w-8 text-brand-700" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black leading-none text-ink-900">
                    {toBn(weather.value.temp)}°
                  </span>
                  <span className="text-sm font-bold text-brand-700">
                    {weather.value.isDay ? 'দিন' : 'রাত'}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium leading-snug text-ink-600">
                  {weather.value.label}
                </p>
                <p className="mt-0.5 text-xs text-ink-400">ময়মনসিংহ · বর্তমান</p>
              </div>
            </div>

            {/* Supporting details — the numbers that actually change a plan */}
            <dl className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-brand-100 bg-mist-50 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500">
                  <Gauge className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  অনুভূতি
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-ink-900">
                  {toBn(weather.value.feelsLike)}°
                </dd>
              </div>
              <div className="rounded-xl border border-brand-100 bg-mist-50 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500">
                  <Thermometer className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  সর্বোচ্চ / নিম্ন
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-ink-900">
                  {toBn(weather.value.high)}° / {toBn(weather.value.low)}°
                </dd>
              </div>
              <div className="rounded-xl border border-brand-100 bg-mist-50 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500">
                  <Droplet className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  আর্দ্রতা
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-ink-900">
                  {toBn(weather.value.humidity)}%
                </dd>
              </div>
              <div className="rounded-xl border border-brand-100 bg-mist-50 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-bold text-ink-500">
                  <Wind className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  অবস্থা
                </dt>
                <dd className="mt-1 truncate text-lg font-extrabold text-ink-900">
                  {weather.value.isDay ? 'দিন' : 'রাত'}
                </dd>
              </div>
            </dl>
          </div>
        ) : weather.status === 'error' ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-500">আবহাওয়ার তথ্য পাওয়া যাচ্ছে না।</p>
            <button
              type="button"
              onClick={loadWeather}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-mist-50"
            >
              <RefreshCw className="h-4 w-4" />
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-5 w-24 animate-pulse rounded-sm bg-brand-100/70" />
            <span className="h-5 w-16 animate-pulse rounded-sm bg-brand-100/50" />
          </div>
        )}
      </BarModal>

      {/* Prayer modal (mobile) */}
      <BarModal title="নামাজের সময়" open={showPrayers} onClose={closePrayers}>
        {prayers.status === 'ok' && prayers.prayers ? (
          <div>
            <div className="mb-3 flex items-center justify-between rounded-xl bg-brand-50 px-3.5 py-2.5">
              <span className="text-xs font-semibold text-brand-800">
                {formatBanglaDate(prayers.date ?? today)}
              </span>
              <span className="text-[11px] font-medium text-brand-600">
                {PRAYER_METHOD_NAME} পদ্ধতি
              </span>
            </div>
            <ul className="divide-y divide-brand-100">
              {prayers.prayers.map((p) => {
                const isNext = nextPrayer !== null && p.epoch === nextPrayer.epoch;
                return (
                  <li
                    key={p.nameBn}
                    className={`flex items-center justify-between rounded-lg px-2 py-2.5 ${
                      isNext ? 'bg-accent-400/10' : ''
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${isNext ? 'font-bold text-brand-800' : 'text-ink-700'}`}
                    >
                      {p.nameBn}
                      {isNext ? ' · পরবর্তী' : ''}
                    </span>
                    <span
                      className={`text-sm font-bold ${isNext ? 'text-brand-800' : 'text-ink-900'}`}
                    >
                      {formatPrayerTime(p.epoch)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-400">
              সকল সময় ময়মনসিংহ সময় অনুযায়ী দেখানো হচ্ছে।
            </p>
          </div>
        ) : prayers.status === 'error' ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-500">নামাজের সময় পাওয়া যাচ্ছে না।</p>
            <button
              type="button"
              onClick={loadPrayers}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-mist-50"
            >
              <RefreshCw className="h-4 w-4" />
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-5 w-24 animate-pulse rounded-sm bg-brand-100/70" />
            <span className="h-5 w-16 animate-pulse rounded-sm bg-brand-100/50" />
          </div>
        )}
      </BarModal>
    </div>
  );
}