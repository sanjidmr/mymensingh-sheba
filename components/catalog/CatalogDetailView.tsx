'use client';

/**
 * The shared detail view for a curated service listing.
 *
 * One component serves the coaching / wifi / bus / vehicle detail routes. They
 * differ only in which facts are meaningful, so the caller passes a `facts`
 * array of already-resolved Bengali strings and the layout stays identical —
 * which is what keeps a detail page from drifting into a different design from
 * the card that linked to it.
 *
 * Deliberate omission: no global Footer. These are detail pages inside a
 * directory, and the app already restricts the footer to the marketing routes.
 */
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, MapPin, Phone } from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import type { CategoryUiConfig, ServiceListing } from '@/lib/catalog-types';

export interface DetailFact {
  label: string;
  value: string;
}

/** Placeholder shown while a detail row is in flight. */
export function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-6">
      <div className="h-72 animate-pulse rounded-xl bg-mist-100" aria-hidden="true" />
      <p className="mt-3 text-center text-sm text-ink-500">তথ্য লোড হচ্ছে…</p>
    </div>
  );
}

export interface CatalogDetailViewProps {
  ui: CategoryUiConfig;
  listing: ServiceListing;
  facts: DetailFact[];
  /** Optional block rendered under the facts (e.g. a rental request form). */
  children?: React.ReactNode;
  /** Labels for the call-to-action, e.g. "ভাড়ার অনুরোধ". */
  action?: React.ReactNode;
}

export default function CatalogDetailView({
  ui,
  listing,
  facts,
  children,
  action,
}: CatalogDetailViewProps) {
  const { isAdmin } = useAuth();
  const adminNote = isAdmin ? (
    <Link
      href={`/admin/catalog?category=${listing.category}&edit=${listing.id}`}
      className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[13px] font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
    >
      সম্পাদনা
    </Link>
  ) : null;

  return (
    <DirectoryShell
      title={listing.titleBn}
      breadcrumbs={[
        { label: ui.title, href: ui.route },
        { label: listing.titleBn },
      ]}
      action={adminNote}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="min-w-0 overflow-hidden rounded-xl border border-brand-100 bg-white">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-mist-100 sm:aspect-[16/7]">
            <ListingMedia
              src={listing.imageUrl || listing.logoUrl}
              alt={listing.titleBn}
              label={listing.titleBn}
            />
          </div>

          <div className="p-3.5 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              {listing.isFeatured && (
                <span className="rounded-md bg-accent-400 px-1.5 py-[3px] text-[10px] font-extrabold text-brand-950">
                  ফিচার্ড
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-md border border-brand-100 bg-mist-50 px-1.5 py-[3px] text-[10px] font-bold text-brand-700">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                অ্যাডমিন যাচাইকৃত
              </span>
            </div>

            <h1 className="mt-2 text-lg font-extrabold leading-snug text-ink-900 sm:text-2xl">
              {listing.titleBn}
            </h1>

            {listing.subtitleBn && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500 sm:text-sm">
                {listing.subtitleBn}
              </p>
            )}

            {facts.length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-lg border border-brand-100 bg-mist-50 p-3 sm:grid-cols-3 sm:p-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="min-w-0">
                    <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                      {fact.label}
                    </dt>
                    <dd className="mt-0.5 truncate text-[13px] font-bold text-ink-900 sm:text-sm">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {listing.summaryBn && (
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink-600 sm:text-[15px]">
                {listing.summaryBn}
              </p>
            )}

            {listing.descriptionBn && (
              <div className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-ink-600 sm:text-[15px]">
                {listing.descriptionBn
                  .split(/\n{2,}/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            )}

            {listing.areaIds.length > 0 && (
              <p className="mt-4 flex items-start gap-1.5 text-[12.5px] text-ink-500 sm:text-sm">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                <span>এলাকা</span>
              </p>
            )}
          </div>
        </article>

        <aside className="min-w-0 space-y-3 sm:sticky sm:top-4 sm:self-start">
          {action}
          {children}
          <Link
            href={ui.route}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {ui.title} তালিকায় ফিরে যান
          </Link>
        </aside>
      </div>
    </DirectoryShell>
  );
}

/**
 * Shown when a slug resolves to nothing.
 *
 * A missing or retired listing is a normal state, not an error, and the copy
 * says so without blaming the reader for a bad link.
 */
export function CatalogDetailMissing({ ui }: { ui: CategoryUiConfig }) {
  return (
    <div className="mx-auto max-w-2xl px-3 py-10 text-center">
      <h1 className="text-lg font-extrabold text-ink-900">তথ্যটি পাওয়া যায়নি</h1>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
        এই {ui.title} আর তালিকায় নেই, অথবা লিংকটি ভুল হয়েছে। অন্য কোনো তথ্য খুঁজে
        দেখুন।
      </p>
      <Link
        href={ui.route}
        className={`mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
      >
        {ui.title} তালিকায় ফিরে যান
      </Link>
    </div>
  );
}

/**
 * The contact block.
 *
 * The private number is only ever rendered when the database actually holds
 * one, and it is fetched with an admin check inside the service layer, so a
 * signed-out reader receives a real number or no number — never a placeholder
 * and never a national hotline standing in for a local one.
 */
export function ContactBlock({
  phone,
  onCopy,
}: {
  phone?: string;
  onCopy?: (value: string) => void;
}) {
  if (!phone) {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4">
        <h2 className="text-[14px] font-bold text-ink-900 sm:text-base">যোগাযোগ</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
          এখনো কোনো সরাসরি নম্বর যোগ করা হয়নি। অনুরোধ পাঠালে অ্যাডমিন যোগাযোগ
          করাবেন।
        </p>
        <Link
          href="/contact#contact-form"
          className={`mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          অনুরোধ পাঠান
        </Link>
      </div>
    );
  }

  const tel = phone.replace(/[^\d+]/g, '');
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4">
      <h2 className="text-[14px] font-bold text-ink-900 sm:text-base">যোগাযোগ</h2>
      <a
        href={`tel:${tel}`}
        className={`mt-2.5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        <span className="truncate">{phone}</span>
      </a>
      {onCopy && (
        <button
          type="button"
          onClick={() => onCopy(phone)}
          className={`mt-2 min-h-[40px] w-full rounded-lg border border-brand-200 bg-white px-3 text-[13px] font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
        >
          নম্বর কপি করুন
        </button>
      )}
    </div>
  );
}
