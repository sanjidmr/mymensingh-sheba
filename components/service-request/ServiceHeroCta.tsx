'use client';

import { ArrowDown, PhoneCall } from 'lucide-react';
import { DARK_FOCUS } from '@/components/about/AboutSectionBits';
import { trackCtaClick } from '@/lib/site-analytics';

/**
 * The "সেবা নিন" call-to-action on a service request page.
 *
 * Split out of the server-rendered hero so the anchors can carry an onClick,
 * which is the only way to record the press. The link still works with
 * JavaScript disabled: tracking is an observer, never a gate.
 *
 * A press here is recorded as `get_service` under the page's service category,
 * so the dashboard can rank "which সেবা নিন button is pressed most" — and it is
 * labelled as a press, not as a completed request.
 */
export default function ServiceHeroCta({
  anchorId,
  category,
}: {
  anchorId: string;
  category: string;
}) {
  const onClick = () => {
    trackCtaClick({ ctaType: 'get_service', category, routeKind: 'service' });
  };

  return (
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
      <a
        href={`#${anchorId}`}
        onClick={onClick}
        className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-6 text-[15px] font-extrabold text-brand-950 transition-colors hover:bg-accent-300 sm:w-auto ${DARK_FOCUS}`}
      >
        <PhoneCall className="h-[18px] w-[18px]" aria-hidden="true" />
        সেবা নিন
      </a>

      <a
        href={`#${anchorId}`}
        onClick={onClick}
        className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 text-[13px] font-bold text-brand-200 transition-colors hover:text-white ${DARK_FOCUS} rounded-lg px-2`}
      >
        নিচে ফর্ম পূরণ করুন
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}
