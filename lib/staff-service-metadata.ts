/**
 * Server-safe, read-only staff profile lookup for `generateMetadata`.
 *
 * Why this file exists instead of `fetchStaffProfileById`
 * --------------------------------------------------------
 * `lib/staff-service.ts` carries `'use client'` because it resolves Supabase
 * through the *browser* client and pushes notifications. Calling it from
 * `/kajer-bua/[id]`, `/electrician/[id]` or `/plumber/[id]` therefore threw
 *
 *     "Attempted to call fetchStaffProfileById() from the server but
 *      fetchStaffProfileById is on the client."
 *
 * and those three routes returned HTTP 500. The page body now fetches in the
 * browser (see `components/staff/StaffDetailShell`), but `<title>` and the
 * OpenGraph tags can only be produced on the server — so metadata needs a
 * server-side read.
 *
 * This module is deliberately narrow: one row, public columns only.
 * `phone_private` is never selected, which keeps the privacy contract in
 * `staff-service.ts` intact for this path too. Write operations still go
 * through `staff-service.ts`; nothing here mutates anything.
 */

import { isSupabaseConfigured } from './supabase/client';
import { createServerSideClient } from './supabase/server';
import { toCamelObject } from './supabase/transform';
import { mockFetchStaffProfileById } from './staff-service-mock';
import type { StaffProfile, StaffServiceKey } from './staff-types';

/** Same column list as `PUBLIC_PROFILE_COLUMNS` in `staff-service.ts`. */
const PUBLIC_PROFILE_COLUMNS =
  'id, service_slug, name_bn, title_bn, image_url, areas, work_types, work_mode, time_slot, experience_years, availability, is_emergency, salary_min, salary_max, rate_label, about_bn, is_verified, is_active, created_at, updated_at';

function mapProfileRow(row: Record<string, unknown>): StaffProfile {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    serviceSlug: (c.serviceSlug as StaffServiceKey) || 'kajer-bua',
    nameBn: (c.nameBn as string) || '',
    titleBn: (c.titleBn as string) || '',
    imageUrl: (c.imageUrl as string) || '',
    areaIds: Array.isArray(c.areas) ? (c.areas as string[]) : [],
    workTypes: Array.isArray(c.workTypes) ? (c.workTypes as string[]) : [],
    workMode: (c.workMode as string) || undefined,
    timeSlot: (c.timeSlot as string) || undefined,
    experienceYears: Number(c.experienceYears ?? 0),
    availability: (c.availability as StaffProfile['availability']) || 'available',
    isEmergency: Boolean(c.isEmergency),
    salaryMin: c.salaryMin != null ? Number(c.salaryMin) : undefined,
    salaryMax: c.salaryMax != null ? Number(c.salaryMax) : undefined,
    rateLabel: (c.rateLabel as string) || undefined,
    aboutBn: (c.aboutBn as string) || '',
    isVerified: Boolean(c.isVerified),
    isActive: Boolean(c.isActive),
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || '',
  };
}

/**
 * Returns the active public profile for `id`, or `null`.
 *
 * Never throws: metadata is allowed to degrade to the generic title rather than
 * taking the whole page down with it.
 */
export async function fetchStaffProfileForMetadata(
  id: string
): Promise<StaffProfile | null> {
  if (!isSupabaseConfigured) {
    return mockFetchStaffProfileById(id) ?? null;
  }

  try {
    const client = await createServerSideClient();
    if (!client) return null;
    const { data, error } = await client
      .from('staff_profiles')
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !data) return null;
    return mapProfileRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
