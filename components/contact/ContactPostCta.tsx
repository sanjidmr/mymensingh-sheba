import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, PenSquare, MessageCircle } from 'lucide-react';
import { AboutSection, DARK_FOCUS } from '@/components/about/AboutSectionBits';
import Reveal from '@/components/home/Reveal';

/**
 * ContactPostCta — "reach the people of Mymensingh with your service".
 *
 * Deliberately NOT the About page's closing CTA: that one is a white, centred,
 * evenly-balanced card on mist-50. This is a full-bleed forest band with the
 * copy pushed to the left and a real Mymensingh photograph on the right, so the
 * two pages never look like the same block in a different colour. The bronze
 * rule and the gold accent keep it inside the site palette.
 */
export default function ContactPostCta() {
  return (
    <AboutSection labelledBy="contact-post-heading" className="bg-white">
      <Reveal className="relative overflow-hidden rounded-2xl bg-brand-950">
        {/* Local photograph, right side on desktop and a quiet band behind the
            copy on phones. `object-position` keeps the skyline in frame. */}
        <div aria-hidden="true" className="absolute inset-0">
          <Image
            src="/mymensingh.jpg"
            alt=""
            fill
            sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-cover object-center opacity-40 lg:opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/95 to-brand-950/45 lg:via-brand-950/80" />
          <div className="absolute inset-0 bg-brand-950/35 lg:bg-transparent" />
        </div>

        <div className="relative max-w-2xl p-6 sm:p-10 lg:p-12">
          <p className="flex items-center gap-2.5 text-xs font-bold text-accent-300 sm:text-[13px]">
            <span aria-hidden="true" className="h-1 w-7 shrink-0 rounded-full bg-accent-400" />
            সেবা প্রদানকারীদের জন্য
          </p>

          <h2
            id="contact-post-heading"
            className="mt-3.5 text-[1.4rem] font-extrabold leading-snug tracking-tight text-white sm:text-3xl lg:text-[2rem]"
          >
            আপনি কি নিজের সেবা ময়মনসিংহের মানুষের কাছে পৌঁছে দিতে চান?
          </h2>

          {/* Bronze rule — a small editorial marker, not a divider treatment
              used anywhere else on the site. */}
          <span
            aria-hidden="true"
            className="mt-5 block h-px w-16 bg-bronze-400/70"
          />

          <p className="mt-5 text-[15px] leading-relaxed text-brand-100/85">
            আপনি যদি কোনো service দেন, শিক্ষক হন, blood donor হন, business চালান
            বা প্রয়োজনীয় কোনো service offer করেন — Mymensingh Sheba-তে আপনার
            service সম্পর্কে জানান।
          </p>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-5 text-sm font-extrabold text-brand-950 transition-colors hover:bg-accent-300 sm:w-auto ${DARK_FOCUS}`}
            >
              <PenSquare className="h-4 w-4" aria-hidden="true" />
              আপনার সেবা পোস্ট করুন
            </Link>
            <Link
              href="#contact-form"
              className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-brand-600 bg-white/[0.04] px-5 text-sm font-bold text-white transition-colors hover:border-brand-400 hover:bg-brand-800 sm:w-auto ${DARK_FOCUS}`}
            >
              আমাদের সাথে যোগাযোগ করুন
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-200/70">
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            প্রোফাইল তৈরির পর আমাদের টিম যাচাই করে প্রকাশ করে দেয়।
          </p>
        </div>
      </Reveal>
    </AboutSection>
  );
}
