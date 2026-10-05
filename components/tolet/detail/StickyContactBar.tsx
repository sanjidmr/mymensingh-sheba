'use client';

import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import type { ToletEventSource, ToletListing } from '@/lib/tolet-types';
import { useListingContact } from '@/components/tolet/detail/ContactActions';

/**
 * StickyContactBar — the mobile action bar for a listing detail page.
 *
 * How it coexists with the site bottom navigation
 * -----------------------------------------------
 * The global bottom nav (`components/home/MobileBottomNav.tsx`) is `fixed` at
 * `bottom-0`, is `--mms-bottom-nav-h` (3.5rem) tall, and hides itself at
 * `lg`. This bar therefore does NOT try to sit at the bottom of the viewport —
 * that slot is already taken and fighting over it produces the classic
 * two-bars-overlapping-a-button mess.
 *
 * Instead it is a floating pill anchored `bottom-0` with a bottom margin equal
 * to the nav's height token:
 *
 *     bottom margin = var(--mms-bottom-nav-h) + gap
 *
 * Because the margin references the SAME `--mms-bottom-nav-h` token that
 * `globals.css` uses to reserve space for the nav, the two can never drift
 * apart if one of them is resized. It is `lg:hidden` to match the nav's own
 * breakpoint, so desktop shows only the sidebar panel.
 *
 * Space at the end of the page is reserved by `<StickyContactBarSpacer />`
 * rather than by padding the body, so the reservation is scoped to the pages
 * that actually render the bar.
 *
 * The buttons reuse `ContactButton`, so the sticky bar and the desktop sidebar
 * are guaranteed to be the same actions, the same colours and the same hit
 * areas — only the layout differs.
 */
export function StickyContactBar({
  listing,
  userId,
  onRequestFallback,
}: {
  listing: ToletListing;
  userId?: string | null;
  onRequestFallback?: () => void;
}) {
  const source: ToletEventSource = 'sticky_bar';
  const contact = useListingContact({
    listing,
    userId,
    source,
    onRequestFallback,
  });

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
      style={{
        // Sits directly on top of the site bottom nav, never on top of it.
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom) + var(--mms-bottom-nav-h))',
      }}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-lg gap-2 rounded-xl border border-brand-200 bg-white p-1.5 shadow-[0_4px_16px_rgba(7,39,31,0.10)]">
        <StickyAction
          icon={MessageCircle}
          label={contact.whatsappLabelBn}
          href={contact.whatsappHref}
          onClick={contact.onWhatsApp}
          tone="whatsapp"
        />
        <StickyAction
          icon={Phone}
          label={contact.callLabelBn}
          href={contact.telHref}
          onClick={contact.onCall}
          tone="call"
        />
      </div>
    </div>
  );
}

/**
 * Reserve the vertical space the floating bar occupies, so the last thing on the
 * page (the similar-properties rail, the safety note) is never trapped
 * underneath it.
 *
 * `globals.css` already pads the BODY by the bottom-nav height, so this spacer
 * only has to cover the bar's own height plus its gap above the nav
 * (~3.6rem + 0.5rem). It is `lg:hidden`, matching the bar, so desktop spacing is
 * untouched.
 */
export function StickyContactBarSpacer() {
  return <div aria-hidden="true" className="h-[4.25rem] lg:hidden" />;
}

function StickyAction({
  icon: Icon,
  label,
  href,
  onClick,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  tone: 'whatsapp' | 'call';
}) {
  const toneClass =
    tone === 'whatsapp'
      ? 'bg-[#1F8A4C] hover:bg-[#1a7542]'
      : 'bg-brand-700 hover:bg-brand-800';

  const classes = `inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-extrabold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${toneClass}`;

  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </>
  );

  if (href) {
    const isExternal = href.startsWith('http');
    return (
      <a
        href={href}
        onClick={onClick}
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}