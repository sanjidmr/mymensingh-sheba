'use client';

import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export default function GoogleSignInButton({
  onClick,
  loading = false,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#747775] bg-white px-4 text-sm font-medium text-[#1f1f1f] shadow-sm transition-colors hover:bg-[#f8f9fa] hover:border-[#5f6368] disabled:cursor-wait disabled:opacity-60 ${LIGHT_FOCUS}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v2.79h3.87c2.27-2.09 3.57-5.17 3.57-8.43Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.87-2.79c-1.08.72-2.46 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.95H1.27v2.88A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.26 14.49a7.2 7.2 0 0 1 0-4.98V6.63H1.27a12 12 0 0 0 0 10.74l3.99-2.88Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.56c1.77 0 3.35.61 4.6 1.81l3.45-3.45C17.95.98 15.24 0 12 0A12 12 0 0 0 1.27 6.63l3.99 2.88C6.21 6.67 8.87 4.56 12 4.56Z"
        />
      </svg>
      {loading ? 'Google-এ সংযোগ হচ্ছে…' : 'Continue with Google'}
    </button>
  );
}
