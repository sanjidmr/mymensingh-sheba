'use client';

import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import type { ToletEventSource, ToletListing } from '@/lib/tolet-types';
import { useListingContact } from '@/components/tolet/detail/ContactActions';

/**
 * StickyContactBar — the mobile action bar for a listing detail page.
 *
 * The mobile action pill sits above the device safe area and is hidden on
 * desktop, where the page's contact panel is available.
 *
 * Space at the end of the page is reserved by `<StickyContactBarSpacer />`
 * rather than by padding the body, so the reservation is scoped to the pages
 * that actually render the bar.
 *
 * The bar appears only for signed-in visitors; guests see no phone or WhatsApp
 * action. The buttons reuse `ContactButton`, so desktop and mobile actions stay
 * consistent.
 */
export function StickyContactBar({
  listing,
  userId,
  isLoggedIn,
}: {
  listing: ToletListing;
  userId?: string | null;
  isLoggedIn: boolean;
}) {
  const source: ToletEventSource = 'sticky_bar';
  const contact = useListingContact({
    listing,
    userId,
    source,
  });

  // Contact links are available only to signed-in users.
  if (!isLoggedIn || contact.mode === 'unavailable') {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[3.5rem] z-40 px-3 lg:hidden"
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
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
 * It is `lg:hidden`, matching the bar, so desktop spacing is untouched.
 */
export function StickyContactBarSpacer({ isLoggedIn }: { isLoggedIn: boolean }) {
  if (!isLoggedIn) return null;
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