import { MessageCircleQuestion, Clock, ShieldCheck } from 'lucide-react';
import { DARK_FOCUS } from '@/components/about/AboutSectionBits';
import { SITE_CONTACT } from '@/lib/site-contact';

/**
 * ContactHero — the opening of the page.
 *
 * Deep-forest surface (the same anchor the About hero uses) with a single calm
 * statement, three quiet reassurance markers, and one real next step. The
 * staggered `mms-fade-up` rise is the site's existing entrance utility, so it
 * already respects reduced-motion.
 */
export default function ContactHero() {
  return (
    <section
      aria-labelledby="contact-hero-heading"
      className="relative overflow-hidden bg-brand-950 text-brand-100"
    >
      {/* Faint locality mark — the same restrained device as AboutHero, kept
          decorative and desktop-only so the phone heading stays uncluttered. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-20 hidden h-[26rem] w-[26rem] text-brand-800/60 lg:block"
      >
        <MessageCircleQuestion className="h-full w-full" strokeWidth={0.4} />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12 lg:px-8 lg:pb-16 lg:pt-16">
        <p className="mms-fade-up inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-900 px-3 py-1.5 text-[11px] font-bold text-accent-300 sm:text-xs">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          যোগাযোগ
        </p>

        <h1
          id="contact-hero-heading"
          className="mms-fade-up mt-4 max-w-3xl text-[1.75rem] font-extrabold leading-[1.25] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]"
          style={{ animationDelay: '80ms' }}
        >
          আমাদের সাথে যোগাযোগ করুন
        </h1>

        <p
          className="mms-fade-up mt-4 max-w-2xl text-[15px] leading-relaxed text-brand-100/85 sm:text-base"
          style={{ animationDelay: '160ms' }}
        >
          আপনার কোনো প্রশ্ন, পরামর্শ, সমস্যা বা সহযোগিতার প্রয়োজন হলে আমাদের সাথে
          যোগাযোগ করুন। Mymensingh Sheba-এর সাথে আপনার কথা আমাদের জন্য
          গুরুত্বপূর্ণ।
        </p>

        {/* Reassurance markers — factual, sourced from SITE_CONTACT rather than
            invented, so nothing here over-promises. */}
        <ul
          className="mms-fade-up mt-7 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-brand-800 pt-5"
          style={{ animationDelay: '240ms' }}
        >
          <li className="flex items-center gap-2 text-xs font-medium text-brand-200/90 sm:text-[13px]">
            <Clock className="h-3.5 w-3.5 shrink-0 text-accent-400" aria-hidden="true" />
            {SITE_CONTACT.hoursBn}
          </li>
          <li className="flex items-center gap-2 text-xs font-medium text-brand-200/90 sm:text-[13px]">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent-400" aria-hidden="true" />
            {SITE_CONTACT.serviceAreaBn}
          </li>
          <li className="flex items-center gap-2 text-xs font-medium text-brand-200/90 sm:text-[13px]">
            <MessageCircleQuestion className="h-3.5 w-3.5 shrink-0 text-accent-400" aria-hidden="true" />
            নিবন্ধন ছাড়াই বার্তা পাঠানো যায়
          </li>
        </ul>

        <div
          className="mms-fade-up mt-6"
          style={{ animationDelay: '320ms' }}
        >
          <a
            href="#contact-form"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-5 text-sm font-extrabold text-brand-950 transition-colors hover:bg-accent-300 sm:w-auto ${DARK_FOCUS}`}
          >
            বার্তা পাঠান
          </a>
        </div>
      </div>
    </section>
  );
}
