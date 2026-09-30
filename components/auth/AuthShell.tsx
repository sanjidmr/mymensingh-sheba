import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export interface AuthShellProps {
  /** Short line above the title. */
  eyebrow?: string;
  title: string;
  subtitle: string;
  /** Small friendly supporting sentence. */
  supporting?: string;
  /** Heading of the form surface, e.g. "লগইন করুন". */
  formLabel: string;
  /** The form itself. */
  children: React.ReactNode;
  /** Row under the form, e.g. the register/login switch. */
  after?: React.ReactNode;
}

/**
 * AuthShell — the single layout for /login and /register.
 *
 * The alignment bug this replaces: the heading lived in a centred
 * `max-w-2xl` wrapper while the form was a `max-w-md` *block* inside it, so
 * the heading sat in the middle and the form drifted to the left edge.
 *
 * The fix is structural rather than cosmetic — the card, heading and fields
 * are now the same element with one padding scale, so they cannot drift apart.
 * One centred column at every width; the navbar above carries the branding.
 */
export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  supporting,
  formLabel,
  children,
  after,
}: AuthShellProps) {
  return (
    <main className="flex-1 bg-mist-50 px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-10">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
        {/* Form column */}
        <div className="px-5 py-8 sm:px-10 sm:py-10">
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-[15px] font-semibold leading-snug text-ink-700">
            {subtitle}
          </p>
          {supporting && (
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">
              {supporting}
            </p>
          )}

          <div className="mt-7 flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-ink-900">{formLabel}</h2>
            <span className="h-px flex-1 bg-brand-100" aria-hidden="true" />
          </div>

          <div className="mt-5">{children}</div>

          {after && <div className="mt-7 border-t border-brand-100 pt-6">{after}</div>}

          {/* Trust line, kept on every width now that there is no side panel. */}
          <p className="mt-8 flex items-start gap-2 text-[11.5px] leading-relaxed text-ink-400">
            <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            <span>আপনার তথ্য সুরক্ষিত রাখা হয় এবং কখনো তৃতীয় পক্ষের সাথে ভাগ করা হয় না।</span>
          </p>
        </div>
      </div>
    </main>
  );
}

/** Switch row shared by both pages, e.g. "অ্যাকাউন্ট নেই? রেজিস্ট্রেশন করুন". */
export function AuthSwitch({
  question,
  actionLabel,
  href,
}: {
  question: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <p className="text-[13.5px] text-ink-500">
      {question}{' '}
      <Link
        href={href}
        className={`inline-flex items-center gap-1 rounded font-bold text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-800 ${LIGHT_FOCUS}`}
      >
        {actionLabel}
      </Link>
    </p>
  );
}
