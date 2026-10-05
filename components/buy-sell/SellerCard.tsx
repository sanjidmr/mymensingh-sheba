'use client';

/**
 * The seller card on a marketplace item, and the only place a seller's number is
 * ever shown.
 *
 * WHY THIS IS AN RPC AND NOT A COLUMN
 * -----------------------------------
 * `community_posts` is one table behind three surfaces: news, jobs and buy-sell.
 * A marketplace buyer has to be able to call the seller — that is the whole
 * product — but the author's number on a news article or a job ad must never
 * appear, because nothing in those two workflows asks the author to publish it.
 *
 * RLS is row-level and PostgREST serves `select=*`, so "we just left the column
 * out of the SELECT list" is a habit, not a boundary. The real boundary is
 * `fetch_market_contact()`: SECURITY DEFINER, returns the contact only when the
 * row is `kind = 'buy_sell' AND status = 'approved'`, granted explicitly to
 * `anon` and `authenticated` and revoked from PUBLIC.
 *
 * So this component's contract is: it receives whatever the RPC returned, and
 * every shape below that is not a number gets its own honest explanation. There
 * are five:
 *
 *   number          → a real `tel:` link and a real WhatsApp link
 *   pending         → the seller has not approved a number; offer the request
 *   own post        → "এটি আপনার বিজ্ঞাপন" instead of a call button
 *   no account      → log in to see the contact
 *   demo item       → say so, and say the number cannot be dialled
 *
 * A demo row carries no number at all, by construction — see
 * `lib/market-demo-data.ts` — so there is nothing plausible-looking to leak.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CircleAlert,
  Loader2,
  MessageCircle,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import type { CommunityPost } from '@/lib/catalog-types';

type Contact = {
  authorName?: string;
  authorPhone?: string;
  whatsappNumber?: string;
} | null;

type Phase = 'idle' | 'loading' | 'ready' | 'none';

interface SellerCardProps {
  post: CommunityPost;
  contact: Contact;
  phase: Phase;
  isAuthor: boolean;
  signedIn: boolean;
  onRequestContact: () => void;
}

/** `tel:` needs digits only — a stored number with a +88 and spaces still dials. */
function telHref(raw: string): string {
  return `tel:${raw.replace(/[^\d+]/g, '')}`;
}

/** `wa.me` takes the number without `+`, country code intact. */
function waHref(raw: string): string {
  return `https://wa.me/${raw.replace(/[^\d]/g, '')}`;
}

export function SellerCard({
  post,
  contact,
  phase,
  isAuthor,
  signedIn,
  onRequestContact,
}: SellerCardProps) {
  const [copied, setCopied] = useState(false);
  const phone = contact?.authorPhone ?? null;
  const whatsapp = contact?.whatsappNumber ?? null;
  // Prefer the explicit WhatsApp number; fall back to the call number only when
  // the seller did not give a different one, which is what they mean when they
  // leave it blank.
  const whatsappNumber = whatsapp ?? phone;
  const sellerName = contact?.authorName || post.authorName;

  async function copyNumber() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or an insecure origin. The number is on
      // screen anyway, so there is nothing to recover from and nothing to say.
    }
  }

  return (
    <section className="rounded-2xl border border-mist-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <User className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-[13.5px] font-extrabold text-ink-900">
            {sellerName || 'বিক্রেতার নাম দেওয়া হয়নি'}
            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          </p>
          <p className="text-[11.5px] text-ink-500">বিক্রেতা · অ্যাডমিন যাচাই করা বিজ্ঞাপন</p>
        </div>
      </div>

      {post.isDemo ? (
        // A demo row has no number. Said plainly, because a reader who taps a
        // call button on a fictional listing and gets a dead line concludes the
        // whole marketplace is fake.
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-100/50 p-3 text-[12px] leading-relaxed text-accent-700">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          এটি একটি <strong className="font-bold">নমুনা বিজ্ঞাপন</strong>। বিক্রেতার
          নম্বর দেওয়া হয়নি, তাই কল করা যাবে না। প্রকৃত বিজ্ঞাপনে সরাসরি কল করা যায়।
        </p>
      ) : isAuthor ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-[12px] leading-relaxed text-brand-800">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          এটি আপনার বিজ্ঞাপন। ক্রেতাদের আগে দাম বা তথ্য বদলাতে চাইলে সম্পাদনা করুন।
        </p>
      ) : phase === 'loading' ? (
        <p className="mt-3 flex items-center gap-2 text-[12.5px] text-ink-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          বিক্রেতার যোগাযোগ দেখা হচ্ছে…
        </p>
      ) : phone ? (
        <>
          <a
            href={telHref(phone)}
            className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            বিক্রেতাকে কল করুন
          </a>

          <div className="mt-2 flex gap-2">
            {whatsappNumber && (
              <a
                href={waHref(whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 text-[12.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                হোয়াটসঅ্যাপ
              </a>
            )}
            <button
              type="button"
              onClick={copyNumber}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-mist-200 bg-white px-3 text-[12.5px] font-bold text-ink-600 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
            >
              {copied ? 'কপি হয়েছে' : 'নম্বর কপি'}
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] text-ink-400">
            শুধু পণ্য সম্পর্কে জিজ্ঞাসা করুন। অগ্রিম টাকা পাঠাবেন না।
          </p>
        </>
      ) : !signedIn ? (
        <>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-600">
            বিক্রেতার নম্বর দেখতে একটি অ্যাকাউন্টে লগইন করুন।
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/buy-sell/${post.slug}`)}`}
            className={`mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
          >
            লগইন করে নম্বর দেখুন
          </Link>
        </>
      ) : (
        // Signed in, approved, but the seller filed no number. This is the one
        // state where the page can actually do something about it: an admin can
        // call the seller and ask for one.
        <>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-600">
            এই বিক্রেতা নম্বর দেওয়া হয়নি। আপনার ফোন নম্বর অ্যাডমিনকে জানানো হবে, অ্যাডমিন
            বিক্রেতার সঙ্গে যোগাযোগ করে জানাবেন।
          </p>
          <button
            type="button"
            onClick={onRequestContact}
            className={`mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
          >
            যোগাযোগের অনুরোধ পাঠান
          </button>
        </>
      )}

      <p className="mt-3 flex items-start gap-1.5 border-t border-mist-200 pt-2.5 text-[11px] leading-relaxed text-ink-400">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        নিরাপত্তা: কোনো অগ্রিম টাকা পাঠাবেন না, পণ্য হাতে পেয়ে তবেই টাকা ছাড়ুন। কোনো
        সমস্যা হলে{' '}
        <Link href="/contact#contact-form" className="font-semibold text-brand-600">
          অ্যাডমিনকে জানান
        </Link>
        ।
      </p>
    </section>
  );
}