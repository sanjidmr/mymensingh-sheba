'use client';

import Link from 'next/link';
import { ArrowRight, PhoneCall } from 'lucide-react';
import type { HomepageService } from '@/lib/homepage-catalog';

/**
 * CategoryCard — the homepage's unified service-card language.
 *
 * One card component reused by every category so the desktop grid stays
 * perfectly consistent (equal dims, equal chrome, equal hover). A card either
 * shows a photo (`item.image`) or — for emergency services, which should never
 * look like stock photos — a calm forest-green glyph panel with the dial
 * number as a ghost watermark.
 */
export default function CategoryCard({
  item,
  compact = false,
  dense = false,
  /** Override the media box — used where a card must not tower over its row. */
  mediaClassName,
  /**
   * Opt out of the phone-shrunk treatment. Category cards normally sit three
   * across on a ~90px-wide phone column, so their base type has to be tiny.
   * When a card is instead laid out full-width (the how-it-works self-post row,
   * which is a single column on phones) that tiny type would look wrong — pass
   * `wide` to keep the full-size type at every breakpoint.
   */
  wide = false,
}: {
  item: HomepageService;
  compact?: boolean;
  dense?: boolean;
  mediaClassName?: string;
  wide?: boolean;
}) {
  const cardClass = `group flex h-full flex-col overflow-hidden rounded-lg border border-brand-100/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:rounded-xl`;
  const red = item.tone === 'red';

  /** Pick a class pair: the phone-shrunk default, or the full-size `wide` one. */
  const sz = (narrow: string, rest: string) => (wide ? rest : narrow);

  const media = (
    <div
      className={`relative w-full shrink-0 overflow-hidden bg-mist-100 ${
        mediaClassName ??
        sz(
          dense ? 'aspect-[4/3]' : compact ? 'aspect-[4/3] sm:aspect-square' : 'aspect-[16/10]',
          dense ? 'aspect-[4/3]' : compact ? 'aspect-square' : 'aspect-[16/10]'
        )
      }`}
    >
      {item.image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image}
            alt={item.alt ?? item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            style={item.objectPosition ? { objectPosition: item.objectPosition } : undefined}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-brand-950/40 to-transparent"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950"
        >
          <span
            className={`pointer-events-none absolute select-none font-black leading-none text-white/[0.08] ${
              compact ? 'text-[34px] sm:text-[64px]' : 'text-[40px] sm:text-[76px] sm:text-[92px]'
            }`}
          >
            {item.number}
          </span>
          <span
            className={`flex items-center justify-center rounded-xl bg-brand-500/15 text-accent-300 ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-brand-500/25 sm:rounded-2xl ${
              compact ? 'h-8 w-8 sm:h-11 sm:w-11' : 'h-9 w-9 sm:h-16 sm:w-16'
            }`}
          >
            <item.icon className={compact ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-4.5 w-4.5 sm:h-7 sm:w-7'} />
          </span>
        </div>
      )}
      {item.pill && (
        <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded bg-white/90 px-1 py-px text-[9px] font-bold text-brand-800 ring-1 ring-brand-100 sm:left-2.5 sm:top-2.5 sm:rounded-md sm:px-2 sm:py-0.5 sm:text-[10px]">
          {item.pill}
        </span>
      )}
    </div>
  );

  const body = dense ? (
    <div className={`flex flex-1 flex-col ${sz('p-1.5 sm:p-2.5', 'p-2.5')}`}>
      <h3 className={`line-clamp-2 font-bold leading-tight sm:line-clamp-1 sm:leading-snug ${red ? 'text-red-700' : 'text-ink-900'} ${sz('text-[10.5px] sm:text-[12px]', 'text-[12px]')}`}>
        {item.name}
      </h3>
      <span className={`mt-0.5 hidden text-[10px] font-semibold leading-none sm:block ${red ? 'text-red-400' : 'text-ink-400'}`}>
        {item.en}
      </span>
      <div className="mt-auto flex pt-1.5 sm:pt-2">
        {item.dial ? (
          <span className="inline-flex w-full items-center justify-center gap-0.5 rounded-md bg-accent-400 px-1 py-1 text-[9.5px] font-bold text-brand-900 transition-colors duration-300 group-hover:bg-accent-500 sm:gap-1 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[10px]">
            <PhoneCall className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3" />
            {item.cta}
            {item.number ? (
              <>
                <span className="hidden sm:inline"> {item.number}</span>
                <span className="sm:hidden"> {item.number?.replace(/\D/g, '').slice(-3)}</span>
              </>
            ) : null}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold transition-colors duration-300 sm:gap-1 sm:text-[11px] ${red ? 'text-red-600 group-hover:text-red-700' : 'text-brand-700 group-hover:text-brand-800'}`}>
            {item.cta}
            <ArrowRight className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3 sm:w-3" />
          </span>
        )}
      </div>
    </div>
  ) : compact ? (
    <div className={`flex flex-1 flex-col ${sz('p-1.5 sm:p-3', 'p-3')}`}>
      <h3 className={`line-clamp-2 font-bold leading-tight sm:line-clamp-1 sm:leading-snug ${red ? 'text-red-700' : 'text-ink-900'} ${sz('text-[10.5px] sm:text-[13px]', 'text-[13px]')}`}>
        {item.name}
      </h3>
      <p className={`mt-0.5 hidden text-[11px] leading-relaxed sm:mt-1 sm:line-clamp-2 sm:block ${red ? 'text-red-500/80' : 'text-ink-500'}`}>{item.text}</p>
      <div className="mt-auto flex pt-1.5 sm:pt-2">
        {item.dial ? (
          <span className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-accent-400 px-1.5 py-1 text-[9.5px] font-bold text-brand-900 transition-colors duration-300 group-hover:bg-accent-500 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-[11px]">
            <PhoneCall className="h-2.5 w-2.5 shrink-0 sm:h-3.5 sm:w-3.5" />
            {item.cta}
            {item.number ? (
              <>
                <span className="hidden sm:inline"> {item.number}</span>
                <span className="sm:hidden"> {item.number?.replace(/\D/g, '').slice(-3)}</span>
              </>
            ) : null}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold transition-colors duration-300 sm:gap-1 sm:text-xs ${red ? 'text-red-600 group-hover:text-red-700' : 'text-brand-700 group-hover:text-brand-800'}`}>
            {item.cta}
            <ArrowRight className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
          </span>
        )}
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col p-4 sm:p-5">
      <h3 className={`line-clamp-2 text-[15px] font-bold leading-snug ${red ? 'text-red-700' : 'text-ink-900'}`}>
        {item.name}
      </h3>
      {item.en && (
        <span className={`mt-1 text-[11px] font-bold uppercase tracking-[0.14em] ${red ? 'text-red-600' : 'text-brand-600'}`}>
          {item.en}
        </span>
      )}
      <p className={`mt-1.5 line-clamp-2 text-[13px] leading-relaxed ${red ? 'text-red-500/80' : 'text-ink-500'}`}>{item.text}</p>

      {item.chips && item.chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.chips.map((c) => (
            <span
              key={c}
              className={`rounded-md border px-2 py-1 text-[11px] font-medium ${red ? 'border-red-200 bg-red-50 text-red-700' : 'border-brand-100 bg-mist-50 text-ink-700'}`}
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex pt-4">
        {item.dial ? (
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-400 px-3 py-2.5 text-[13px] font-bold text-brand-900 transition-colors duration-300 group-hover:bg-accent-500">
            <PhoneCall className="h-4 w-4" />
            {item.cta}
            {item.number ? ` ${item.number}` : ''}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 text-sm font-bold transition-colors duration-300 ${red ? 'text-red-600 group-hover:text-red-700' : 'text-brand-700 group-hover:text-brand-800'}`}>
            {item.cta}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  if (item.dial) {
    return (
      <a href={item.dial} className={cardClass}>
        {media}
        {body}
      </a>
    );
  }
  return (
    <Link href={item.href ?? '/services'} className={cardClass}>
      {media}
      {body}
    </Link>
  );
}