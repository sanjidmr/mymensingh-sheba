export const MYMENSINGH_COORDS = { latitude: 24.7539, longitude: 90.4073 };
export const TIMEZONE = 'Asia/Dhaka';
export const PRAYER_METHOD = 1;
export const PRAYER_METHOD_NAME = 'University of Karachi (Hanafi)';
export const LIVE_REFRESH_MINUTES = 30;

const OPEN_METEO_URL = `https://api.open-meteo.com/v1/forecast?latitude=${MYMENSINGH_COORDS.latitude}&longitude=${MYMENSINGH_COORDS.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(TIMEZONE)}&forecast_days=1`;

const ALADHAN_BASE = 'https://api.aladhan.com/v1/timings';
const DHAKA_OFFSET_MS = 6 * 3600 * 1000;

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBn(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export interface DhakaDateParts {
  y: number;
  m: number;
  day: number;
}

export function dhakaTodayParts(now: number = Date.now()): DhakaDateParts {
  const d = new Date(now + DHAKA_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
}

export function todayDdMmYyyy(now: number = Date.now()): string {
  const { y, m, day } = dhakaTodayParts(now);
  const mm = String(m + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${dd}-${mm}-${y}`;
}

export function dhakaEpoch(y: number, m0: number, day: number, hour: number, minute: number): number {
  return Date.UTC(y, m0, day, hour, minute) - DHAKA_OFFSET_MS;
}

export function isSameDhakaDay(a: DhakaDateParts, b: DhakaDateParts): boolean {
  return a.y === b.y && a.m === b.m && a.day === b.day;
}

export async function fetchJsonWithTimeout(url: string, timeoutMs = 12000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

export interface MymensinghWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  code: number;
  isDay: boolean;
  high: number;
  low: number;
}

export async function fetchWeather(now: number = Date.now()): Promise<MymensinghWeather> {
  const data = (await fetchJsonWithTimeout(OPEN_METEO_URL)) as {
    current?: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      apparent_temperature?: number;
      weather_code?: number;
      is_day?: number;
    };
    daily?: {
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      weather_code?: number[];
    };
  };
  const c = data.current;
  const d = data.daily;
  if (!c || c.temperature_2m === undefined || c.weather_code === undefined) {
    throw new Error('Missing weather payload');
  }
  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    code: c.weather_code,
    isDay: c.is_day === 1,
    high: Math.round(d?.temperature_2m_max?.[0] ?? c.temperature_2m),
    low: Math.round(d?.temperature_2m_min?.[0] ?? c.temperature_2m),
  };
}

export interface PrayerMeta {
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nameBn: string;
  periodBn: string;
}

export const PRAYER_ORDER: PrayerMeta[] = [
  { key: 'fajr', nameBn: 'ফজর', periodBn: 'ভোর' },
  { key: 'dhuhr', nameBn: 'যোহর', periodBn: 'দুপুর' },
  { key: 'asr', nameBn: 'আসর', periodBn: 'বিকাল' },
  { key: 'maghrib', nameBn: 'মাগরিব', periodBn: 'সন্ধ্যা' },
  { key: 'isha', nameBn: 'এশা', periodBn: 'রাত' },
];

export interface PrayerTime {
  key: PrayerMeta['key'];
  nameBn: string;
  periodBn: string;
  epoch: number;
}

export async function fetchPrayers(now: number = Date.now()): Promise<{ prayers: PrayerTime[]; date: DhakaDateParts }> {
  const parts = dhakaTodayParts(now);
  const dateStr = todayDdMmYyyy(now);
  const url = `${ALADHAN_BASE}/${dateStr}?latitude=${MYMENSINGH_COORDS.latitude}&longitude=${MYMENSINGH_COORDS.longitude}&method=${PRAYER_METHOD}&timezonestring=${encodeURIComponent(TIMEZONE)}`;
  const data = (await fetchJsonWithTimeout(url)) as {
    data?: { timings?: Record<string, string> };
  };
  const timings = data.data?.timings;
  if (!timings) throw new Error('Missing prayer payload');
  const prayers = PRAYER_ORDER.map((meta) => {
    const raw = timings[meta.key === 'asr' ? 'Asr' : meta.key.charAt(0).toUpperCase() + meta.key.slice(1)];
    if (!raw) throw new Error(`Missing timing ${meta.key}`);
    const [h, min] = raw.split(':').map((n) => Number(n));
    return {
      key: meta.key,
      nameBn: meta.nameBn,
      periodBn: meta.periodBn,
      epoch: dhakaEpoch(parts.y, parts.m, parts.day, h, min),
    };
  });
  return { prayers, date: parts };
}

export function timeInDhaka(epoch: number): { hour12: number; minute: number } {
  const d = new Date(epoch + DHAKA_OFFSET_MS);
  let h = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute };
}

export function formatPrayerTime(epoch: number): string {
  const { hour12, minute } = timeInDhaka(epoch);
  const mm = String(minute).padStart(2, '0');
  return `${toBn(hour12)}:${toBn(mm)}`;
}

export function countdownText(targetEpoch: number, now: number = Date.now()): string {
  const diffMs = Math.max(0, targetEpoch - now);
  const totalMins = Math.round(diffMs / 60000);
  if (totalMins >= 60) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${toBn(h)}ঘ ${toBn(m)}মি` : `${toBn(h)}ঘ`;
  }
  return `${toBn(totalMins)}মিনিট`;
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'আকাশ পরিষ্কার';
  if (code === 1) return 'প্রায় পরিষ্কার আকাশ';
  if (code === 2) return 'আংশিক মেঘলা';
  if (code === 3) return 'মেঘাচ্ছন্ন';
  if (code === 45 || code === 48) return 'কুয়াশাচ্ছন্ন';
  if (code === 51 || code === 53 || code === 55) return 'গুঁড়ি গুঁড়ি বৃষ্টি';
  if (code === 56 || code === 57) return 'হিম-গুঁড়ি';
  if (code === 61) return 'হালকা বৃষ্টি';
  if (code === 63) return 'মাঝারি বৃষ্টি';
  if (code === 65) return 'ভারী বৃষ্টি';
  if (code === 66 || code === 67) return 'হিম-বৃষ্টি';
  if (code === 71) return 'হালকা তুষার';
  if (code === 73) return 'মাঝারি তুষার';
  if (code === 75) return 'ভারী তুষার';
  if (code === 77) return 'তুষার-কণা';
  if (code === 80 || code === 81 || code === 82) return 'বৃষ্টির ঝড়';
  if (code === 85 || code === 86) return 'তুষার ঝড়';
  if (code === 95) return 'বজ্রবৃষ্টি';
  if (code === 96 || code === 99) return 'তীব্র বজ্রঝড় (শিলাবৃষ্টি সহ)';
  return 'পরিবর্তনশীল আকাশ';
}

export function formatBanglaDate(parts: DhakaDateParts): string {
  const local = new Date(parts.y, parts.m, parts.day);
  return new Intl.DateTimeFormat('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' }).format(local);
}

export const LIVE_FRESHNESS_MS = LIVE_REFRESH_MINUTES * 60 * 1000;