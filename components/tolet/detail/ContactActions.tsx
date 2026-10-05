'use client';

import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, Lock, Check } from 'lucide-react';
import type { ToletEventSource, ToletListing } from '@/lib/tolet-types';
import { trackToletEvent } from '@/lib/tolet-tracking';
import { getAreaById } from '@/lib/locations';
import { cn } from '@/lib/utils';

/**
 * Contact actions for a listing: WhatsApp + direct call.
 *
 * Two contact modes
 * -----------------
 * `direct`  — the owner has published a phone number. The buttons open WhatsApp
 *             with the listing pre-filled as the message, or the phone dialer.
 *             This is the normal case for a live listing.
 * `request` — no phone is published (the default for a listing whose owner has
 *             not released their number, and for every showcase listing, which
 *             have no real person behind them at all). The buttons become the
 *             entry point to the tracked request form instead of a dead or
 *             invented number.
 *
 * Falling back to `request` rather than hiding the buttons (or, worse,
 * rendering a made-up number) is deliberate: a tenant always gets a working
 * next step, and a demo listing can never send a real phone call somewhere.
 *
 * Tracking contract
 * -----------------
 * Both buttons record a press BEFORE the navigation starts. `call_click` is a
 * button press, not a completed call — the platform has no telephony
 * integration and cannot know whether anyone dialled or was answered. The
 * analytics wording in `TOLET_EVENT_TYPE_INFO` reflects that, and any
 * admin-facing surface must reuse it rather than inventing "কল হয়েছে".
 *
 * Tracking is fire-and-forget and must never delay the tap, so it is not
 * awaited; the link navigates in parallel.
 */
export interface ContactHandlers {
  mode: 'direct' | 'request';
  /** Populated in `direct` mode; undefined otherwise. */
  whatsappHref?: string;
  telHref?: string;
  whatsappLabelBn: string;
  callLabelBn: string;
  onWhatsApp: () => void;
  onCall: () => void;
}

/** Normalises a Bangladeshi phone number to E.164 for `tel:` / `wa.me`. */
export function normalizeBdPhone(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return null;
  // 01XXXXXXXXX (11 digits, local) -> +8801XXXXXXXXX
  if (/^01\d{9}$/.test(digits)) return `+880${digits.slice(1)}`;
  if (/^8801\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\+8801\d{9}$/.test(digits)) return digits;
  if (/^880\d{9,10}$/.test(digits)) return `+${digits}`;
  if (/^\+?880\d{9,10}$/.test(digits)) return digits.startsWith('+') ? digits : `+${digits}`;
  // International numbers that are not Bangladeshi are passed through as-is.
  if (digits.startsWith('+') && digits.length >= 9) return digits;
  return null;
}

/** Pre-fills the WhatsApp composer so the tenant does not retype the listing. */
export function buildWhatsAppHref(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164.replace('+', '')}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppMessage(listing: ToletListing): string {
  const area = getAreaById(listing.areaId);
  return [
    `আসসালামু আলাইকুম। আমি Mymensingh Sheba থেকে "${listing.title}" বিজ্ঞাপনটি দেখেছি।`,
    `এলাকা: ${area?.nameBn ?? listing.areaId}`,
    `বিস্তারিত জানতে এবং বাসা দেখার সময় নিতে চাই।`,
  ].join('\n');
}

