'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Eye,
  Phone,
  MessageCircle,
  Heart,
  Share2,
  Users,
  Loader2,
  Info,
} from 'lucide-react';
import {
  adminFetchToletAnalytics,
  describeToletStats,
} from '@/lib/tolet-tracking';
import type { ToletListingStats } from '@/lib/tolet-types';
import { toBengaliDigits } from '@/lib/bengali-numerals';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Property-wise engagement analytics for the admin To-Let console.
 *
 * Wording rules that must not be relaxed
 * --------------------------------------
 * `callClicks` counts PRESSES of the "কল করুন" button. The platform has no
 * telephony integration, so it cannot know whether anyone actually dialled, let
 * alone whether they were answered. Every label here therefore says
 * "বাটন চাপা হয়েছে", never "কল হয়েছে" — otherwise the console reports a figure
 * the system never measured, and an admin making a decision off it is misled.
 *
 * Styling note: this deliberately uses the admin console's own slate/emerald
 * palette rather than the tenant-facing brand tokens. A brand-green card dropped
 * into an otherwise slate console reads as bolted-on; local consistency wins
 * inside a single screen.
 */

/** Percentage of views that became a contact-button press. */
function contactRate(stats: ToletListingStats): number | null {
  if (!stats.views) return null;
  return Math.round((stats.contactClicks / stats.views) * 100);
}

function StatTile({
  icon: Icon,
  labelBn,
  value,
  tone = 'slate',
}: {
  icon: React.ElementType;
  labelBn: string;
  value: number;
  tone?: 'slate' | 'emerald';
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{labelBn}</span>
      </dt>
      <dd
        className={cn(
          'mt-1 text-lg font-extrabold tabular-nums leading-none',
          tone === 'emerald' ? 'text-emerald-800' : 'text-slate-900'
        )}
      >
        {toBengaliDigits(value)}
      </dd>
    </div>
  );
}

/**
 * Single-property stat tiles. Rendered on the admin review screen so a moderator
 * can see engagement *before* deciding to approve, publish or reject.
 */
