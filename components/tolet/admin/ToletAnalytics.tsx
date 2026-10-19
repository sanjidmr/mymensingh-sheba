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
  adminFetchToletAnalyticsReport,
} from '@/lib/tolet-tracking';
import type {
  ToletAnalyticsListing,
  ToletListingStats,
} from '@/lib/tolet-types';
import { toBengaliDigits } from '@/lib/bengali-numerals';
import { getToletAreaById } from '@/lib/tolet-areas';
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

function localDateDaysAgo(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
  const [result, setResult] = useState<{ listingId: string; stats: ToletListingStats } | null>(null);
  const [failure, setFailure] = useState<{ listingId: string; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const report = await adminFetchToletAnalyticsReport({
        from: localDateDaysAgo(29),
        to: localDateDaysAgo(0),
        period: 'day',
      });
      if (!active) return;
      setResult({
        listingId,
        stats: report.listings.find((r) => r.listingId === listingId) ?? {
          listingId,
          views: 0,
          callClicks: 0,
          whatsappClicks: 0,
          contactClicks: 0,
          favorites: 0,
          shares: 0,
          uniqueVisitors: 0,
          lastActivityAt: null,
        },
      });
      setFailure(null);
    })().catch((error: unknown) => {
      if (active) {
        setFailure({
          listingId,
          message: error instanceof Error ? error.message : 'পরিসংখ্যান লোড করা যায়নি।',
        });
      }
    });
    return () => {
      active = false;
    };
  }, [listingId]);

  const stats = result?.listingId === listingId ? result.stats : null;
  const currentFailure = failure?.listingId === listingId ? failure.message : '';
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

      {currentFailure ? (
        <p role="alert" className="py-4 text-xs text-rose-700">{currentFailure}</p>
      ) : !stats ? (
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
  const [report, setReport] = useState<{
    key: string;
    listings: ToletAnalyticsListing[];
    trends: Array<{ date: string; views: number; callClicks: number; whatsappClicks: number }>;
    totals: { views: number; callClicks: number; whatsappClicks: number };
  } | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const [fromDate, setFromDate] = useState(() => localDateDaysAgo(29));
  const [toDate, setToDate] = useState(() => localDateDaysAgo(0));
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [sortBy, setSortBy] = useState<'callClicks' | 'views'>('callClicks');
  const [listingPage, setListingPage] = useState(1);
  const filterKey = `${fromDate}:${toDate}:${period}`;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await adminFetchToletAnalyticsReport({
          from: fromDate,
          to: toDate,
          period,
        });
        if (!active) return;
        setReport({
          key: filterKey,
          listings: data.listings,
          trends: data.trends,
          totals: data.totals,
        });
        setFailure(null);
      } catch (error) {
        if (!active) return;
        setFailure({
          key: filterKey,
          message: error instanceof Error ? error.message : 'পরিসংখ্যান লোড করা যায়নি।',
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [fromDate, toDate, period, filterKey]);

  const currentReport = report?.key === filterKey ? report : null;
  const rows = currentReport?.listings ?? null;
  const trends = currentReport?.trends ?? null;
  const currentFailure = failure?.key === filterKey ? failure.message : '';
  const loading = !rows && !currentFailure;
  const rankedRows = [...(rows ?? [])].sort((a, b) =>
    sortBy === 'views'
      ? b.views - a.views || b.callClicks - a.callClicks
      : b.callClicks - a.callClicks || b.views - a.views
  );
  const pageCount = Math.max(1, Math.ceil(rankedRows.length / limit));
  const pageRows = rankedRows.slice((listingPage - 1) * limit, listingPage * limit);
  const totals = currentReport?.totals ?? { views: 0, callClicks: 0, whatsappClicks: 0 };

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
        অনুমোদিত বিজ্ঞাপনের প্রকৃত ডেটাবেজ ইভেন্ট। কলের সংখ্যা নয়—“কল” হলো কল বাটন চাপার সংখ্যা।
      </p>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_180px_auto] sm:items-end">
        <label className="text-[11px] font-semibold text-slate-600">
          শুরু
          <input
            type="date"
            value={fromDate}
            max={toDate}
            onChange={(event) => {
              setListingPage(1);
              setFromDate(event.target.value);
            }}
            className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"
          />
        </label>
        <label className="text-[11px] font-semibold text-slate-600">
          শেষ
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={localDateDaysAgo(0)}
            onChange={(event) => {
              setListingPage(1);
              setToDate(event.target.value);
            }}
            className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"
          />
        </label>
        <label className="text-[11px] font-semibold text-slate-600">
          ট্রেন্ডের সময়
          <select
            value={period}
            onChange={(event) => {
              setListingPage(1);
              setPeriod(event.target.value as 'day' | 'week' | 'month');
            }}
            className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"
          >
            <option value="day">দৈনিক</option>
            <option value="week">সাপ্তাহিক</option>
            <option value="month">মাসিক</option>
          </select>
        </label>
        <span className="min-h-10 self-end pb-2 text-[10px] text-slate-400">
          সর্বোচ্চ ৩৬৬ দিনের তথ্য
        </span>
      </div>

      {currentFailure ? (
        <p role="alert" className="py-6 text-center text-xs text-rose-700">{currentFailure}</p>
      ) : loading && !rows ? (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>লোড হচ্ছে…</span>
        </div>
      ) : (
        <>
          <dl className="mb-4 grid grid-cols-3 gap-2">
            <StatTile icon={Eye} labelBn="মোট ভিউ" value={totals.views} />
            <StatTile icon={Phone} labelBn="কল বাটন চাপা" value={totals.callClicks} tone="emerald" />
            <StatTile icon={MessageCircle} labelBn="WhatsApp বাটন" value={totals.whatsappClicks} tone="emerald" />
          </dl>

          <section aria-labelledby="tolet-trend-heading" className="mb-5 rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <h4 id="tolet-trend-heading" className="text-xs font-bold text-slate-800">
                {period === 'day' ? 'দৈনিক' : period === 'week' ? 'সাপ্তাহিক' : 'মাসিক'} ভিউ ও যোগাযোগ ট্রেন্ড
              </h4>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" aria-label="লোড হচ্ছে" />}
            </div>
            {!trends?.length ? (
              <p className="py-3 text-center text-[11px] text-slate-500">এই সময়সীমায় কোনো ইভেন্ট নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-[11px]">
                  <thead className="text-slate-500">
                    <tr className="border-b border-slate-100">
                      <th className="py-2 pr-3">তারিখ</th>
                      <th className="px-2 py-2 text-right">ভিউ</th>
                      <th className="px-2 py-2 text-right">কল বাটন চাপা</th>
                      <th className="px-2 py-2 text-right">WhatsApp চাপা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((trend) => (
                      <tr key={trend.date} className="border-b border-slate-50 last:border-0">
                        <th className="py-2 pr-3 font-medium text-slate-700">{trend.date}</th>
                        <td className="px-2 py-2 text-right tabular-nums">{toBengaliDigits(trend.views)}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-emerald-800">{toBengaliDigits(trend.callClicks)}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-emerald-800">{toBengaliDigits(trend.whatsappClicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-800">বিজ্ঞাপনভিত্তিক ফলাফল</h4>
            <div className="flex gap-1.5" role="group" aria-label="বিজ্ঞাপন সাজান">
              <button
                type="button"
                aria-pressed={sortBy === 'views'}
                onClick={() => {
                  setListingPage(1);
                  setSortBy('views');
                }}
                className={cn('min-h-9 rounded-lg border px-2.5 text-[11px] font-semibold', sortBy === 'views' ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 text-slate-600')}
              >
                সর্বাধিক দেখা
              </button>
              <button
                type="button"
                aria-pressed={sortBy === 'callClicks'}
                onClick={() => {
                  setListingPage(1);
                  setSortBy('callClicks');
                }}
                className={cn('min-h-9 rounded-lg border px-2.5 text-[11px] font-semibold', sortBy === 'callClicks' ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 text-slate-600')}
              >
                সর্বাধিক কল বাটন
              </button>
            </div>
          </div>

          {!rankedRows.length ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center">
              <p className="text-xs font-semibold text-slate-700">এই সময়সীমায় কোনো অনুমোদিত বিজ্ঞাপন বা ইভেন্ট নেই।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[54rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                    <th scope="col" className="py-2 pr-3">বিজ্ঞাপন / আইডি</th>
                    <th scope="col" className="px-2 py-2">মালিক</th>
                    <th scope="col" className="px-2 py-2">অবস্থান</th>
                    <th scope="col" className="px-2 py-2 text-right">ভিউ</th>
                    <th scope="col" className="px-2 py-2 text-right">কল বাটন</th>
                    <th scope="col" className="px-2 py-2 text-right">WhatsApp</th>
                    <th scope="col" className="py-2 pl-2 text-right">সর্বশেষ কার্যকলাপ</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => {
                    const areaName = row.areaId ? getToletAreaById(row.areaId)?.nameBn ?? row.areaId : '—';
                    const location = [areaName, row.specificAddress].filter(Boolean).join(' • ');
                    return (
                      <tr key={row.listingId} className="border-b border-slate-100 last:border-0">
                        <th scope="row" className="max-w-[15rem] py-2.5 pr-3 font-normal">
                          {row.status ? (
                            <Link href={`/admin/tolet/${row.listingId}`} className="block truncate text-xs font-semibold text-slate-900 hover:text-emerald-800 hover:underline">
                              {row.title}
                            </Link>
                          ) : (
                            <span className="block truncate text-xs font-semibold text-slate-700">{row.title}</span>
                          )}
                          <span className="block truncate text-[10px] text-slate-400">{row.listingId}</span>
                        </th>
                        <td className="max-w-[10rem] truncate px-2 py-2.5 text-xs text-slate-600">{row.ownerName || '—'}</td>
                        <td className="max-w-[14rem] truncate px-2 py-2.5 text-xs text-slate-600" title={location}>{location}</td>
                        <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">{toBengaliDigits(row.views)}</td>
                        <td className="px-2 py-2.5 text-right text-xs font-bold tabular-nums text-emerald-800">{toBengaliDigits(row.callClicks)}</td>
                        <td className="px-2 py-2.5 text-right text-xs tabular-nums text-slate-600">{toBengaliDigits(row.whatsappClicks)}</td>
                        <td className="py-2.5 pl-2 text-right text-[10px] tabular-nums text-slate-500">
                          {row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {rankedRows.length > limit && (
            <nav aria-label="বিশ্লেষণ ফলাফল পৃষ্ঠা" className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-500">
                {toBengaliDigits((listingPage - 1) * limit + 1)}–{toBengaliDigits(Math.min(listingPage * limit, rankedRows.length))} / {toBengaliDigits(rankedRows.length)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={listingPage <= 1}
                  onClick={() => setListingPage((page) => Math.max(1, page - 1))}
                  className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 disabled:opacity-40"
                >
                  আগের
                </button>
                <button
                  type="button"
                  disabled={listingPage >= pageCount}
                  onClick={() => setListingPage((page) => Math.min(pageCount, page + 1))}
                  className="min-h-9 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-700 disabled:opacity-40"
                >
                  পরের
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
