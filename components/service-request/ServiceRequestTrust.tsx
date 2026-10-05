import { ClipboardList, Inbox, LockKeyhole, MapPin, PhoneCall, SearchCheck } from 'lucide-react';
import type {
  ServiceRequestPageConfig,
  ServiceTrustIcon,
} from '@/lib/service-request-pages';

export interface ServiceRequestTrustProps {
  config: ServiceRequestPageConfig;
}

const ICONS: Record<ServiceTrustIcon, typeof MapPin> = {
  map: MapPin,
  clipboard: ClipboardList,
  lock: LockKeyhole,
  phone: PhoneCall,
  verify: SearchCheck,
  inbox: Inbox,
};

/**
 * ServiceRequestTrust — "কেন Mymensingh Sheba থেকে সেবা নেবেন?"
 *
 * Copy discipline: this platform cannot verify that a plumber is actually
 * skilled or that an electrician is licensed, so no point here says "verified",
 * "guaranteed", "trained" or promises a response time. Each point describes
 * behaviour that is really true of the product — requests land in a real admin
 * board, the area picker only offers the 33 MCC wards, the contact details are
 * never shown on a public listing — and the verification point says outright
 * that we try, without claiming to have done it.
 *
 * Visual: warm off-white section, plain white cards with a hairline border and
 * a small icon in the brand green. No shadows, no gradients.
 */
export default function ServiceRequestTrust({ config }: ServiceRequestTrustProps) {
  return (
    <section
      aria-labelledby="service-trust-heading"
      className="border-b border-brand-100 bg-white"
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="max-w-2xl">
          <h2
            id="service-trust-heading"
            className="text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-2xl"
          >
            {config.trustHeading}
          </h2>
          <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]">
            {config.trustIntro}
          </p>
        </div>

        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {config.trustPoints.map((point) => {
            const Icon = ICONS[point.icon] ?? CheckIconFallback;
            return (
              <li
                key={point.title}
                className="flex items-start gap-3 rounded-xl border border-brand-100 bg-mist-50 px-4 py-4"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-white text-brand-600"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-extrabold leading-snug text-ink-900">
                    {point.title}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-500">
                    {point.body}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** Only reached if a config declares an icon key the map does not know. */
function CheckIconFallback() {
  return <ClipboardList className="h-[18px] w-[18px]" />;
}