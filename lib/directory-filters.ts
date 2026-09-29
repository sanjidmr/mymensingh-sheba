/**
 * Declarative filter schema for every directory page.
 *
 * Fifteen different pages need "search + বেছে নিন" but each needs a
 * different set of facets. Rather than hand-write fifteen near-identical
 * drawer components, every page declares its facets here and one shared
 * sheet renders them. Adding a filter to a page is a data change.
 *
 * `id` is the key used in filter state and in the URL query string.
 */
import { getAllMCCAreas } from './locations';

export interface FilterOption {
  id: string;
  labelBn: string;
  /** Numeric bounds for range-style options (budget, counts). */
  min?: number;
  max?: number;
}

export type FilterGroupType = 'single' | 'multi' | 'range';

export interface FilterGroup {
  id: string;
  labelBn: string;
  type: FilterGroupType;
  options: FilterOption[];
  /** Rendered as a horizontal chip row instead of stacked rows. */
  compact?: boolean;
}

/** MCC area list, reshaped as a single-select facet. */
export function areaFilterGroup(): FilterGroup {
  const areas = getAllMCCAreas({ activeOnly: true });
  return {
    id: 'area',
    labelBn: 'এলাকা',
    type: 'single',
    options: [
      { id: 'all', labelBn: 'সব এলাকা' },
      ...areas.map((a) => ({ id: a.id, labelBn: a.nameBn })),
    ],
  };
}

export function areaFilterGroupMulti(): FilterGroup {
  const areas = getAllMCCAreas({ activeOnly: true });
  return {
    id: 'areas',
    labelBn: 'এলাকা',
    type: 'multi',
    compact: true,
    options: areas.map((a) => ({ id: a.id, labelBn: a.nameBn })),
  };
}

export interface FilterState {
  /** group id -> selected option id (single) or id[] (multi) */
  [groupId: string]: string | string[] | undefined;
}

export function getSelected(group: FilterGroup, state: FilterState): string[] {
  const raw = state[group.id];
  if (raw === undefined) return [];
  return Array.isArray(raw) ? raw : [raw];
}

/** Human label for a selected option, for the active-chip row. */
export function optionLabel(group: FilterGroup, optionId: string): string {
  return group.options.find((o) => o.id === optionId)?.labelBn ?? optionId;
}

export function labelFor(
  groups: FilterGroup[],
  state: FilterState,
  groupId: string
): string | undefined {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return undefined;
  const selected = getSelected(group, state).filter((id) => id !== 'all');
  if (selected.length === 0) return undefined;
  return selected.map((id) => optionLabel(group, id)).join(', ');
}

export function countActiveFilters(groups: FilterGroup[], state: FilterState): number {
  return groups.reduce((total, group) => {
    const selected = getSelected(group, state).filter((id) => id !== 'all');
    return total + selected.length;
  }, 0);
}

// ---------------------------------------------------------------------------
// Generic matcher — works for every page without per-page filter code
// ---------------------------------------------------------------------------

/** A record projected into the fields the generic matcher can test. */
export interface MatchableRecord {
  /** The record's own searchable area ids, if it has any. */
  areaIds?: string[];
  /** Numeric field a range group should compare against, per group id. */
  ranges?: Record<string, number | undefined>;
  /** Any other single-value field a group id should compare against. */
  values?: Record<string, string | string[] | undefined>;
}

/**
 * Applies a whole `FilterState` to a list of records.
 *
 * Generic over the item type: callers hold their own domain types (a to-let
 * listing, a staff profile), so `toRecord` projects one into the shape the
 * matcher understands. `resolveArea` then maps the `area` / `areas` group id
 * onto whatever the record calls its location, because to-let uses `areaId`,
 * tutors use `areaIds`, and some pages only have a free-text locality.
 */
export function applyFilters<T>(
  items: T[],
  groups: FilterGroup[],
  state: FilterState,
  toRecord: (item: T) => MatchableRecord,
  resolveArea: (
    item: T,
    record: MatchableRecord,
    selectedAreaIds: string[]
  ) => boolean
): T[] {
  const active = groups
    .map((g) => ({ group: g, selected: getSelected(g, state).filter((id) => id !== 'all') }))
    .filter((entry) => entry.selected.length > 0);

  if (active.length === 0) return items;

  return items.filter((item) => {
    const record = toRecord(item);
    for (const { group, selected } of active) {
      if (group.id === 'area' || group.id === 'areas') {
        if (!resolveArea(item, record, selected)) return false;
        continue;
      }

      if (group.type === 'range') {
        const value = record.ranges?.[group.id];
        if (value === undefined) return false;
        // A record matches if its numeric value falls inside ANY selected
        // band — selecting "5–10k" and "10–20k" together widens the range
        // rather than intersecting it.
        const inAnyBand = selected.some((id) => {
          const option = group.options.find((o) => o.id === id);
          const min = option?.min ?? 0;
          const max = option?.max;
          return value >= min && (max === undefined || value <= max);
        });
        if (!inAnyBand) return false;
        continue;
      }

      const recordValue = record.values?.[group.id];
      if (recordValue === undefined) return false;
      const recordValues = Array.isArray(recordValue) ? recordValue : [recordValue];
      if (!selected.some((sel) => recordValues.includes(sel))) return false;
    }
    return true;
  });
}
