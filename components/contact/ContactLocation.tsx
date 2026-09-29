import Image from 'next/image';
import { ExternalLink, MapPin } from 'lucide-react';
import { AboutSection, SectionLabel } from '@/components/about/AboutSectionBits';
import { SITE_CONTACT } from '@/lib/site-contact';
import Reveal from '@/components/home/Reveal';

/**
 * ContactLocation — ties the page back to Mymensingh itself.
 *
 * Shows the real service area we can honestly stand behind. `SITE_CONTACT.officeAddress`
 * is `null` today, so instead of inventing a street address the section states
 * that plainly and links to the service area on a map — the same honesty rule
 * the rest of the contact page follows.
 */
export default function ContactLocation() {
  return (
    <AboutSection labelledBy="contact-location-heading" className="bg-white">
      <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr] lg:gap-14">
        <Reveal>
          <SectionLabel>আমাদের শহর</SectionLabel>
          <h2
            id="contact-location-heading"
            className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
          >
            আমরা ময়মনসিংহের মানুষের জন্য
          </h2>

          <p className="mt-3.5 max-w-lg text-[15px] leading-relaxed text-ink-600">
            Mymensingh Sheba শুধু একটি ওয়েবসাইট নয় — এটি ময়মনসিংহের দৈনন্দিন
            জীবনের প্রয়োজনগুলো এক জায়গায় সাজানোর একটি চেষ্টা। আমরা
            {` ${SITE_CONTACT.serviceAreaBn}`}-তে কাজ করি, অর্থাৎ শহরের যেকোনো
            প্রান্ত থেকে কেউ সেবা খুঁজতে এবং নিজের সেবা পৌঁছে দিতে পারেন।
          </p>

          <dl className="mt-6 space-y-4">
            <div className="flex gap-3">
              <dt className="sr-only">সেবার এলাকা</dt>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"
              >
                <MapPin className="h-4 w-4" />
              </span>
              <dd>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  সেবার এলাকা
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink-900">
                  {SITE_CONTACT.serviceAreaBn}
                </p>
              </dd>
            </div>

            <div className="flex gap-3">
              <dt className="sr-only">অফিসের ঠিকানা</dt>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist-100 text-ink-400"
              >
                <MapPin className="h-4 w-4" />
              </span>
              <dd>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  অফিসের ঠিকানা
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-600">
                  {SITE_CONTACT.officeAddress ?? SITE_CONTACT.officeAddressPendingBn}
                </p>
              </dd>
            </div>
          </dl>

          <a
            href={SITE_CONTACT.serviceAreaMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-mist-50 sm:w-auto"
          >
            ম্যাপে সেবার এলাকা দেখুন
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Reveal>

        {/* A genuine Mymensingh photograph rather than a decorative map stock
            image — the river is what the city is known for. */}
        <Reveal delay={90}>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-900">
            <Image
              src="/nodi.jpg"
              alt="ময়মনসিংহের ব্রহ্মপুত্র নদী"
              fill
              sizes="(max-width: 1023px) 92vw, 40vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/85 to-transparent px-4 pb-3.5 pt-10 text-xs font-medium text-brand-100/90">
              ব্রহ্মপুত্র নদী — ময়মনসিংহের পরিচয়ের কেন্দ্র
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </AboutSection>
  );
}
