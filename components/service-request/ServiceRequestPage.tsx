import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceRequestHero from '@/components/service-request/ServiceRequestHero';
import ServiceRequestTrust from '@/components/service-request/ServiceRequestTrust';
import ServiceRequestFormSection from '@/components/service-request/ServiceRequestFormSection';
import type { ServiceRequestPageConfig } from '@/lib/service-request-pages';

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
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-mist-50">
      <Navbar />

      <main className="flex-1">
        <ServiceRequestHero config={config} />
        <ServiceRequestTrust config={config} />
        <ServiceRequestFormSection config={config} />
      </main>

      <Footer />
    </div>
  );
}