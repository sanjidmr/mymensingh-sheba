'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useAuth } from '@/lib/auth-context';
import { isNative } from '@/lib/platform';
import { triggerLightHaptic } from '@/lib/native-actions';
import { NativePushManager } from '@/components/NativePushManager';
import { NativeOfflineBanner } from '@/components/NativeOfflineBanner';
import { useNetworkStatus } from '@/hooks/use-network-status';

const HOME_EXIT_WINDOW_MS = 1800;

function safeInternalPath(path: string): string | null {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  try {
    const url = new URL(path, 'https://app.invalid');
    return url.origin === 'https://app.invalid' ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}

function routeFromAppUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'com.mymensinghsheba.app:') return null;
    const path = url.hostname ? `/${url.hostname}${url.pathname}` : url.pathname;
    return safeInternalPath(`${path}${url.search}${url.hash}`);
  } catch {
    return null;
  }
}

export function NativeInit() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [toast, setToast] = useState('');
  const pathnameRef = useRef(pathname);
  const lastHomeBackAt = useRef(0);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const navigateFromDeepLink = useCallback(async (rawUrl: string) => {
    const destination = routeFromAppUrl(rawUrl);
    if (!destination) return;
    try {
      await Browser.close();
    } catch {
      // The browser may not be open for an email or app-launch deep link.
    }
    router.replace(destination);
  }, [router]);

  useEffect(() => {
    let active = true;
    const listeners: Array<{ remove: () => Promise<void> }> = [];
    let toastTimer: number | undefined;

    const showToast = (message: string) => {
      setToast(message);
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => setToast(''), 2200);
    };
    const handleToast = (event: Event) => {
      const message = (event as CustomEvent<unknown>).detail;
      if (typeof message === 'string') showToast(message);
    };
    const handleNativeBack = (event: { canGoBack: boolean }) => {
      const openDialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (openDialog) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      if (pathnameRef.current === '/') {
        const now = Date.now();
        if (now - lastHomeBackAt.current < HOME_EXIT_WINDOW_MS) {
          void App.exitApp();
          return;
        }
        lastHomeBackAt.current = now;
        showToast('Press back again to exit');
        return;
      }
      if (event.canGoBack) router.back();
      else router.replace('/');
    };
    const handleExternalLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const href = anchor.href;
      if (!/^https:\/\/wa\.me\//i.test(href)) return;
      event.preventDefault();
      void import('@/lib/native-actions').then(({ openExternalUrl }) => openExternalUrl(href));
    };
    const handleHaptics = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('button[type="submit"], [data-native-haptic]')) {
        void triggerLightHaptic();
      }
    };

    const initialize = async () => {
      if (!isNative()) return;
      document.documentElement.classList.add('native-app');
      window.addEventListener('mms:native-toast', handleToast);
      document.addEventListener('click', handleExternalLink, true);
      document.addEventListener('click', handleHaptics, true);

      const hideSplash = () => {
        void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => undefined);
      };
      const hideTimer = window.setTimeout(hideSplash, 1500);
      requestAnimationFrame(() => {
        window.clearTimeout(hideTimer);
        hideSplash();
      });

      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#0c3b2e' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        // Status bar integration is optional on unsupported platforms.
      }
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
        const keyboardListener = await Keyboard.addListener('keyboardWillShow', () => {
          const element = document.activeElement;
          if (element instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName)) {
            window.setTimeout(() => element.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
          }
        });
        listeners.push(keyboardListener);
      } catch {
        // The platform WebView still provides its default keyboard behavior.
      }

      try {
        listeners.push(await App.addListener('backButton', handleNativeBack));
        listeners.push(await App.addListener('appUrlOpen', ({ url }) => {
          void navigateFromDeepLink(url);
        }));
        listeners.push(await App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) return;
          void import('@/lib/supabase/client').then(({ createClient }) => {
            const client = createClient();
            if (client) return client.auth.refreshSession();
            return undefined;
          }).catch(() => undefined);
          void queryClient.refetchQueries({ type: 'active', stale: true });
        }));
        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) void navigateFromDeepLink(launchUrl.url);
      } catch {
        // App lifecycle listeners are available only in the native runtime.
      }
      if (!active) listeners.forEach((listener) => void listener.remove());
    };

    void initialize();
    return () => {
      active = false;
      document.documentElement.classList.remove('native-app');
      window.removeEventListener('mms:native-toast', handleToast);
      document.removeEventListener('click', handleExternalLink, true);
      document.removeEventListener('click', handleHaptics, true);
      window.clearTimeout(toastTimer);
      listeners.forEach((listener) => void listener.remove());
    };
  }, [navigateFromDeepLink, queryClient, router]);

  useEffect(() => {
    if (!isNative()) return;
    const handleOfflineSubmit = (event: Event) => {
      if (isOnline) return;
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('mms:native-toast', {
        detail: 'ইন্টারনেট সংযোগ নেই। সংযোগ ফিরে এলে আবার চেষ্টা করুন।',
      }));
    };
    document.addEventListener('submit', handleOfflineSubmit, true);
    return () => document.removeEventListener('submit', handleOfflineSubmit, true);
  }, [isOnline]);

  return (
    <>
      <NativeOfflineBanner />
      {user && <NativePushManager userId={user.id} />}
      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[100] mx-auto w-fit max-w-[calc(100%-2rem)] rounded-xl bg-brand-950 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </>
  );
}
