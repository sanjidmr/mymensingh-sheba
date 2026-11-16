'use client';

import { useEffect, useRef, useState } from 'react';

export function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof window.IntersectionObserver !== 'function') {
      const fallbackTimer = setTimeout(() => setIsNearViewport(true), 0);
      return () => clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, isNearViewport };
}
