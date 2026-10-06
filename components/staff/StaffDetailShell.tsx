'use client';

/**
 * StaffDetailShell — the client runtime behind `/kajer-bua/[id]`,
 * `/electrician/[id]` and `/plumber/[id]`.
 *
 * Why this exists
 * ---------------
 * `lib/staff-service.ts` is a `'use client'` module (it resolves Supabase
 * through the browser client and falls back to the in-memory mock store), so
 * calling `fetchStaffProfileById()` from a server component throws:
 *
 *     "Attempted to call fetchStaffProfileById() from the server but
 *      fetchStaffProfileById is on the client."
 *
 * which surfaced as a hard HTTP 500 on all three routes. The pages are now split
 * the same way the working `/home-tutor/[id]` page is split: the route file stays
 * a server component so `generateMetadata()` keeps running at build time, and all
 * fetching happens here, in the browser, after hydration.
 *
 * The hero markup is carried over verbatim from the three route files — same
 * gradient band, same badge, same heading order — so the rendered page is
 * unchanged apart from the spacing noted inline below.
 */

import React, { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { StaffDetail } from '@/components/staff/StaffDetail';
import { fetchStaffProfileById } from '@/lib/staff-service';
import type { StaffProfile, StaffServiceKey, StaffServiceUiConfig } from '@/lib/staff-types';

export interface StaffDetailShellProps {
  profileId: string;
  serviceSlug: StaffServiceKey;
  serviceUi: StaffServiceUiConfig;
  /** Tailwind gradient utilities for the existing per-service hero band. */
  heroGradient: string;
  /** Tailwind text-colour utilities matching `heroGradient`. */
  heroText: string;
  /** Badge label shown above the name. */
  heroBadge: string;
  imageless?: boolean;
}

export function StaffDetailShell({
  profileId,
  serviceSlug,
  serviceUi,
  heroGradient,
  heroText,
  heroBadge,
  imageless = false,
}: StaffDetailShellProps) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStaffProfileById(profileId).then((data) => {
      if (cancelled) return;
      setProfile(data);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mist-50">
        <Navbar />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-16 text-ink-500 sm:py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
          <span className="text-sm">প্রোফাইল লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  // Preserves the previous `notFound()` behaviour for a missing id or an id that
  // belongs to a different service (a plumber id pasted into the bua URL).
  if (!profile || profile.serviceSlug !== serviceSlug) notFound();

  return (
    <div className="min-h-screen bg-mist-50">
      <Navbar />
      {/* Hero */}
      <section
        className={`relative overflow-hidden bg-gradient-to-br ${heroGradient} text-white`}
      >
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5" />
        {/* Mobile: tighter vertical rhythm so the hero stops eating the first
            screen. `sm:py-14` restores the original desktop spacing unchanged. */}
        <div className="relative mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-14 lg:px-8">
          <div className={`mb-2.5 flex items-center gap-2 text-sm ${heroText} sm:mb-3`}>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
              {heroBadge}
            </span>
          </div>
          {/* 36px is too wide a jump on a 320px screen; 28px → 36px keeps the
              headline on at most two lines and still lets the name breathe. */}
          <h1 className="text-[1.75rem] font-bold leading-tight sm:text-4xl">
            {profile.nameBn}
          </h1>
          <p className={`mt-2 max-w-2xl text-base sm:text-lg ${heroText}`}>
            {profile.titleBn}
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-5 max-w-5xl px-4 py-5 sm:-mt-6 sm:px-6 sm:py-12 lg:px-8">
        <StaffDetail profile={profile} serviceUi={serviceUi} imageless={imageless} />
      </section>
    </div>
  );
}
