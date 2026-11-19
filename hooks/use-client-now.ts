'use client';

import { useEffect, useState } from 'react';

export function useClientNow(): number | undefined;
export function useClientNow(initialValue: number): number;
export function useClientNow(initialValue?: number): number | undefined {
  const [now, setNow] = useState<number | undefined>(initialValue);

  useEffect(() => {
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return now;
}
