import { ArrowDown, Check, PhoneCall } from 'lucide-react';
import { DARK_FOCUS } from '@/components/about/AboutSectionBits';
import type { ServiceRequestPageConfig } from '@/lib/service-request-pages';

export interface ServiceRequestHeroProps {
  config: ServiceRequestPageConfig;
}

/** Anchor for the "সেবা নিন" button and the form section heading. */
export const REQUEST_FORM_ANCHOR = 'service-request-form';

/**
 * ServiceRequestHero — the premium service banner.
 *
 * Layout is one CSS grid that behaves differently at two breakpoints, which is
 * what keeps the mobile order honest without rendering the markup twice:
 *
 *   mobile  →  heading, photo, benefits, CTA   (single column, DOM order)
 *   desktop →  heading | photo on the right, benefits + CTA under the heading
 *
 * On desktop the photo is placed with explicit `row-start`/`col-start` and
 * spans both rows, so it fills the full height of the copy beside it. The
 * photo panel is a plain bordered surface with a thin bronze hairline — no
 * glass overlay, no gradient wash, because the site's language is warm and
 * solid rather than shiny.
 *
 * The deep-forest surface is the same anchor the About and Contact heroes use,
 * which is what makes these five pages feel like part of the same site.
 */
export default function ServiceRequestHero({ config }: ServiceRequestHeroProps) {
  return (
    <section
      aria-labelledby="service-hero-heading"
      className="relative overflow-hidden bg-brand-950 text-brand-100"
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-9 pt-8 sm:px-6 sm:pb-12 sm:pt-11 lg:px-8 lg:pb-14 lg:pt-14">
        <div className="grid gap-x-10 gap-y-7 lg:grid-cols-12 lg:gap-y-6">
          {/* Row 1, columns 1–7 — what this service is. */}
          <header className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-900 px-3 py-1.5 text-[11px] font-bold text-accent-300 sm:text-xs">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              {config.eyebrow}
            </p>

            <h1
              id="service-hero-heading"
              className="mt-4 text-[2rem] font-extrabold leading-[1.18] tracking-tight text-white sm:text-[2.75rem] lg:text-[3.25rem]"
            >
              {config.title}
            </h1>

            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-brand-100/85 sm:text-base">
              {config.description}
            </p>
          </header>

          {/* Row 1–2, columns 8–12 — the service photo. */}
          <figure className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="overflow-hidden rounded-xl border border-bronze-400/45 bg-brand-900 lg:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.image.src}
                alt={config.image.alt}
                width={720}
                height={540}
                loading="eager"
                decoding="async"
                className="aspect-[16/11] w-full object-cover lg:aspect-auto lg:h-full lg:min-h-[19rem]"
                style={{ objectPosition: config.image.position }}
              />
            </div>
          </figure>

          {/* Row 2, columns 1–7 — why it is useful, then the single next step. */}
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              {config.benefits.map((benefit) => (
                <li key={benefit.title} className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-400/15 text-accent-300"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold text-white">
                      {benefit.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-brand-200/75">
                      {benefit.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={`#${REQUEST_FORM_ANCHOR}`}
                className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-6 text-[15px] font-extrabold text-brand-950 transition-colors hover:bg-accent-300 sm:w-auto ${DARK_FOCUS}`}
              >
                <PhoneCall className="h-[18px] w-[18px]" aria-hidden="true" />
                সেবা নিন
              </a>

              <a
                href={`#${REQUEST_FORM_ANCHOR}`}
                className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 text-[13px] font-bold text-brand-200 transition-colors hover:text-white ${DARK_FOCUS} rounded-lg px-2`}
              >
                নিচে ফর্ম পূরণ করুন
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}