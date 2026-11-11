'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceRequestHero from '@/components/service-request/ServiceRequestHero';
import ServiceRequestTrust from '@/components/service-request/ServiceRequestTrust';
import ServiceRequestFormSection from '@/components/service-request/ServiceRequestFormSection';
import ServiceRequestFormCard from '@/components/service-request/ServiceRequestFormCard';
import SubmissionSuccess from '@/components/service-request/SubmissionSuccess';
import type { ServiceRequestSuccessData } from '@/components/service-request/SubmissionSuccess';
import type { ServiceRequestPageConfig } from '@/lib/service-request-pages';
import { REQUEST_FORM_ANCHOR } from '@/components/service-request/ServiceRequestHero';

export interface ServiceRequestPageProps {
  config: ServiceRequestPageConfig;
}

/**
 * ServiceRequestPage — the whole page, for all five services.
 *
 * This file is a renderer, not a page. It holds no service-specific copy and
 * makes no decisions of its own; everything comes from `config`, which lives in
 * `lib/service-request-pages.ts`. Adding a sixth service is therefore a data
 * edit plus a nine-line page file, not another hand-built layout.
 *
 * The order is deliberate and is the whole argument of these pages:
 *
 *   1. Hero     — what the service is, who it is for, one button to act on
 *   2. Trust    — why this platform, stated only in ways that are true
 *   3. Form     — the request itself, the primary content of the page
 *
 * There is deliberately NO listings or provider-card section between them. The
 * user arrived with a problem, not a shopping list; showing a grid of workers
 * they cannot choose from would dilute the one action the page exists to enable.
 *
 * `overflow-x-clip` on the wrapper guards against a long Bangla word in a
 * service-specific answer (an address, a brand name) widening the page on a
 * narrow phone. `clip` rather than `hidden` so it never becomes a scroll
 * container and does not break `position: sticky` on the navbar.
 */
export default function ServiceRequestPage({ config }: ServiceRequestPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [submission, setSubmission] = useState<ServiceRequestSuccessData | null>(null);
  useEffect(() => {
    const openForm = () => setFormOpen(true);
    window.addEventListener('mms:open-service-request-form', openForm);
    return () => window.removeEventListener('mms:open-service-request-form', openForm);
  }, []);

  if (submission) {
    return (
      <main className="min-h-screen bg-mist-50">
        <SubmissionSuccess config={config} submission={submission} />
      </main>
    );
  }

  if (config.compactHero) {
    return (
      <div className={`flex min-h-screen flex-col overflow-x-clip ${config.slug === 'kajer-bua' ? 'bg-white' : 'bg-mist-50'}`}>
        <Navbar />
        <main className="flex-1">
          <ServiceRequestHero config={config} />
          <ServiceRequestFormSection
            config={config}
            open={formOpen}
            onOpen={() => setFormOpen(true)}
            onSubmitted={setSubmission}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (config.minimalForm) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-clip bg-white">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <header className="mb-5 border-b border-brand-100 pb-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              {config.title}
            </h1>
          </header>
          <div id={REQUEST_FORM_ANCHOR} className="scroll-mt-6">
            {formOpen ? (
              <ServiceRequestFormCard config={config} onSubmitted={setSubmission} />
            ) : (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
              >
                অনুরোধ জমা দিন
              </button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />

      <main className="flex-1">
        <ServiceRequestHero config={config} />
        <ServiceRequestTrust config={config} />
        <ServiceRequestFormSection
          config={config}
          open={formOpen}
          onOpen={() => setFormOpen(true)}
          onSubmitted={setSubmission}
        />
      </main>

      <Footer />
    </div>
  );
}