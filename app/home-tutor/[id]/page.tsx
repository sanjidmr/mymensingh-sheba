'use client';

/**
 * Griho Shikkhok (গৃহ শিক্ষক) — profile detail page.
 *
 * The brief for this page is seven sections, in this order:
 *
 *   1. প্রোফাইল            → TutorProfileHeader (photo, name, intro, status,
 *                             current activity)
 *   2. শিক্ষাগত যোগ্যতা      → TutorEducationSection
 *   3. বর্তমানে কী করেন     → TutorCurrentActivitySection
 *   4. বিষয় ও ক্লাস          → TutorTeachingSection
 *   5. পড়ানোর বিস্তারিত      → TutorTeachingSection (same section, two blocks)
 *   6. বেতন                 → TutorSalaryCard
 *   7. CTA                  → the sidebar panel + TutorCtaBar
 *
 * Every one of sections 2–6 renders only when its data exists. A tutor whose
 * profile was filled in before the new columns existed still renders a
 * complete-looking page; it is simply narrower, and every line on it is true.
 * Nothing is defaulted, guessed or backfilled — see `TutorEducationSection` for
 * the one place a legacy row is widened from its own stored triple rather than
 * from a default.
 */

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Flag, GraduationCap, Loader2, MessageCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TutorRequestForm from '@/components/home-tutor/TutorRequestForm';
import { TutorReviewsSection } from '@/components/home-tutor/TutorReviewsSection';
import { TutorReportSheet } from '@/components/home-tutor/TutorReportSheet';
import { TutorProfileHeader } from '@/components/home-tutor/detail/TutorProfileHeader';
import {
  TutorCurrentActivitySection,
  TutorEducationSection,
  TutorTeachingSection,
} from '@/components/home-tutor/detail/TutorSections';
import { TutorCtaBullets, TutorSalaryCard } from '@/components/home-tutor/detail/TutorSalaryCard';
import { TutorCtaBar, TutorCtaBarSpacer } from '@/components/home-tutor/detail/TutorCtaBar';
import { fetchPublishedTutorById } from '@/lib/home-tutor-service';
import { useAuth } from '@/lib/auth-context';
import type { HomeTutorProfile } from '@/lib/supabase/types';

function TutorProfileContent({ tutorId }: { tutorId: string }) {
  const { user } = useAuth();
  const [tutor, setTutor] = useState<HomeTutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedTutorById(tutorId).then((data) => {
      if (cancelled) return;
      setTutor(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mist-50">
        <Navbar />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-20 text-ink-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
          <span className="text-sm">প্রোফাইল লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-mist-50">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-ink-300" aria-hidden="true" />
          <h1 className="text-lg font-bold text-ink-900">প্রোফাইলটি পাওয়া যায়নি</h1>
          <p className="mt-2 text-sm text-ink-500">
            শিক্ষক প্রোফাইলটি হয় প্রকাশিত নয় অথবা স্থগিত করা হয়েছে।
          </p>
          <Link
            href="/home-tutor"
            className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-700 px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            গৃহশিক্ষক তালিকায় ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-5 sm:py-8">
        <TutorProfileHeader tutor={tutor} />

        {tutor.isDemo && (
          <p className="mt-3 rounded-xl border border-accent-200 bg-accent-100/50 p-3 text-[12.5px] leading-relaxed text-accent-700">
            এটি একটি <strong>নমুনা প্রোফাইল</strong>, অ্যাডমিন অনুমোদন করা প্রকৃত শিক্ষক নয়।
            অনুরোধ পাঠালে কোনো শিক্ষকের সঙ্গে যোগাযোগ হবে না। প্রকৃত প্রোফাইল যোগ হলে এটি
            সরে যাবে।
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Sections */}
          <div className="space-y-4 lg:col-span-7">
            <TutorEducationSection tutor={tutor} />
            <TutorCurrentActivitySection tutor={tutor} />
            <TutorTeachingSection tutor={tutor} />

            <TutorReviewsSection tutor={tutor} />

            {/* A 26px-tall button is not a target a thumb can hit reliably, even though it
                looks like quiet secondary text. `min-h-11` keeps the visual
                weight of a footnote while giving it a real hit area; the
                negative bottom margin reclaims the space it adds. */}
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="-mb-2 inline-flex min-h-11 items-center gap-1.5 text-[12px] font-medium text-ink-400 transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              এই প্রোফাইলে সমস্যা হলে রিপোর্ট করুন
            </button>
          </div>

          {/* Fee + request form. Sticky on desktop so the form is reachable
              while reading the sections; on a phone it simply comes after them,
              which is why TutorCtaBar exists. */}
          <div className="lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-6">
              <TutorSalaryCard tutor={tutor} />

              <div id="tutor-request" className="scroll-mt-4">
                <TutorRequestForm tutor={tutor} />
              </div>

              <section className="rounded-2xl border border-mist-200 bg-white p-4">
                <h2 className="flex items-center gap-2 text-[13.5px] font-extrabold text-ink-900">
                  <MessageCircle className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  অনুরোধ পাঠালে যা হবে
                </h2>
                <TutorCtaBullets tutor={tutor} />
              </section>
            </div>
          </div>
        </div>

        <TutorCtaBarSpacer />
      </main>

      <TutorCtaBar tutor={tutor} />

      <TutorReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        tutorId={tutor.id}
        user={user}
      />
    </div>
  );
}

export default function HomeTutorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <TutorProfileContent tutorId={resolvedParams.id} />;
}