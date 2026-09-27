'use client';

import React, { useState } from 'react';
import { Landmark } from 'lucide-react';

interface CityPhotoProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  caption?: string;
}

export default function CityPhoto({
  src,
  alt,
  className = '',
  eager = false,
  caption,
}: CityPhotoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={`relative overflow-hidden ${className}`}>
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-brand-800 to-brand-950 px-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
            <Landmark className="h-5 w-5 text-accent-300" aria-hidden="true" />
          </span>
          <span className="mt-3 max-w-[15rem] text-xs leading-relaxed text-brand-100/70">
            {alt} — ছবিটি এখন দেখা যাচ্ছে না
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {caption && (
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/90 to-transparent px-4 pb-3 pt-10 text-[11px] leading-relaxed text-brand-100/80">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}