'use client';

/**
 * WifiDetailSections — the WiFi-only body of the detail page: package
 * comparison and the terms that qualify it.
 *
 * Reviews deliberately live outside this component (see `WifiDetail`), because
 * on a phone they belong after the call/WhatsApp actions, not between the
 * packages and the contact buttons.
 *
 * Packages are rendered as a comparison table on wide screens and stacked
 * cards on a phone, because "which package is cheapest for 20 Mbps" is exactly
 * the question a reader opens this page to answer.
 */
import React, { useEffect, useState } from 'react';
import { Gift, Loader2, Wifi } from 'lucide-react';
import { fetchWifiPackages } from '@/lib/catalog-service';
import { bnDate, bnTaka, toBn, type WifiPackage } from '@/lib/catalog-types';

export default function WifiDetailSections({
  listingId,
  connectionFee,
  termsBn,
}: {
  listingId: string;
  connectionFee?: number;
  termsBn?: string;
}) {
  const [packages, setPackages] = useState<WifiPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchWifiPackages(listingId);
      if (!active) return;
      setPackages(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  return (
    <>
      <section aria-labelledby="wifi-packages-heading">
        <h2 id="wifi-packages-heading" className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900 sm:text-base">
          <Wifi className="h-4 w-4 text-brand-600" aria-hidden="true" /> প্যাকেজ ও অফার
        </h2>
        {(connectionFee != null || termsBn) && (
          <dl className="mt-2 space-y-1 rounded-lg border border-brand-100 bg-mist-50 p-3 text-[12.5px] leading-relaxed text-ink-600">
            {connectionFee != null && (
              <div><dt className="inline font-bold">সংযোগ ফি: </dt><dd className="inline">{bnTaka(connectionFee)} টাকা</dd></div>
            )}
            {termsBn && (
              <div><dt className="inline font-bold">শর্তাবলি: </dt><dd className="inline break-words">{termsBn}</dd></div>
            )}
          </dl>
        )}
        {loading ? (
          <p className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> লোড হচ্ছে…
          </p>
        ) : packages.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-ink-500">এখনো কোনো প্যাকেজ যোগ করা হয়নি।</p>
        ) : (
          <>
            {/* phone: stacked cards */}
            <ul className="mt-2 space-y-2 lg:hidden">
              {packages.map((p) => (
                <li key={p.id} className="rounded-xl border border-brand-100 bg-white p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-ink-900">{p.nameBn}</p>
                    {p.price != null && (
                      <p className="shrink-0 text-[13.5px] font-extrabold text-brand-800">
                        {bnTaka(p.price)}
                        <span className="ml-1 text-[10.5px] font-semibold text-ink-400">/মাস</span>
                      </p>
                    )}
                  </div>
                  {p.speedMbps != null && (
                    <p className="mt-0.5 text-[11.5px] text-ink-500">{toBn(p.speedMbps)} Mbps</p>
                  )}
                  {p.offerLabelBn && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <Gift className="h-3 w-3" aria-hidden="true" /> {p.offerLabelBn}
                    </p>
                  )}
                  {p.offerConditionsBn && (
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                      শর্ত: {p.offerConditionsBn}
                    </p>
                  )}
                  {p.connectionFee != null && (
                    <p className="mt-1 text-[11px] text-ink-500">
                      সংযোগ ফি: {bnTaka(p.connectionFee)} টাকা
                    </p>
                  )}
                  {p.offerExpiresOn && (
                    <p className="mt-0.5 text-[11px] text-ink-500">
                      অফার শেষ: {bnDate(p.offerExpiresOn)}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            {/* desktop: comparison table */}
            <div className="mt-2 hidden overflow-hidden rounded-xl border border-brand-100 lg:block">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-mist-50 text-[11px] uppercase tracking-wide text-ink-400">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">প্যাকেজ</th>
                    <th scope="col" className="px-3 py-2 font-semibold">স্পিড</th>
                    <th scope="col" className="px-3 py-2 font-semibold">মাসিক দাম</th>
                    <th scope="col" className="px-3 py-2 font-semibold">অফার</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {packages.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="px-3 py-2.5 font-bold text-ink-900">{p.nameBn}</td>
                      <td className="px-3 py-2.5 text-ink-600">
                        {p.speedMbps != null ? `${toBn(p.speedMbps)} Mbps` : '—'}
                      </td>
                      <td className="px-3 py-2.5 font-extrabold text-brand-800">
                        {p.price != null ? bnTaka(p.price) : '—'}
                        {p.connectionFee != null && (
                          <p className="mt-0.5 text-[11px] font-semibold text-ink-500">
                            সংযোগ ফি: {bnTaka(p.connectionFee)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {p.offerLabelBn ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Gift className="h-3 w-3" aria-hidden="true" /> {p.offerLabelBn}
                          </span>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                        {p.offerConditionsBn && (
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                            {p.offerConditionsBn}
                          </p>
                        )}
                        {p.offerExpiresOn && (
                          <p className="mt-0.5 text-[11px] text-ink-500">
                            অফার শেষ: {bnDate(p.offerExpiresOn)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
