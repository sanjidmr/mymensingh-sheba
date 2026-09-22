/**
 * Shared label helpers for Admin-managed staff services.
 */
import {
  KAJER_BUA_WORK_TYPES,
  ELECTRICIAN_SERVICE_TYPES,
  PLUMBING_SERVICE_TYPES,
} from '@/lib/filter-definitions';
import type { StaffServiceKey } from '@/lib/staff-types';

function buildMap(list: Array<{ id: string; labelBn: string }>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const o of list) if (o.id !== 'all') m[o.id] = o.labelBn;
  return m;
}

export const STAFF_WORK_TYPE_LABELS: Record<StaffServiceKey, Record<string, string>> = {
  'kajer-bua': buildMap(KAJER_BUA_WORK_TYPES),
  electrician: buildMap(ELECTRICIAN_SERVICE_TYPES),
  plumber: buildMap(PLUMBING_SERVICE_TYPES),
};

export function staffWorkTypeLabels(slug: StaffServiceKey, ids: string[]): string[] {
  const map = STAFF_WORK_TYPE_LABELS[slug] || {};
  return ids.map((id) => map[id] || id);
}

/** Accent classes keep the three service pages visually distinct (all within the green/white theme). */
export const STAFF_ACCENT_CLASSES: Record<
  string,
  {
    gradient: string;
    softBg: string;
    chip: string;
    btn: string;
    btnHover: string;
    text: string;
    ring: string;
    boarder: string;
  }
> = {
  emerald: {
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-800',
    softBg: 'bg-emerald-50',
    chip: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    btn: 'bg-emerald-800',
    btnHover: 'hover:bg-emerald-900',
    text: 'text-emerald-800',
    ring: 'focus:ring-emerald-700',
    boarder: 'border-emerald-200',
  },
  amber: {
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
    softBg: 'bg-amber-50',
    chip: 'bg-amber-50 text-amber-900 border-amber-200',
    btn: 'bg-amber-700',
    btnHover: 'hover:bg-amber-800',
    text: 'text-amber-800',
    ring: 'focus:ring-amber-600',
    boarder: 'border-amber-200',
  },
  cyan: {
    gradient: 'from-cyan-500 via-cyan-600 to-cyan-700',
    softBg: 'bg-cyan-50',
    chip: 'bg-cyan-50 text-cyan-900 border-cyan-200',
    btn: 'bg-cyan-700',
    btnHover: 'hover:bg-cyan-800',
    text: 'text-cyan-800',
    ring: 'focus:ring-cyan-600',
    boarder: 'border-cyan-200',
  },
};