export function ToletListingStatsPanel({
  listingId,
  className,
}: {
  listingId: string;
  className?: string;
}) {
  const [stats, setStats] = useState<ToletListingStats | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await adminFetchToletAnalytics(200);
      if (!active) return;
      setStats(
        rows.find((r) => r.listingId === listingId) ?? {
          listingId,
          views: 0,
          callClicks: 0,
          whatsappClicks: 0,
          contactClicks: 0,
          favorites: 0,
          shares: 0,
          uniqueVisitors: 0,
          lastActivityAt: null,
        }
      );
    })().catch(() => {
      if (active) setStats(null);
    });
    return () => {
      active = false;
    };
  }, [listingId]);

  const rate = stats ? contactRate(stats) : null;

  return (
    <section
      aria-labelledby="tolet-stats-heading"
      className={cn('rounded-2xl border border-slate-200 bg-white p-5 sm:p-6', className)}
    >
      <div className="mb-4 flex items-center gap-2 text-emerald-800">
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        <h3 id="tolet-stats-heading" className="text-sm font-bold">
          এই বিজ্ঞাপনের এনগেজমেন্ট
        </h3>
      </div>

      {!stats ? (
        <div className="flex items-center gap-2 py-4 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>পরিসংখ্যান লোড হচ্ছে…</span>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <StatTile icon={Eye} labelBn="ভিউ" value={stats.views} />
            <StatTile icon={Users} labelBn="আলাদা ভিজিটর" value={stats.uniqueVisitors} />
            <StatTile
              icon={Phone}
              labelBn="কল বাটন চাপা হয়েছে"
              value={stats.callClicks}
              tone="emerald"
            />
            <StatTile
              icon={MessageCircle}
              labelBn="হোয়াটসঅ্যাপ বাটন চাপা হয়েছে"
              value={stats.whatsappClicks}
              tone="emerald"
            />
            <StatTile icon={Heart} labelBn="পছন্দ তালিকায় যোগ" value={stats.favorites} />
            <StatTile icon={Share2} labelBn="শেয়ার" value={stats.shares} />
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>
              মোট যোগাযোগ বাটন:{' '}
              <strong className="font-bold text-slate-800">{toBengaliDigits(stats.contactClicks)}</strong>
            </span>
            {rate !== null && (
              <span>
                ভিউ থেকে যোগাযোগ:{' '}
                <strong className="font-bold text-slate-800">{toBengaliDigits(rate)}%</strong>
              </span>
            )}
            {stats.lastActivityAt && (
              <span>
                সর্বশেষ কার্যকলাপ:{' '}
                <strong className="font-bold text-slate-800">
                  {new Date(stats.lastActivityAt).toLocaleString('bn-BD', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </strong>
              </span>
            )}
          </div>

          {/* The distinction this platform actually makes, stated in the UI. */}
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              এখানে গণনা করা হয় বাটন <strong className="font-bold">চাপা</strong> হয়েছে কিনা —
              প্রকৃত কল বা হোয়াটসঅ্যাপ কথোপকথন শেষ হয়েছে কিনা তা নয়। প্ল্যাটফর্মের কাছে টেলিফনি
              তথ্য নেই, তাই এই সংখ্যাগুলো আসল কলের সংখ্যা নয়।
            </span>
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Ranked property-wise table for the To-Let console.
 *
 * Sorted by contact-button presses first, because that is the action an owner
 * is actually paying for; views alone would rank a cheap, widely-clicked seat
 * above an expensive flat that real tenants rang about.
 */
export function ToletAnalyticsTable({ limit = 25 }: { limit?: number }) {
  const [rows, setRows] = useState<ToletListingStats[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await adminFetchToletAnalytics(limit);
        if (!active) return;
        setRows(data);
      } catch {
        if (active) setFailed(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [limit]);

  const allZero = rows !== null && rows.length === 0;

  return (
    <section
      aria-labelledby="tolet-analytics-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="mb-1 flex items-center gap-2 text-emerald-800">
        <BarChart3 className="h-4 w-4" aria-hidden="true" />
        <h3 id="tolet-analytics-heading" className="text-sm font-bold">
          বিজ্ঞাপনভিত্তিক এনগেজমেন্ট
        </h3>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
        যোগাযোগের বাটন চাপার সংখ্যা অনুযায়ী সাজানো। ভিউ শুধু দেখা বোঝায়; ভাড়াটিয়ার সাথে প্রকৃত যোগাযোগের
        কাছাকাছি পরিমাপ হলো বাটন চাপা।
      </p>

      {failed ? (
        <p className="py-6 text-center text-xs text-slate-500">
          পরিসংখ্যান লোড করা যায়নি।
        </p>
      ) : !rows ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>লোড হচ্ছে…</span>
        </div>
      ) : allZero ? (
        // Being honest beats showing a tidy table of zeroes that reads like
        // "nobody is interested" when the truth is "nothing is being recorded".
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center">
          <p className="text-xs font-semibold text-slate-700">এখনো কোনো ইভেন্ট রেকর্ড হয়নি।</p>
          <p className="mx-auto mt-1.5 max-w-lg text-[11px] leading-relaxed text-slate-500">
            {isSupabaseConfigured
              ? 'সুপাবেস কনফিগার করা আছে, তবে ইভেন্ট টেবিল/ফাংশন এখনো ডিপ্লয় হয়নি। ইভেন্ট সংরক্ষণের জন্য migration চালাতে হবে:'
              : 'সুপাবেস কনফিগার করা নেই, তাই শুধু প্রিভিউ মোডের সাময়িক স্টোরে ইভেন্ট জমা হয়।'}
            {isSupabaseConfigured && (
              <code className="mt-1.5 block text-[10.5px] text-slate-600">
                supabase/migrations/20261004000000_tolet_analytics.sql
              </code>
            )}
          </p>
        </div>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[42rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                <th scope="col" className="py-2 pr-3">বিজ্ঞাপন</th>
                <th scope="col" className="px-2 py-2 text-right">ভিউ</th>
                <th scope="col" className="px-2 py-2 text-right">ভিজিটর</th>
                <th scope="col" className="px-2 py-2 text-right">কল বাটন</th>
                <th scope="col" className="px-2 py-2 text-right">হোয়াটসঅ্যাপ বাটন</th>
                <th scope="col" className="px-2 py-2 text-right">মোট যোগাযোগ</th>
                <th scope="col" className="px-2 py-2 text-right">রেট</th>
                <th scope="col" className="px-2 py-2 text-right">পছন্দ</th>
                <th scope="col" className="py-2 pl-2 text-right">শেয়ার</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const meta = describeToletStats(row);
                const rate = contactRate(row);
                return (
                  <tr key={row.listingId} className="border-b border-slate-100 last:border-0">
                    <th scope="row" className="max-w-[16rem] py-2.5 pr-3 font-normal">
                      <Link
                        href={`/admin/tolet/${row.listingId}`}
                        className="block truncate text-xs font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
                      >
                        {meta.labelBn}
                      </Link>
                      <span className="block truncate text-[10.5px] text-slate-400">
                        {meta.areaLabelBn} • {meta.typeLabelBn}
                      </span>
                    </th>
                    <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">
                      {toBengaliDigits(row.views)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">
                      {toBengaliDigits(row.uniqueVisitors)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs font-bold tabular-nums text-emerald-800">
                      {toBengaliDigits(row.callClicks)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs font-bold tabular-nums text-emerald-800">
                      {toBengaliDigits(row.whatsappClicks)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs font-bold tabular-nums text-slate-900">
                      {toBengaliDigits(row.contactClicks)}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">
                      {rate === null ? '—' : `${toBengaliDigits(rate)}%`}
                    </td>
                    <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">
                      {toBengaliDigits(row.favorites)}
                    </td>
                    <td className="py-2.5 pl-2 text-right text-xs tabular-nums text-slate-600">
                      {toBengaliDigits(row.shares)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
