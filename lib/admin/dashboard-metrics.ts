/**
 * Pure helpers behind the analytics dashboard: date-range resolution and
 * period-over-period comparisons.
 *
 * Server-safe: no React, no browser globals. Days are treated as Asia/Dhaka
 * calendar days because that is the boundary the platform's users and the
 * analytics RPC already use. A dashboard that calls something "today" while the
 * database still calls it yesterday is a dashboard nobody trusts.
 *
 * Everything here is a pure function so the arithmetic can be reasoned about
 * (and tested) without a database. Nothing in this file invents a number: when a
 * comparison cannot be computed the caller is told so explicitly.
 */

export type DashboardRangeKey = 'today' | '7d' | '30d' | '90d';

export interface DashboardRangeOption {
  key: DashboardRangeKey;
  label: string;
  days: number;
}

export const DASHBOARD_RANGES: DashboardRangeOption[] = [
  { key: 'today', label: 'আজ', days: 1 },
  { key: '7d', label: '৭ দিন', days: 7 },
  { key: '30d', label: '৩০ দিন', days: 30 },
  { key: '90d', label: '৯০ দিন', days: 90 },
];

export const DEFAULT_DASHBOARD_RANGE: DashboardRangeKey = '30d';

/** Max span the analytics RPC accepts (it rejects anything larger). */
const MAX_RANGE_DAYS = 366;

const DHAKA_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The current calendar day in Mymensingh, as `YYYY-MM-DD`. */
export function dhakaDateString(date: Date = new Date()): string {
  return DHAKA_DATE.format(date);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Add (or subtract) whole days to a `YYYY-MM-DD` string, in UTC. */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Inclusive day count between two `YYYY-MM-DD` dates. */
export function daysInclusive(from: string, to: string): number {
  const diff = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  return Math.round(diff) + 1;
}

export interface ResolvedDashboardRange {
  /** The preset key, or `'custom'` when explicit `from`/`to` were supplied. */
  key: DashboardRangeKey | 'custom';
  from: string;
  to: string;
  /** The immediately preceding window of the same length. */
  previousFrom: string;
  previousTo: string;
  days: number;
  label: string;
  isCustom: boolean;
}

/**
 * Turn raw `searchParams` into the two windows the dashboard needs.
 *
 * A valid explicit `from`/`to` pair always wins over `?range=` so the custom
 * date picker can coexist with the preset tabs. Anything invalid, reversed or
 * longer than the RPC allows falls back to the default preset instead of
 * rendering an error page.
 */
export function resolveDashboardRange(input: {
  range?: string;
  from?: string;
  to?: string;
  now?: Date;
}): ResolvedDashboardRange {
  const today = dhakaDateString(input.now ?? new Date());

  if (isValidDate(input.from) && isValidDate(input.to) && input.from <= input.to) {
    const days = daysInclusive(input.from, input.to);
    if (days <= MAX_RANGE_DAYS) {
      const previousTo = addDays(input.from, -1);
      return {
        key: 'custom',
        from: input.from,
        to: input.to,
        previousFrom: addDays(previousTo, -(days - 1)),
        previousTo,
        days,
        label: `${input.from} → ${input.to}`,
        isCustom: true,
      };
    }
  }

  const preset =
    DASHBOARD_RANGES.find((option) => option.key === input.range) ??
    DASHBOARD_RANGES.find((option) => option.key === DEFAULT_DASHBOARD_RANGE)!;
  const { days } = preset;
  const from = addDays(today, -(days - 1));
  const previousTo = addDays(from, -1);
  return {
    key: preset.key,
    from,
    to: today,
    previousFrom: addDays(previousTo, -(days - 1)),
    previousTo,
    days,
    label: preset.label,
    isCustom: false,
  };
}

export interface MetricTrend {
  /** Percentage change, or `null` when a percentage is undefined (0 → n). */
  pct: number | null;
  tone: 'good' | 'bad' | 'neutral';
  direction: 'up' | 'down' | 'flat';
  /** Pre-formatted Bengali label for the badge, e.g. `১২.৫%` or `নতুন`. */
  label: string;
}

/**
 * Compare a metric across two equal-length windows.
 *
 * The result is deliberately explicit about the two cases that are easy to get
 * wrong: 0 → 0 (no change) and 0 → n (a percentage change from zero is
 * infinite, so it is reported as `নতুন` rather than a made-up figure).
 */
export function metricTrend(
  current: number,
  previous: number,
  options: { higherIsBetter?: boolean } = {}
): MetricTrend {
  const higherIsBetter = options.higherIsBetter ?? true;

  if (previous === 0 && current === 0) {
    return { pct: 0, tone: 'neutral', direction: 'flat', label: '০%' };
  }
  if (previous === 0) {
    return {
      pct: null,
      tone: higherIsBetter ? 'good' : 'bad',
      direction: 'up',
      label: 'নতুন',
    };
  }

  const pct = ((current - previous) / previous) * 100;
  const direction: MetricTrend['direction'] =
    pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat';
  const tone: MetricTrend['tone'] =
    direction === 'flat' ? 'neutral' : (direction === 'up') === higherIsBetter ? 'good' : 'bad';
  return { pct, tone, direction, label: `${formatBnNumber(Math.abs(pct), 1)}%` };
}

/** Bengali numerals with grouping — `১২,৩৪৫`. */
export function formatBnNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '০';
  return value.toLocaleString('bn-BD', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

/** Sum the `count` field of a ranked-row list. */
export function sumRows(rows: { count: number }[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

/** `numerator / denominator` as a percentage, or `null` when the ratio is undefined. */
export function percentOf(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}
