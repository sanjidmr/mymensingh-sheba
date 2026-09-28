'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Info } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE } from './CityBits';

type Frame = {
  src: string;
  title: string;
  era: string;
  alt: string;
  note: string;
};

const FRAMES: Frame[] = [
  {
    src: '/mymensingh/brahmaputra-boats.jpg',
    title: 'পুরাতন ব্রহ্মপুত্রে নৌকা',
    era: 'নদীর যুগ',
    alt: 'পুরাতন ব্রহ্মপুত্রে নৌকা ও ভিটির দৃশ্য',
    note: 'আর্কাইভাল ছবি যুক্ত হলে এখানে দেখা যাবে।',
  },
  {
    src: '/mymensingh/shashi-lodge.jpg',
    title: 'জামিলা ধাঁচের বাড়ি',
    era: 'ঐতিহাসিক স্থাপত্য',
    alt: 'ঐতিহ্যবাহী জামিলা ভবনের চিত্র',
    note: 'আর্কাইভাল ছবি যুক্ত হলে এখানে দেখা যাবে।',
  },
  {
    src: '/mymensingh/zainul-park-boat.jpg',
    title: 'জয়নুল আবেদিন উদ্যানের নৌকা',
    era: 'আধুনিক',
    alt: 'জয়নুল আবেদিন উদ্যানের নৌকাটির চিত্র',
    note: 'শিল্পীর স্মরণে রক্ষিত নৌকাটি একটি চমকপ্রদ স্থান।',
  },
  {
    src: '/mymensingh/forest.jpg',
    title: 'মধুপুর গড়ের বনাঞ্চল',
    era: 'প্রকৃতি',
    alt: 'মধুপুর গড়ের বনাঞ্চলের দৃশ্য',
    note: 'আর্কাইভাল ছবি যুক্ত হলে এখানে দেখা যাবে।',
  },
  {
    src: '/mymensingh/haor.jpg',
    title: 'হাওর ও জলাভূমি',
    era: 'প্রকৃতি',
    alt: 'হাওর ও জলাভূমির দৃশ্য',
    note: 'আর্কাইভাল ছবি যুক্ত হলে এখানে দেখা যাবে।',
  },
  {
    src: '/mymensingh/tribal-life.jpg',
    title: 'গারো-মারও ঐতিহ্য',
    era: 'সংস্কৃতি',
    alt: 'পাহাড়ি জনগোষ্ঠীর ঐতিহ্যবাহী জীবন',
    note: 'আর্কাইভাল ছবি যুক্ত হলে এখানে দেখা যাবে।',
  },
];

/**
 * ArchiveGallery — horizontally scroll-snap filmstrip.
 *
 * Deliberately *not* a carousel: swipe/scroll, keyboard and drag all work
 * natively, and a missing file degrades to a labelled slot instead of a broken
 * tile. Every frame carries its own credit when a real photograph is added.
 */
export default function ArchiveGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : track.clientWidth * 0.8;
    track.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  return (
    <CitySection labelledBy="city-gallery-heading" id="city-gallery" className="bg-brand-950">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Reveal>
            <CityLabel index="১৭" tone="dark">
              আর্কাইভ
            </CityLabel>
            <h2 id="city-gallery-heading" className="mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              ছবির সংগ্রহ
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-100/80">
              আড়াই ডানে সরিয়ে দেখুন। প্রতিটি ফ্রেমে ছবির উৎস ও লাইসেন্স
              উল্লেখ করা হবে — যাচাই না হওয়া ছবি ইতিহাসের প্রমাণ হিসেবে
              ব্যবহার করা হয়নি।
            </p>
          </Reveal>
        </div>
        <Reveal delay={60}>
          <div className="hidden gap-2 lg:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="আগের ছবি"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-700 bg-brand-900 text-white transition-colors hover:border-brand-500"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="পরের ছবি"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-700 bg-brand-900 text-white transition-colors hover:border-brand-500"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </Reveal>
      </div>

      <Reveal delay={80}>
        <div
          ref={trackRef}
          className="no-scrollbar mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
        >
          {FRAMES.map((frame) => {
            const isMissing = failed[frame.src];
            return (
              <figure
                key={frame.src}
                className="w-[78vw] max-w-sm shrink-0 snap-start overflow-hidden rounded-2xl border border-brand-800 bg-brand-900"
              >
                <div className="relative aspect-[4/3] w-full bg-brand-900">
                  {isMissing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center">
                      <ImageOff className="h-6 w-6 text-accent-400" aria-hidden="true" />
                      <p className="text-sm font-extrabold text-white">{frame.title}</p>
                      <p className="max-w-[15rem] text-[11px] leading-relaxed text-brand-300">
                        {frame.note}
                      </p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={frame.src}
                      alt={frame.alt}
                      loading="lazy"
                      onError={() =>
                        setFailed((prev) => ({ ...prev, [frame.src]: true }))
                      }
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
                <figcaption className="flex items-start gap-2 border-t border-brand-800 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-accent-300">
                      {frame.era}
                    </p>
                    <p className="text-sm font-extrabold text-white">{frame.title}</p>
                  </div>
                  <Info
                    className="ml-auto mt-1 h-3.5 w-3.5 shrink-0 text-brand-400"
                    aria-hidden="true"
                  />
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Reveal>

      <p className="mt-3 text-[11px] leading-relaxed text-brand-400/80 lg:hidden">
        মোবাইলে ছবিগুলো আঙুল দিয়ে সরানো যাবে।
      </p>
    </CitySection>
  );
}
