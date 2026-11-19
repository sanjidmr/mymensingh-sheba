'use client';

/** Direct contact for approved marketplace listings; numbers come only from the public-contact RPC. */

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
import { trackCtaClick } from '@/lib/site-analytics';
import { resolveBangladeshContact } from '@/lib/bangladesh-phone';
import type { CommunityPost } from '@/lib/catalog-types';

type Contact = {
  authorName?: string;
  phone?: string;
  whatsappNumber?: string;
} | null;

type Phase = 'idle' | 'loading' | 'ready' | 'none';

interface SellerCardProps {
  post: CommunityPost;
  contact: Contact;
  phase: Phase;
  isAuthor: boolean;
}

export function SellerCard({
  post,
  contact,
  phase,
  isAuthor,
}: SellerCardProps) {
  const { callHref, whatsappHref: whatsappUrl } = resolveBangladeshContact(
    contact?.phone,
    contact?.whatsappNumber
  );
  const sellerName = contact?.authorName || post.authorName;

  const trackContact = (ctaType: 'call' | 'whatsapp') => {
    trackCtaClick({
      ctaType,
      category: 'buy_sell',
      contentId: post.slug,
      routeKind: 'post',
    });
  };

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
      ) : callHref || whatsappUrl ? (
        <>
          {callHref && (
              <a
                href={callHref}
                onClick={() => trackContact('call')}
                className={`mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
            >
                <Phone className="h-4 w-4" aria-hidden="true" />
                কল করুন
              </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact('whatsapp')}
              className={`mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 text-[12.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
              >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp-এ মেসেজ দিন
            </a>
          )}
          <p className="mt-2 text-center text-[11px] text-ink-400">
            পণ্য হাতে পেয়ে যাচাই করে তবেই টাকা পরিশোধ করুন।
          </p>
        </>
      ) : (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-600">
          বিক্রেতা এখনো যোগাযোগের নম্বর দেননি।
        </p>
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