import Link from 'next/link';
import { ArrowRight, MessageCircle, PenSquare, Search } from 'lucide-react';
import { AboutSection, LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import Reveal from '@/components/home/Reveal';

/**
 * ContactClosing — the last thing a visitor reads.
 *
 * Warm bronze-tinted band rather than another white card or a second dark
 * block: the page already has a forest hero and a forest post-CTA, so ending on
 * bronze keeps the closing moment distinct from both. The heading is set
 * off-centre and left-aligned for the same reason.
 */
export default function ContactClosing() {
  return (
    <AboutSection labelledBy="contact-closing-heading" className="bg-mist-50">
      <Reveal className="relative overflow-hidden rounded-2xl border border-bronze-200 bg-bronze-50">
        {/* A single quiet bronze arc — warmth without a gradient wash. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-bronze-200/50"
        />

        <div className="relative max-w-3xl p-6 sm:p-10 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-bronze-600">
            শেষ কথা
          </p>

          <h2
            id="contact-closing-heading"
            className="mt-3 text-[1.5rem] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-3xl lg:text-[2.1rem]"
          >
            কথা বলতে দ্বিধা করবেন না।
          </h2>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-600 sm:text-[16px]">
            আপনার একটি প্রশ্ন, পরামর্শ কিংবা একটি ভালো idea — Mymensingh Sheba-কে
            আরও ভালো করতে সাহায্য করতে পারে।
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link
              href="/services"
              className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              সেবা খুঁজুন
            </Link>
            <Link
              href="/register"
              className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white px-5 text-sm font-bold text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-50 sm:w-auto ${LIGHT_FOCUS}`}
            >
              <PenSquare className="h-4 w-4" aria-hidden="true" />
              আপনার সেবা পোস্ট করুন
            </Link>
            <Link
              href="#contact-form"
              className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-ink-700 transition-colors hover:bg-bronze-100 sm:w-auto ${LIGHT_FOCUS}`}
            >
              যোগাযোগ করুন
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-5 flex items-center gap-1.5 text-xs text-ink-500">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-bronze-500" aria-hidden="true" />
            ফর্মটি পূরণ করতে সর্বোচ্চ এক মিনিট লাগে।
          </p>
        </div>
      </Reveal>
    </AboutSection>
  );
}
