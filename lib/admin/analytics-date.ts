const DHAKA_TIME_ZONE = 'Asia/Dhaka';

export function dhakaDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: DHAKA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  return `${values.get('year')}-${values.get('month')}-${values.get('day')}`;
}

export function shiftAnalyticsDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function isValidAnalyticsDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function resolveAnalyticsDateRange(
  params: { from?: string; to?: string; range?: string },
  now = new Date()
): { from: string; to: string; preset: 'today' | 'yesterday' | '7d' | '30d' | 'custom' } {
  if (
    isValidAnalyticsDate(params.from) &&
    isValidAnalyticsDate(params.to) &&
    params.from <= params.to
  ) {
    return { from: params.from, to: params.to, preset: 'custom' };
  }

  const to = dhakaDateString(now);
  if (params.range === 'today') return { from: to, to, preset: 'today' };
  if (params.range === 'yesterday') {
    const yesterday = shiftAnalyticsDate(to, -1);
    return { from: yesterday, to: yesterday, preset: 'yesterday' };
  }
  if (params.range === '7d') return { from: shiftAnalyticsDate(to, -6), to, preset: '7d' };
  return { from: shiftAnalyticsDate(to, -29), to, preset: '30d' };
}