export function useListingContact({
  listing,
  userId,
  source,
  onRequestFallback,
}: {
  listing: ToletListing;
  userId?: string | null;
  source: ToletEventSource;
  /** Invoked in `request` mode instead of a tel:/wa.me navigation. */
  onRequestFallback?: () => void;
}): ContactHandlers {
  const phone = useMemo(
    () => (listing.ownerPhone ? normalizeBdPhone(listing.ownerPhone) : null),
    [listing.ownerPhone]
  );

  const track = useCallback(
    (eventType: 'call_click' | 'whatsapp_click') => {
      void trackToletEvent({
        listingId: listing.id,
        eventType,
        source,
        userId: userId ?? null,
        areaId: listing.areaId,
        propertyType: listing.propertyType,
        rentPrice: listing.rentPrice,
      });
    },
    [listing, source, userId]
  );

  if (!phone) {
    return {
      mode: 'request',
      whatsappLabelBn: 'বার্তা পাঠান',
      callLabelBn: 'যোগাযোগের অনুরোধ',
      onWhatsApp: () => {
        track('whatsapp_click');
        onRequestFallback?.();
      },
      onCall: () => {
        track('call_click');
        onRequestFallback?.();
      },
    };
  }

  const message = buildWhatsAppMessage(listing);
  return {
    mode: 'direct',
    whatsappHref: buildWhatsAppHref(phone, message),
    telHref: `tel:${phone}`,
    whatsappLabelBn: 'হোয়াটসঅ্যাপ',
    callLabelBn: 'কল করুন',
    onWhatsApp: () => track('whatsapp_click'),
    onCall: () => track('call_click'),
  };
}

interface ContactButtonProps {
  href?: string;
  onClick?: () => void;
  icon: React.ElementType;
  label: string;
  tone: 'whatsapp' | 'call';
  className?: string;
}

/**
 * The button itself. One component so the sidebar panel and the sticky mobile
 * bar can never drift apart in colour, size or hit area.
 *
 * WhatsApp is green (the colour users expect from the app), call is the brand
 * forest green. Both are solid fills with white text because on a phone these
 * are the two actions the entire page exists to produce, and a tenant should
 * never have to look for them.
 */
