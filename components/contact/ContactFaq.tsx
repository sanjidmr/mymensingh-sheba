'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CONTACT_FAQS } from '@/lib/contact-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

/**
 * ContactFaq — quick help under the form.
 *
 * A controlled accordion (one panel open at a time) built on the
 * `grid-rows-[0fr] → [1fr]` transition, which animates to the panel's natural
 * height without needing a measured pixel value or a JS resize observer.
 * Every trigger is a real button with `aria-expanded` / `aria-controls`, and
 * the chevron rotates so the open state is not communicated by colour alone.
 */
export default function ContactFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      aria-labelledby="contact-faq-heading"
      className="border-t border-brand-100/70 bg-mist-50"
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="flex items-center gap-2.5 text-xs font-bold text-brand-600 sm:text-[13px]">
          <span aria-hidden="true" className="h-1 w-7 shrink-0 rounded-full bg-accent-400" />
          দ্রুত সহায়তা
        </p>
        <h2
          id="contact-faq-heading"
          className="mt-3 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl"
        >
          প্রায়ই জিজ্ঞাসিত প্রশ্ন
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          এখানে উত্তর না পেলে উপরের ফর্মে লিখে পাঠাতে পারেন।
        </p>

        <ul className="mt-6 divide-y divide-brand-100 overflow-hidden rounded-xl border border-brand-100 bg-white">
          {CONTACT_FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `contact-faq-panel-${index}`;
            const buttonId = `contact-faq-button-${index}`;

            return (
              <li key={faq.questionBn}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-mist-50 sm:px-5 ${LIGHT_FOCUS}`}
                  >
                    <span className="min-w-0 flex-1 text-[14.5px] font-bold leading-snug text-ink-900 sm:text-[15px]">
                      {faq.questionBn}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? 'rotate-45 border-brand-700 bg-brand-700 text-white'
                          : 'border-brand-200 text-brand-600'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-4 text-[14px] leading-relaxed text-ink-600 sm:px-5 sm:pb-5 sm:pr-12">
                      {faq.answerBn}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
