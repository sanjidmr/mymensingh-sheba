'use client';

import ServiceSearchBox from '@/components/home/ServiceSearchBox';

/**
 * SearchSection — the supporting text + search block that sits between the
 * carousel and the service categories.
 *
 * The carousel now owns the big visual moment; this section keeps the warm,
 * human editorial copy and the product-grade search (same `ServiceSearchBox`,
 * so the `/services?q=…` search functionality is untouched) in a centered,
 * spacious composition.
 */
export default function SearchSection() {
  return (
    <section className="border-b border-brand-100/70 bg-mist-50" aria-label="আপনার কী সেবা প্রয়োজন">
      <div className="mx-auto w-full max-w-7xl px-4 pb-5 pt-3 sm:px-6 sm:pb-6 sm:pt-4 lg:px-8 lg:pb-7 lg:pt-5">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            className="mms-fade-up text-balance text-[24px] font-extrabold leading-[1.22] tracking-tight text-ink-900 sm:text-3xl sm:leading-[1.18] xl:text-[34px]"
            style={{ animationDelay: '60ms' }}
          >
            ময়মনসিংহের প্রয়োজনীয় সেবা,{' '}
            <span className="relative whitespace-nowrap text-brand-700">
              এখন এক জায়গায়
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-1.5 h-1.5 rounded-full bg-accent-400/90 sm:-bottom-2"
              />
            </span>
          </h1>

          <p
            className="mms-fade-up mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base"
            style={{ animationDelay: '120ms' }}
          >
            বাসা ভাড়া থেকে জরুরি রক্তদান — এলাকার মানুষেরই হাতে গড়া সেবা। ছোট থেকে
            বড়, প্রতিটি প্রয়োজনে বিশ্বস্ত মানুষ ও সেবা পাশে পাবেন।
          </p>

          <div className="mms-fade-up mx-auto mt-5 max-w-2xl" style={{ animationDelay: '180ms' }}>
            <p className="mb-2 text-sm font-bold text-ink-700">আপনার কী সেবা প্রয়োজন?</p>
            <ServiceSearchBox />
          </div>
        </div>
      </div>
    </section>
  );
}