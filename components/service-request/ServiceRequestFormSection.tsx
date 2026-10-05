import ServiceRequestFormCard from '@/components/service-request/ServiceRequestFormCard';
import { REQUEST_FORM_ANCHOR } from '@/components/service-request/ServiceRequestHero';
import type { ServiceRequestPageConfig } from '@/lib/service-request-pages';

export interface ServiceRequestFormSectionProps {
  config: ServiceRequestPageConfig;
}

/**
 * ServiceRequestFormSection — the "সেবা নিন" block.
 *
 * A thin server component: the heading and instruction live here so they are
 * static HTML, and only the form itself ships to the client.
 *
 * The `scroll-mt` on the anchor matters because the sticky-ish page has no
 * sticky header of its own, but the hero's CTA has to land the user on the
 * heading rather than in the middle of the first field group.
 */
export default function ServiceRequestFormSection({ config }: ServiceRequestFormSectionProps) {
  return (
    <section
      id={REQUEST_FORM_ANCHOR}
      aria-labelledby="service-request-heading"
      className="scroll-mt-6 bg-mist-50"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="max-w-2xl">
          <h2
            id="service-request-heading"
            className="text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-2xl"
          >
            আপনার প্রয়োজনের সেবা নিন
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
            নিচের তথ্যগুলো পূরণ করুন। আপনার প্রয়োজন অনুযায়ী সেবা দেওয়ার জন্য আমরা
            আপনার দেওয়া তথ্য ব্যবহার করব।
          </p>
        </div>

        <div className="mt-7">
          <ServiceRequestFormCard config={config} />
        </div>
      </div>
    </section>
  );
}