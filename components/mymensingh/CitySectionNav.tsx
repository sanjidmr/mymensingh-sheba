'use client';

import { useEffect, useRef, useState } from 'react';

const SECTIONS = [
  { id: 'city-facts', label: 'এক নজরে' },
  { id: 'city-name', label: 'নামের উৎপত্তি' },
  { id: 'city-ancient', label: 'প্রাচীন' },
  { id: 'city-timeline', label: 'সময়রেখা' },
  { id: 'city-division', label: 'বিভাজন' },
  { id: 'city-2015', label: 'বিভাগ ২০১৫' },
  { id: 'city-nature', label: 'প্রকৃতি' },
  { id: 'city-culture', label: 'সংস্কৃতি' },
  { id: 'city-education', label: 'শিক্ষা' },
  { id: 'city-people', label: 'মানুষ' },
  { id: 'city-river', label: 'ব্রহ্মপুত্র' },
  { id: 'city-zamindari', label: 'জমিদারি' },
  { id: 'city-movements', label: 'মুক্তিযুদ্ধ' },
  { id: 'city-present', label: 'বর্তমান' },
  { id: 'city-today', label: 'চার জেলা' },
  { id: 'city-myths', label: 'সংশোধন' },
  { id: 'city-gallery', label: 'ছবি' },
  { id: 'city-sources', label: 'তথ্যসূত্র' },
];

/**
 * CitySectionNav — sticky chapter rail.
 *
 * Placed after the hero, so it only becomes sticky once the reader has moved
 * past the opening. The track scrolls horizontally on small screens (scroll-snap
 * keeps one chip in view) instead of wrapping, which is what prevents the
 * "no horizontal overflow" problem on narrow phones.
 */
export default function CitySectionNav() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (node): node is HTMLElement => Boolean(node),
    );
    if (!nodes.length) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        });

        let best: { id: string; ratio: number } | null = null;
        visible.forEach((ratio, id) => {
          if (!best || ratio > best.ratio) best = { id, ratio };
        });
        if (best) setActiveId((best as { id: string }).id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Only the horizontal track should move. `scrollIntoView` walks every
    // scrollable ancestor, so a plain call also nudges the document and fights
    // the reader mid-scroll; scrolling the track directly avoids that entirely.
    const track = trackRef.current;
    const chip = activeRef.current;
    if (!track || !chip) return;
    const target = chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2;
    track.scrollTo({
      left: Math.max(0, target),
      behavior: 'smooth',
    });
  }, [activeId]);

  return (
    <nav
      aria-label="পাতার অধ্যায়"
      className="sticky top-16 z-40 border-b border-brand-100 bg-white/95 backdrop-blur-md sm:top-[4.5rem]"
    >
      <div
        ref={trackRef}
        className="no-scrollbar mx-auto flex max-w-7xl snap-x snap-mandatory items-center gap-1 overflow-x-auto px-3 py-2 sm:px-6 lg:px-8"
      >
        {SECTIONS.map((section) => {
          const active = section.id === activeId;
          return (
            <a
              key={section.id}
              ref={active ? activeRef : undefined}
              href={`#${section.id}`}
              aria-current={active ? 'true' : undefined}
              className={`inline-flex min-h-[36px] shrink-0 snap-start items-center whitespace-nowrap rounded-full px-3 text-[13px] font-bold transition-colors ${
                active
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-600 hover:bg-mist-100 hover:text-ink-900'
              }`}
            >
              {section.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
