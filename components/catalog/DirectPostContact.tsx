'use client';

import { Loader2, MessageCircle, Phone } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { formatPhone, resolveBangladeshContact } from '@/lib/bangladesh-phone';
import { trackCtaClick } from '@/lib/site-analytics';

export default function DirectPostContact({
  phone,
  whatsapp,
  loading = false,
  error,
  slug,
  category,
}: {
  phone?: string;
  whatsapp?: string;
  loading?: boolean;
  error?: string;
  slug: string;
  category: 'job' | 'buy_sell';
}) {
  const { callHref, whatsappHref: whatsappUrl } = resolveBangladeshContact(phone, whatsapp);
  const visiblePhone = phone?.trim();

  return (
    <section className="rounded-xl border border-brand-100 bg-white p-3.5 sm:p-4">
      <h2 className="text-sm font-extrabold text-ink-900">সরাসরি যোগাযোগ</h2>
      {loading ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          যোগাযোগের নম্বর লোড হচ্ছে…
        </p>
      ) : error ? (
        <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>
      ) : callHref || whatsappUrl ? (
        <>
          {visiblePhone && (
            <p className="mt-2 text-base font-extrabold tabular-nums text-ink-900">
              {formatPhone(visiblePhone) || visiblePhone}
            </p>
          )}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {callHref && (
              <a
                href={callHref}
                onClick={() => trackCtaClick({ ctaType: 'call', category, contentId: slug, routeKind: 'post' })}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 text-sm font-bold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" /> কল করুন
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick({ ctaType: 'whatsapp', category, contentId: slug, routeKind: 'post' })}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-brand-200 px-3 text-center text-xs font-bold leading-tight text-brand-800 hover:bg-brand-50 ${LIGHT_FOCUS}`}
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> WhatsApp-এ মেসেজ দিন
              </a>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-ink-600">যোগাযোগের নম্বর দেওয়া হয়নি।</p>
      )}
    </section>
  );
}
