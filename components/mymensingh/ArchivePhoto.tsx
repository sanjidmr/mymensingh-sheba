'use client';

import React, { useState } from 'react';
import { ImageOff, Landmark, Waves } from 'lucide-react';

interface ArchivePhotoProps {
  /** Path inside /public — e.g. "/mymensingh/hero-river.jpg". */
  src: string;
  /** Real description of the photograph, used once the file is supplied. */
  alt: string;
  /** Small print under the frame: collection / credit / licence. */
  credit?: string;
  /** Shown inside the empty slot so the frame never reads as a bug. */
  slotNote?: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
  sizes?: string;
  icon?: 'landmark' | 'waves';
  /**
   * Fill an already-positioned parent (hero backgrounds, full-bleed frames)
   * instead of sitting in normal flow. Without this the root would need both
   * `relative` and `absolute`, and `relative` would win — collapsing the frame
   * to zero height because all of its children are absolute.
   */
  fill?: boolean;
}

/**
 * ArchivePhoto — an honest image slot.
 *
 * We do not generate or fabricate historical photographs. Until a real,
 * legally usable file is dropped into /public, the component keeps
 * the composition intact with a labelled archive placeholder; the moment the
 * file exists the photograph fades in automatically. Every frame that does
 * carry a real image is expected to pass its `credit`.
 */
export default function ArchivePhoto({
  src,
  alt,
  credit,
  slotNote = 'আর্কাইভাল ছবির স্থান সংরক্ষিত আছে',
  className = '',
  imgClassName = 'object-cover',
  eager = false,
  sizes = '(max-width: 1023px) 100vw, 50vw',
  icon = 'landmark',
  fill = false,
}: ArchivePhotoProps) {
  const [failed, setFailed] = useState(false);
  const Icon = icon === 'waves' ? Waves : Landmark;

  return (
    <figure
      className={`${fill ? 'absolute inset-0' : 'relative'} overflow-hidden bg-brand-900 ${className}`}
    >
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-900 px-5 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-700 text-accent-300">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="max-w-[16rem] text-xs font-semibold leading-relaxed text-brand-200/85">
            {slotNote}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-brand-400">
            <ImageOff className="h-3 w-3" aria-hidden="true" />
            অডিট ফাইল যুক্ত হলে এখানে দেখা যাবে
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full ${imgClassName}`}
        />
      )}

      {credit && !failed ? (
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/90 to-transparent px-3 pb-2 pt-8 text-[10px] leading-relaxed text-brand-100/80">
          {credit}
        </figcaption>
      ) : null}
    </figure>
  );
}
