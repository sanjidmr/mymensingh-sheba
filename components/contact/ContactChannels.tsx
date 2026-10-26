'use client';

import Link from 'next/link';
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Facebook,
} from 'lucide-react';
import { SITE_CONTACT, CONTACT_FORM_ANCHOR } from '@/lib/site-contact';
import type { mergeSiteContact } from '@/lib/site-content';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';

type ChannelState = 'ready' | 'pending';

interface Channel {
  id: string;
  icon: typeof Phone;
  title: string;
  /** One line on what this channel is for. */
  description: string;
  /** `ready` = a real, working destination. `pending` = not published yet. */
  state: ChannelState;
  /** Value to show — a number, an address, or an honest "not yet" sentence. */
  detail: string;
  actionLabel: string;
  /** External/absolute destination, when the channel is live. */
  href?: string;
  /** In-page fallback so a pending channel still leads somewhere useful. */
  fallbackHref?: string;
}

/**
 * ContactChannels — the four primary ways to reach Mymensingh Sheba.
 *
 * Built from `SITE_CONTACT` so it can never drift from the site's published
 * details. A channel that has no real value yet renders as a clearly-labelled
 * "not published yet" state whose action still works — it sends the visitor to
 * the message form — instead of a dead `tel:` link or an invented number.
 */
export default function ContactChannels({
  contact,
}: {
  contact: ReturnType<typeof mergeSiteContact>;
}) {
  const { user, isLoading } = useAuth();
  const messenger = contact.socials.find((s) => s.icon === 'messenger');
  const facebook = contact.socials.find((s) => s.icon === 'facebook');

  if (isLoading || !user) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
          যোগাযোগের উপায়
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          ফোন, চ্যাট বা বার্তা পাঠাতে লগইন করুন। জরুরি সেবার নম্বরগুলো আলাদা জরুরি সেবা পাতায় পাবেন।
        </p>
        {!isLoading && (
          <Link
            href={`/login?next=${encodeURIComponent('/contact')}`}
            className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-bold text-white ${LIGHT_FOCUS}`}
          >
            লগইন করুন
          </Link>
        )}
      </div>
    );
  }

  const channels: Channel[] = [
    {
      id: 'phone',
      icon: Phone,
      title: 'ফোন করুন',
      description: 'জরুরি প্রয়োজনে সরাসরি কথা বলতে চাইলে।',
      state: contact.phone ? 'ready' : 'pending',
      detail: contact.phone ?? SITE_CONTACT.phonePendingBn,
      actionLabel: contact.phone ? 'কল করুন' : 'বার্তা লিখুন',
      href: contact.phone ? `tel:${contact.phone}` : undefined,
      fallbackHref: `#${CONTACT_FORM_ANCHOR}`,
    },
    {
      id: 'messenger',
      icon: MessageCircle,
      title: 'WhatsApp / Messenger',
      description: 'দ্রুত চ্যাটে জিজ্ঞাসা বা ছবি পাঠাতে সুবিধাজনক।',
      state: messenger?.href ? 'ready' : 'pending',
      detail: messenger?.href
        ? 'এখান থেকেই সরাসরি বার্তা পাঠান।'
        : 'এই চ্যানেলটি এখনো প্রকাশ করা হয়নি।',
      actionLabel: messenger?.href ? 'চ্যাট করুন' : 'বার্তা লিখুন',
      href: messenger?.href ?? undefined,
      fallbackHref: `#${CONTACT_FORM_ANCHOR}`,
    },
    {
      id: 'email',
      icon: Mail,
      title: 'ইমেইল করুন',
      description: 'বিস্তারিত লিখে বা সংযুক্তি দিয়ে পাঠাতে সুবিধা।',
      state: 'ready',
      detail: contact.email,
      actionLabel: 'ইমেইল খুলুন',
      href: `mailto:${contact.email}`,
    },
    {
      id: 'location',
      icon: MapPin,
      title: 'আমাদের অবস্থান',
      description: 'যেখান থেকে আমরা কাজ করি।',
      state: contact.officeAddress ? 'ready' : 'pending',
      detail: contact.officeAddress ?? SITE_CONTACT.officeAddressPendingBn,
      actionLabel: 'ম্যাপে দেখুন',
      href: SITE_CONTACT.serviceAreaMapUrl,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
        সরাসরি যোগাযোগের উপায়
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
        যেটি আপনার সুবিধা — ফোন, চ্যাট বা ইমেইল। সবগুলোতে আমাদের একই টিম
        আপনার বার্তা পাবে।
      </p>

      <ul className="mt-5 space-y-2.5 max-sm:mt-3 max-sm:space-y-2">
        {channels.map((channel) => {
          const Icon = channel.icon;
          const pending = channel.state === 'pending';
          // A live channel links out; a pending one falls back to the form so
          // the button is never dead.
          const href = channel.href ?? channel.fallbackHref;
          const external = Boolean(channel.href && channel.href.startsWith('http'));

          return (
            <li key={channel.id}>
              {href ? (
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={`group flex min-h-[76px] w-full items-center gap-3.5 rounded-xl border bg-white p-3.5 text-left transition-all duration-200 hover:border-brand-300 hover:shadow-sm max-sm:min-h-16 max-sm:gap-2.5 max-sm:p-2.5 sm:p-4 ${LIGHT_FOCUS} ${
                    pending ? 'border-dashed border-brand-200' : 'border-brand-100'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors max-sm:h-9 max-sm:w-9 ${
                      pending
                        ? 'bg-mist-100 text-ink-400'
                        : 'bg-brand-50 text-brand-700 group-hover:bg-brand-700 group-hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">
                        {channel.title}
                      </span>
                      {pending && (
                        <span className="rounded bg-mist-100 px-1.5 py-px text-[10px] font-bold text-ink-500">
                          এখনো প্রকাশিত হয়নি
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-500 max-sm:text-xs">
                      {channel.description}
                    </span>
                    <span
                      className={`mt-1 block text-[12.5px] font-semibold max-sm:text-[11px] ${
                        pending ? 'text-ink-400' : 'text-brand-700'
                      }`}
                    >
                      {channel.detail}
                    </span>
                  </span>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold transition-colors max-sm:text-[10px] ${
                      pending
                        ? 'text-ink-500 group-hover:text-ink-700'
                        : 'text-brand-700 group-hover:text-brand-800'
                    }`}
                  >
                    {channel.actionLabel}
                  </span>
                </a>
              ) : (
                <div className="flex min-h-[76px] items-center gap-3.5 rounded-xl border border-dashed border-brand-200 bg-white p-3.5 sm:p-4">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mist-100 text-ink-400"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-ink-900">
                      {channel.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-500">
                      {channel.description}
                    </span>
                    <span className="mt-1 block text-[12.5px] font-semibold text-ink-400">
                      {channel.detail}
                    </span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Social presence — honest about unlinked channels. */}
      <div className="mt-4 flex items-center gap-2.5">
        <Link
          href={facebook?.href ?? `/contact#${CONTACT_FORM_ANCHOR}`}
          aria-label="Facebook পেজ"
          className={`flex h-10 w-10 items-center justify-center rounded-lg border border-brand-100 bg-white text-ink-400 transition-colors hover:border-brand-300 hover:text-brand-700 ${LIGHT_FOCUS}`}
        >
          <Facebook className="h-4 w-4" />
        </Link>
        <p className="text-[12px] leading-snug text-ink-400">
          সোশ্যাল চ্যানেলগুলো এখনো প্রকাশ করা হয়নি — তৎক্ষণের জন্য বার্তা ফর্মটি
          ব্যবহার করুন।
        </p>
      </div>
    </div>
  );
}