function ContactButton({
  href,
  onClick,
  icon: Icon,
  label,
  tone,
  className,
}: ContactButtonProps) {
  const base =
    'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
  const toneClass =
    tone === 'whatsapp'
      ? 'bg-[#1F8A4C] text-white hover:bg-[#1a7542] focus-visible:ring-[#1F8A4C]'
      : 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-700';

  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </>
  );

  const classes = cn(base, toneClass, className);

  if (href) {
    const isExternal = href.startsWith('http');
    return (
      <a
        href={href}
        onClick={onClick}
        {...(isExternal
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : {})}
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

/**
 * ContactActionsPanel — the sidebar contact block on the detail page.
 *
 * Explains the contact route before offering the buttons, because on a listing
 * whose owner has not released their number the buttons are a REQUEST, not a
 * call — and a tenant who assumes otherwise will be confused when no dialer
 * opens. Being explicit about that is worth one short line.
 */
export function ContactActionsPanel({
  listing,
  userId,
  isLoggedIn,
  onRequestFallback,
}: {
  listing: ToletListing;
  userId?: string | null;
  isLoggedIn: boolean;
  onRequestFallback?: () => void;
}) {
  const contact = useListingContact({
    listing,
    userId,
    source: 'detail_page',
    onRequestFallback,
  });

  return (
    <section
      aria-labelledby="tolet-contact-heading"
      className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5"
    >
      <h2
        id="tolet-contact-heading"
        className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-900"
      >
        <span aria-hidden="true" className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent-400" />
        মালিকের সাথে যোগাযোগ
      </h2>

      <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">
        {contact.mode === 'direct'
          ? 'সরাসরি মালিকের নম্বরে কল করুন বা হোয়াটসঅ্যাপে বিজ্ঞাপনটি পাঠিয়ে দিন।'
          : isLoggedIn
            ? 'অনুরোধ পাঠালে মালিক আপনার নম্বরে সরাসরি যোগাযোগ করবেন।'
            : 'লগইন করে অনুরোধ পাঠালে মালিক আপনার নম্বরে সরাসরি যোগাযোগ করবেন।'}
      </p>

      <div className="mt-3 space-y-2">
        <ContactButton
          tone="whatsapp"
          icon={MessageCircle}
          label={contact.whatsappLabelBn}
          href={contact.whatsappHref}
          onClick={contact.onWhatsApp}
        />
        <ContactButton
          tone="call"
          icon={Phone}
          label={contact.callLabelBn}
          href={contact.telHref}
          onClick={contact.onCall}
        />
      </div>

      {contact.mode === 'request' && !isLoggedIn && (
        <Link
          href="/login"
          className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-mist-50 px-2.5 py-2 text-[11px] leading-relaxed text-ink-500 transition-colors hover:bg-mist-100"
        >
          <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
          <span>
            যোগাযোগের অনুরোধ পাঠাতে অ্যাকাউন্টে লগইন করুন। আপনার তথ্য গোপন থাকবে।
          </span>
        </Link>
      )}

      {contact.mode === 'direct' && (
        <p className="mt-2.5 flex items-start gap-1.5 px-0.5 text-[10.5px] leading-relaxed text-ink-400">
          <Check className="mt-px h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
          <span>মালিকের ফোন নম্বর এখানে প্রকাশ করা হয়েছে — অপব্যবহার এড়িয়ে চলুন।</span>
        </p>
      )}
    </section>
  );
}

export { ContactButton };

/**
 * Share button with a graceful ladder: the OS share sheet where it exists
 * (Android, iOS Safari, most installed PWAs), then `clipboard.writeText`, then
 * an inline read-only field the visitor can long-press to copy.
 *
 * The third rung is an inline field rather than a `prompt()` on purpose:
 * `window.prompt` is not implemented in several real contexts (it throws
 * outright inside cross-origin iframes, e.g. the app embedded in a WebView),
 * and on a phone a dialog asking you to copy text is worse than simply showing
 * the link. `execCommand('copy')` is the pre-permission-API fallback.
 *
 * Every step records a `share` event, but only once the link actually reached
 * the clipboard — so "shared" means the tenant got the link out of the page,
 * not merely that a sheet was opened and dismissed. If every rung fails, the
 * field is shown and NO event is recorded: the visitor has not shared yet.
 */
export function ShareButton({
  listing,
  userId,
  className,
}: {
  listing: ToletListing;
  userId?: string | null;
  className?: string;
}) {
  const [shared, setShared] = useState(false);
  /** Set when both the share sheet and the clipboard failed — reveals the link. */
  const [manualCopy, setManualCopy] = useState(false);

  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/tolet/${listing.id}` : '';

  const record = () => {
    setShared(true);
    void trackToletEvent({
      listingId: listing.id,
      eventType: 'share',
      source: 'detail_page',
      userId: userId ?? null,
      areaId: listing.areaId,
      propertyType: listing.propertyType,
      rentPrice: listing.rentPrice,
    });
    window.setTimeout(() => setShared(false), 2000);
  };

  const handleShare = async () => {
    const payload = {
      title: listing.title,
      text: `${listing.title} — Mymensingh Sheba-তে বাসা ভাড়ার বিজ্ঞাপন`,
      url: shareUrl,
    };

    // Rung 1 — the OS share sheet.
    if (navigator.share) {
      try {
        await navigator.share(payload);
        record();
        return;
      } catch {
        // Dismissed share sheet — not a share. Fall through.
      }
    }

    // Rung 2 — the async clipboard API.
    try {
      await navigator.clipboard.writeText(shareUrl);
      record();
      return;
    } catch {
      // Blocked (insecure context / permissions). Fall through.
    }

    // Rung 3 — the synchronous, pre-permission-API copy.
    try {
      const field = document.createElement('textarea');
      field.value = shareUrl;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      if (ok) {
        record();
        return;
      }
    } catch {
      // Some embedded WebViews disable execCommand entirely. Fall through.
    }

    // Rung 4 — show the link and let the visitor copy it by hand. Nothing is
    // recorded: nothing has been shared yet.
    setManualCopy(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        aria-expanded={manualCopy || undefined}
        className={cn(
          'inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[12px] font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
          className
        )}
      >
        {shared ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ShareIcon />
        )}
        {shared ? 'লিংক কপি হয়েছে' : 'শেয়ার'}
      </button>

      {/* Last rung: every copy API was unavailable. Show the link instead of
          silently doing nothing, and pre-select it so a copy is one tap. */}
      {manualCopy && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-500">
          লিংকটি কপি করতে নিচের ঘরে চাপ দিন।
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="এই বিজ্ঞাপনের লিংক"
            className="mt-1.5 w-full min-w-0 rounded-lg border border-brand-200 bg-white px-2.5 py-2 font-mono text-[11px] text-ink-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          />
        </p>
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />
    </svg>
  );
}