'use client';

import { useState } from 'react';

/**
 * A published article photo with an honest failure state.
 *
 * If the stored URL 404s, the image disappears and the parent's neutral paper
 * tone remains — the page never substitutes a stock photo for a news event it
 * cannot actually show.
 */
export default function NewsImage({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
