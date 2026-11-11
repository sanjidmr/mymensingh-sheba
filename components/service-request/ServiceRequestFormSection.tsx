import ServiceRequestFormCard from '@/components/service-request/ServiceRequestFormCard';
import { REQUEST_FORM_ANCHOR } from '@/components/service-request/ServiceRequestHero';
import type { ServiceRequestPageConfig } from '@/lib/service-request-pages';
import type { ServiceRequestSuccessData } from '@/components/service-request/SubmissionSuccess';
import { ArrowRight } from 'lucide-react';

export interface ServiceRequestFormSectionProps {
  config: ServiceRequestPageConfig;
  open: boolean;
  onOpen: () => void;
  onSubmitted: (submission: ServiceRequestSuccessData) => void;
}

/**
 * ServiceRequestFormSection — the "সেবা নিন" block.
 *
 * The action stays visible until the user chooses to open the form.
 *
 * The `scroll-mt` on the anchor matters because the sticky-ish page has no
 * sticky header of its own, but the hero's CTA has to land the user on the
 * heading rather than in the middle of the first field group.
 */
export default function ServiceRequestFormSection({
  config,
  open,
  onOpen,
  onSubmitted,
}: ServiceRequestFormSectionProps) {
  return (
    <section
      id={REQUEST_FORM_ANCHOR}
      aria-labelledby="service-request-heading"
      className={`scroll-mt-6 ${config.slug === 'kajer-bua' ? 'bg-white' : 'bg-mist-50'}`}
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
            {config.compactHero
              ? 'সমস্যা ও ঠিকানার তথ্য দিয়ে অনুরোধ পাঠান।'
              : 'নিচের তথ্যগুলো পূরণ করুন। আপনার প্রয়োজন অনুযায়ী সেবা দেওয়ার জন্য আমরা আপনার দেওয়া তথ্য ব্যবহার করব।'}
          </p>
        </div>

        <div className="mt-7">
          {open ? (
            <ServiceRequestFormCard config={config} onSubmitted={onSubmitted} />
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
            >
              অনুরোধ জমা দিন
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}