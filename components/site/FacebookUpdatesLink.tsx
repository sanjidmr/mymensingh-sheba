import { Facebook } from 'lucide-react';
import { FACEBOOK_PAGE_URL } from '@/lib/site-contact';

export default function FacebookUpdatesLink({
  className = '',
  labelClassName = 'text-[11px]',
  tone = 'light',
}: {
  className?: string;
  labelClassName?: string;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <p className={`whitespace-nowrap leading-snug ${labelClassName} ${dark ? 'text-white/95' : 'text-ink-700'}`}>
        সব আপডেট পেতে
      </p>
      <a
        href={FACEBOOK_PAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          dark
            ? 'bg-accent-400 text-brand-950 hover:bg-accent-300 focus-visible:ring-white'
            : 'border border-brand-200 bg-brand-50 text-brand-800 hover:bg-brand-100 focus-visible:ring-brand-600'
        }`}
      >
        <Facebook className="h-3.5 w-3.5" aria-hidden="true" />
        Facebook পেজে যুক্ত হোন
      </a>
    </div>
  );
}
