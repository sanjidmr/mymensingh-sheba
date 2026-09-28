import Link from 'next/link';
import { ArrowRight, MessageCircle, PenSquare, Search } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel, LIGHT_FOCUS } from './AboutSectionBits';

/**
 * AboutFinalCta — the closing moment. Three clear actions, not just one:
 * find a service, post your own service, or simply reach us.
 */
export default function AboutFinalCta() {
  return (
    <AboutSection labelledBy="about-cta-heading" className="bg-mist-50">
      <Reveal className="mx-auto max-w-4xl rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="flex justify-center">
          <SectionLabel>শেষ কথা</SectionLabel>
        </div>
        <h2
          id="about-cta-heading"
          className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
        >
          আপনার প্রয়োজনের সেবা খুঁজছেন?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
          আপনার প্রয়োজন অনুযায়ী সেবা খুঁজে নিন, অথবা আপনার নিজের সেবা
          Mymensingh-এর মানুষের কাছে পৌঁছে দিন।
        </p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/services"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            সেবা খুঁজুন
          </Link>
          <Link
            href="/register"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-brand-300 px-5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-100/60 sm:w-auto ${LIGHT_FOCUS}`}
          >
            <PenSquare className="h-4 w-4" aria-hidden="true" />
            আপনার সেবা পোস্ট করুন
          </Link>
          <Link
            href="/contact"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-ink-700 transition-colors hover:bg-mist-100 sm:w-auto ${LIGHT_FOCUS}`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            যোগাযোগ করুন
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </AboutSection>
  );
}
