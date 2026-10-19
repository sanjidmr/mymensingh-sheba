'use client';

import { ArrowDown, PhoneCall } from 'lucide-react';
import { DARK_FOCUS, LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
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
  clean = false,
}: {
  anchorId: string;
  category: string;
  clean?: boolean;
}) {
  const focusClass = clean ? LIGHT_FOCUS : DARK_FOCUS;
  const onClick = () => {
    trackCtaClick({ ctaType: 'get_service', category, routeKind: 'service' });
  };

  return (
    <div className="mt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={`#${anchorId}`}
          onClick={onClick}
          className={`inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-7 text-base font-extrabold text-brand-950 shadow-sm transition-colors hover:bg-accent-300 sm:w-auto ${focusClass}`}
        >
          <PhoneCall className="h-[18px] w-[18px]" aria-hidden="true" />
          সেবা নিন
        </a>

        <a
          href={`#${anchorId}`}
          onClick={onClick}
          className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-bold transition-colors ${
            clean ? 'text-brand-700 hover:text-brand-900' : 'text-brand-200 hover:text-white'
          } ${focusClass}`}
        >
          নিচে ফর্ম পূরণ করুন
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
      {category === 'kajer-bua' && (
        <p className={`mt-2 text-center text-xs leading-relaxed sm:text-left ${clean ? 'text-ink-500' : 'text-brand-200/80'}`}>
          আপনার যোগাযোগের তথ্য গোপন থাকবে; অনুরোধটি অ্যাডমিন টিমের কাছে যাবে।
        </p>
      )}
    </div>
  );
}
