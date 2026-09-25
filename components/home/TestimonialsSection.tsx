'use client';

import { useState } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from '@/components/home/Reveal';

interface Testimonial {
  name: string;
  area: string;
  rating: number;
  text: string;
  role: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'রোকেয়া বেগম',
    area: 'চরপাড়া',
    role: 'বাসা ভাড়া',
    rating: 5,
    text: 'চরপাড়ায় ফ্যামিলি ফ্ল্যাট খুঁজছিলাম। এলাকা-ভিত্তিক তালিকা এত গোছানো, অল্প সময়েই সঠিক বাসা পেয়েছি।',
  },
  {
    name: 'মাহফুজ আলম',
    area: 'সানকিপাড়া',
    role: 'Electrician',
    rating: 5,
    text: 'রাতের বেলা ফ্যান খারাপ হয়। অ্যাডমিন জরুরি অনুরোধটা বুঝলেন, সকালেই টেকনিশিয়ান বাসায় এসে কাজ সারলেন।',
  },
  {
    name: 'নুসরাত জাহান',
    area: 'রামবাবুপুর',
    role: 'গৃহশিক্ষক',
    rating: 4,
    text: 'দুই সন্তানের জন্য অভিজ্ঞ গৃহশিক্ষকের প্রোফাইল তুলনা করে বেছে নিয়েছি। রেটিং আর অভিজ্ঞতার ভিত্তিতে সিদ্ধান্ত নেওয়াটা সহজ ছিল।',
  },
];

export default function TestimonialsSection() {
  const [page, setPage] = useState(0);
  const perPage = 1;
  const totalPages = TESTIMONIALS.length;

  return (
    <section className="bg-white py-9 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
              এলাকার মানুষ বলছেন
            </span>
            <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
              ময়মনসিংহবাসীর আস্থা আমাদের অগ্রাধিকার
            </h2>
          </div>
        </Reveal>

        <div className="mt-8">
          <div className="hidden grid-cols-3 gap-5 lg:grid">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} initial={i === 0} />
            ))}
          </div>

          {/* Mobile / small carousel */}
          <div className="lg:hidden">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${page * 100}%)` }}
              >
                {TESTIMONIALS.map((t, i) => (
                  <div key={t.name} className="w-full shrink-0 px-1">
                    <TestimonialCard t={t} initial={i === 0} />
                  </div>
                ))}
              </div>
            </div>
            {totalPages > perPage && (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => (p - 1 + totalPages) % totalPages)}
                  aria-label="পূর্ববর্তী মতামত"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1.5">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i)}
                      aria-label={`মতামত ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === page ? 'w-6 bg-brand-600' : 'w-2 bg-brand-200 hover:bg-brand-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPage((p) => (p + 1) % totalPages)}
                  aria-label="পরবর্তী মতামত"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 transition-colors hover:bg-brand-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t, initial }: { t: Testimonial; initial: boolean }) {
  const [revealed] = useState(initial);
  return (
    <figure
      className={`flex h-full flex-col rounded-2xl border border-brand-100 bg-mist-50/60 p-6 transition-all duration-700 ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="flex items-center justify-between">
        <Quote className="h-8 w-8 text-brand-200" aria-hidden="true" />
        <span className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
              aria-hidden="true"
            />
          ))}
        </span>
      </div>
      <blockquote className="mt-4 flex-1 text-[14px] leading-relaxed text-ink-700">
        “{t.text}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-brand-100 pt-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
          {t.name.charAt(0)}
        </span>
        <div>
          <p className="text-sm font-bold text-ink-900">{t.name}</p>
          <p className="text-xs text-ink-500">
            {t.area} • {t.role}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}