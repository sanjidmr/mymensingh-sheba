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
import { ArrowLeft, MapPin, MessageCircle, Phone } from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import { ListingMedia, TileCard } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import {
  areaNames,
  bnTakaRange,
  COACHING_CATEGORIES,
  tagLabels,
  toBn,
  type CategoryUiConfig,
  type ServiceListing,
} from '@/lib/catalog-types';

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
  /**
   * Rendered inside the main article, under the description. This is where a
   * category's own sections go (coaching teachers/batches, WiFi packages,
   * reviews) so they read as part of the listing rather than as sidebar widgets.
   */
  body?: React.ReactNode;
  /**
   * Reviews belong after the main information and the contact actions, so on a
   * phone a reader can call before scrolling through feedback.
   */
  reviews?: React.ReactNode;
  /** Same-category suggestions, rendered at the very bottom of the page. */
  related?: React.ReactNode;
  /** Optional block rendered under the facts (e.g. a rental request form). */
  children?: React.ReactNode;
  /** Labels for the call-to-action, e.g. "ভাড়ার অনুরোধ". */
  action?: React.ReactNode;
}

export default function CatalogDetailView({
  ui,
  listing,
  facts,
  body,
  reviews,
  related,
  children,
  action,
}: CatalogDetailViewProps) {
  const { isAdmin } = useAuth();
  const adminNote = isAdmin ? (
    <Link
      href={`/admin/directories/${listing.category}/${listing.id}/edit`}
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
                <span className="rounded-md bg-accent-400 px-2 py-1 text-xs font-extrabold text-brand-950">
                  ফিচার্ড
                </span>
              )}
              {listing.ownerId ? (
                <span className="rounded-md border border-brand-100 bg-mist-50 px-2 py-1 text-xs font-bold text-ink-700">
                  প্রতিষ্ঠান-জমা দেওয়া তথ্য · যাচাই করা হয়নি
                </span>
              ) : (
                <span className="rounded-md border border-brand-100 bg-mist-50 px-2 py-1 text-xs font-bold text-ink-700">
                  অ্যাডমিন-পরিচালিত · আলাদা যাচাইয়ের তথ্য নেই
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-extrabold leading-snug text-ink-900 sm:text-3xl">
              {listing.titleBn}
            </h1>

            {listing.subtitleBn && (
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600 sm:text-base">
                {listing.subtitleBn}
              </p>
            )}

            {facts.length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-brand-100 bg-mist-50 p-3.5 sm:grid-cols-3 sm:gap-4 sm:p-4">
                {facts.map((fact) => (
                  <div key={fact.label} className="min-w-0">
                    <dt className="text-xs font-semibold tracking-wide text-ink-600">
                      {fact.label}
                    </dt>
                    <dd className="mt-1 break-words text-[15px] font-bold leading-snug text-ink-950 sm:text-base">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {listing.summaryBn && (
              <p className="mt-4 text-[15px] leading-relaxed text-ink-700 sm:text-base">
                {listing.summaryBn}
              </p>
            )}

            {listing.category !== 'coaching' && listing.category !== 'wifi' &&
            listing.photos?.filter((photo) => photo && photo !== listing.imageUrl).length ? (
              <section className="mt-5" aria-label="তালিকার আরও ছবি">
                <h2 className="mb-2 text-sm font-extrabold text-ink-900">আরও ছবি</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {listing.photos.filter((photo) => photo && photo !== listing.imageUrl).map((photo, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={`${photo}-${index}`} src={photo} alt={`${listing.titleBn} — ছবি ${index + 1}`} className="aspect-[4/3] w-full rounded-lg border border-brand-100 object-cover" loading="lazy" />
                  ))}
                </div>
              </section>
            ) : null}

            {listing.descriptionBn && (
              <div className="mt-3 space-y-3 text-[15px] leading-[1.8] text-ink-700 sm:text-base">
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
              <p className="mt-4 flex items-start gap-2 text-[15px] leading-relaxed text-ink-700 sm:text-base">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                <span className="min-w-0 break-words">
                  <span className="font-bold text-ink-800">এলাকা: </span>
                  {areaNames(listing.areaIds)}
                </span>
              </p>
            )}
          </div>

          {body ? <div className="border-t border-brand-100 p-3.5 sm:p-5">{body}</div> : null}
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

      {reviews ? <div className="mt-4">{reviews}</div> : null}
      {related ? <div className="mt-6">{related}</div> : null}
    </DirectoryShell>
  );
}

/**
 * Same-category suggestions for a curated listing.
 *
 * The caller passes only rows from its own category query, so a WiFi page can
 * never recommend a coaching centre (and the reverse). Cards reuse `TileCard`,
 * which is the card the directory itself uses — no second visual language.
 */
export function RelatedListings({
  title,
  listings,
}: {
  title: string;
  listings: ServiceListing[];
}) {
  if (listings.length === 0) return null;

  return (
    <section aria-labelledby="related-listings-heading">
      <h2
        id="related-listings-heading"
        className="mb-2.5 text-[15px] font-extrabold text-ink-900"
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {listings.map((listing) => {
          const wifi = listing.category === 'wifi';
          const price = wifi
            ? listing.priceMin != null
              ? bnTakaRange(listing.priceMin, listing.priceMax)
              : undefined
            : bnTakaRange(listing.monthlyFeeMin, listing.monthlyFeeMax);
          const chips = wifi
            ? [
                listing.speedMbps != null ? `${toBn(listing.speedMbps)} Mbps` : '',
                ...tagLabels(listing.tags).slice(0, 1),
              ].filter(Boolean)
            : [
                COACHING_CATEGORIES.find((item) => item.id === listing.coachingCategory)?.labelBn,
                ...tagLabels(listing.tags).filter(
                  (tag) => !['general', 'hsc', 'admission', 'university', 'government'].includes(tag)
                ).slice(0, 1),
              ].filter((chip): chip is string => Boolean(chip));

          return (
            <TileCard
              key={listing.id}
              href={`/${listing.category}/${listing.slug}`}
              title={listing.titleBn}
              subtitle={listing.subtitleBn}
              imageUrl={
                wifi ? listing.logoUrl || listing.imageUrl : listing.imageUrl || listing.logoUrl
              }
              priceLabel={price}
              priceSuffix={price ? '/মাস' : undefined}
              areaLabel={areaNames(listing.areaIds)}
              chips={chips}
              badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
              actionLabel="বিস্তারিত দেখুন"
              mobileMinimal
            />
          );
        })}
      </div>
    </section>
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
  hideRequestFallback = false,
}: {
  phone?: string;
  /**
   * When true and there is no number, show a neutral note instead of the
   * /contact request call-to-action. The member-facing coaching/wifi pages use
   * this so they never present a service-request CTA.
   */
  hideRequestFallback?: boolean;
}) {
  if (!phone) {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4">
        <h2 className="text-[14px] font-bold text-ink-900 sm:text-base">যোগাযোগ</h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
          {hideRequestFallback
            ? 'এখনো সরাসরি যোগাযোগের নম্বর যোগ করা হয়নি।'
            : 'এখনো কোনো সরাসরি নম্বর যোগ করা হয়নি। অনুরোধ পাঠালে অ্যাডমিন যোগাযোগ করাবেন।'}
        </p>
        {!hideRequestFallback && (
          <Link
            href="/contact#contact-form"
            className={`mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            অনুরোধ পাঠান
          </Link>
        )}
      </div>
    );
  }

  // `tel:` keeps a leading + and digits only. The number itself is never
  // printed: both actions are links, so the contact stays a deliberate tap
  // rather than text a scraper (or a passer-by) can lift off the page.
  const tel = phone.replace(/[^\d+]/g, '');
  const whatsapp = phone.replace(/[^\d]/g, '');
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4">
      <h2 className="text-[14px] font-bold text-ink-900 sm:text-base">যোগাযোগ</h2>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
        সরাসরি কল করুন অথবা WhatsApp-এ মেসেজ দিন — নম্বর আলাদা করে দেখানো হয় না।
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <a
          href={`tel:${tel}`}
          className={`inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>কল করুন</span>
        </a>
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 text-[14px] font-extrabold text-emerald-800 transition-colors hover:bg-emerald-100 ${LIGHT_FOCUS}`}
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        )}
      </div>
    </div>
  );
}
