'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Heart, Loader2, School, Wifi } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { fetchMyServiceListings } from '@/lib/catalog-service';
import { SERVICE_LISTING_STATUS_META, toBn, type ServiceListing } from '@/lib/catalog-types';
import { TUTOR_STATUS_META } from '@/lib/home-tutor-types';
import { DONOR_STATUS_META } from '@/lib/blood-donor-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

interface OpenInfo {
  statusLabel: string;
  statusClass: string;
  count: number;
  manageHref: string;
}

export default function ProfileManager() {
  const { homeTutorProfile, bloodDonorProfile } = useAuth();
  const [serviceListings, setServiceListings] = useState<ServiceListing[] | null>(null);

  useEffect(() => {
    let active = true;
    void fetchMyServiceListings()
      .then((rows) => { if (active) setServiceListings(rows); })
      .catch(() => { if (active) setServiceListings([]); });
    return () => { active = false; };
  }, []);

  const latestServiceOpen = (category: 'wifi' | 'coaching'): OpenInfo | null => {
    if (!serviceListings) return null;
    const matches = serviceListings.filter((row) => row.category === category);
    if (matches.length === 0) return null;
    const latest = matches[0];
    const meta = SERVICE_LISTING_STATUS_META[latest.status ?? 'pending'];
    return {
      statusLabel: meta.labelBn,
      statusClass: meta.className,
      count: matches.length,
      manageHref: '/dashboard/service-listings',
    };
  };

  const entries: {
    href: string;
    icon: typeof Wifi;
    title: string;
    description: string;
    action: string;
    open: OpenInfo | null;
    pending: boolean;
  }[] = [
    {
      href: '/profile/home-tutor',
      icon: GraduationCap,
      title: 'গৃহশিক্ষক',
      description: 'আপনার শিক্ষক প্রোফাইল তৈরি, দেখা ও হালনাগাদ করুন।',
      action: homeTutorProfile ? 'প্রোফাইল দেখুন ও সম্পাদনা' : 'প্রোফাইল খুলুন',
      open: homeTutorProfile
        ? {
            statusLabel: TUTOR_STATUS_META[homeTutorProfile.status].labelBn,
            statusClass: TUTOR_STATUS_META[homeTutorProfile.status].badge,
            count: 1,
            manageHref: '/profile/home-tutor',
          }
        : null,
      pending: false,
    },
    {
      href: '/profile/blood-donor',
      icon: Heart,
      title: 'রক্তদাতা',
      description: 'রক্তদাতা হিসেবে নিবন্ধন করুন বা তথ্য পরিচালনা করুন।',
      action: bloodDonorProfile ? 'প্রোফাইল দেখুন ও সম্পাদনা' : 'প্রোফাইল খুলুন',
      open: bloodDonorProfile
        ? {
            statusLabel: DONOR_STATUS_META[bloodDonorProfile.status].labelBn,
            statusClass: DONOR_STATUS_META[bloodDonorProfile.status].badge,
            count: 1,
            manageHref: '/profile/blood-donor',
          }
        : null,
      pending: false,
    },
    {
      href: '/dashboard/wifi/new',
      icon: Wifi,
      title: 'WiFi',
      description: 'আপনার WiFi ইন্টারনেট সেবার তথ্য ও প্যাকেজ জমা দিন।',
      action: 'WiFi তথ্য যোগ করুন',
      open: latestServiceOpen('wifi'),
      pending: serviceListings === null,
    },
    {
      href: '/dashboard/coaching/new',
      icon: School,
      title: 'কোচিং সেন্টার',
      description: 'আপনার কোচিং সেন্টারের ঠিকানা ও ফি জমা দিন।',
      action: 'কোচিং তথ্য যোগ করুন',
      open: latestServiceOpen('coaching'),
      pending: serviceListings === null,
    },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-ink-900">প্রোফাইল ব্যবস্থাপনা</h1>
        <p className="mt-1 text-sm text-ink-500">
          সেবা-প্রোফাইল ও প্রতিষ্ঠানের তালিকা এখানে তৈরি ও পরিচালনা করুন। সাধারণ পোস্ট আলাদা
          <Link href="/dashboard/new" className="ml-1 font-bold text-brand-700 underline">
            নতুন পোস্ট
          </Link>
          পেজে তৈরি হবে।
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {entries.map(({ href, icon: Icon, title, description, action, open, pending }) => (
          <li key={title}>
            <Link
              href={open ? open.manageHref : href}
              className={`flex min-h-32 items-start gap-3 rounded-xl border bg-white p-4 transition-colors ${
                open ? 'border-brand-200 hover:border-brand-300' : 'border-brand-100 hover:border-brand-200'
              } ${LIGHT_FOCUS}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-extrabold text-ink-900">{title}</span>
                  {open && (
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${open.statusClass}`}>
                      খোলা আছে · {open.statusLabel}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-500">{description}</span>
                {open && open.count > 1 && (
                  <span className="mt-1.5 block text-[11.5px] font-bold text-brand-700">
                    মোট {toBn(open.count)}টি তালিকা খোলা আছে
                  </span>
                )}
                {pending ? (
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />অবস্থা যাচাই হচ্ছে…
                  </span>
                ) : (
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
                    {open ? 'পরিচালনা করুন' : action}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/service-listings"
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-800 ${LIGHT_FOCUS}`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          WiFi ও কোচিং তালিকা পরিচালনা
        </Link>
        <Link
          href="/dashboard/profile"
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-800 ${LIGHT_FOCUS}`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          ব্যক্তিগত তথ্য ও অ্যাকাউন্ট সেটিংস
        </Link>
      </div>
    </div>
  );
}
