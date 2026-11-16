'use client';

import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { isNative } from '@/lib/platform';

export function useNetworkStatus(): { isOnline: boolean; isReady: boolean } {
  const [isOnline, setIsOnline] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    const updateFromBrowser = () => setIsOnline(navigator.onLine);
    updateFromBrowser();

    window.addEventListener('online', updateFromBrowser);
    window.addEventListener('offline', updateFromBrowser);

    let removeNativeListener: (() => void) | undefined;
    if (isNative()) {
      void Network.getStatus()
        .then((status) => {
          if (active) setIsOnline(status.connected);
        })
        .catch(() => {
          if (active) setIsOnline(navigator.onLine);
        });

      void Network.addListener('networkStatusChange', (status) => {
        if (active) setIsOnline(status.connected);
      })
        .then((listener) => {
          removeNativeListener = () => void listener.remove();
          if (!active) removeNativeListener();
        })
        .catch(() => {
          if (active) setIsOnline(navigator.onLine);
        });
    }

    const readyTimer = window.setTimeout(() => setIsReady(true), 0);
    return () => {
      active = false;
      window.clearTimeout(readyTimer);
      window.removeEventListener('online', updateFromBrowser);
      window.removeEventListener('offline', updateFromBrowser);
      removeNativeListener?.();
    };
  }, []);

  return { isOnline, isReady };
}
