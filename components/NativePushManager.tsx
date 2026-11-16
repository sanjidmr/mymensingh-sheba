'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import { createClient } from '@/lib/supabase/client';
import { isNative } from '@/lib/platform';
import { saveDeviceToken } from '@/lib/native-push';

interface NativePushManagerProps {
  userId: string;
}

function subscribeToNativeRuntime(onStoreChange: () => void): () => void {
  const timer = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timer);
}

export function NativePushManager({ userId }: NativePushManagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const userIdRef = useRef(userId);
  const nativeRuntime = useSyncExternalStore(
    subscribeToNativeRuntime,
    isNative,
    () => false
  );
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const routeNotification = useCallback((href: unknown) => {
    if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//') || href.includes('\\')) {
      return;
    }
    router.push(href);
  }, [router]);

  useEffect(() => {
    if (!isNative()) return;
    let active = true;
    const listeners: PluginListenerHandle[] = [];

    const registerToken = async () => {
      try {
        await PushNotifications.register();
      } catch {
        // FCM is optional until Firebase is configured for this Android app.
      }
    };

    const setup = async () => {
      try {
        const [registration, foreground, action] = await Promise.all([
          PushNotifications.addListener('registration', ({ value }) => {
            void saveDeviceToken(userIdRef.current, value);
          }),
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            const text = [notification.title, notification.body].filter(Boolean).join(': ');
            if (text) window.dispatchEvent(new CustomEvent('mms:native-toast', { detail: text }));
          }),
          PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
            routeNotification(event.notification.data?.href);
          }),
        ]);
        if (!active) {
          void registration.remove();
          void foreground.remove();
          void action.remove();
          return;
        }
        listeners.push(registration, foreground, action);

        const status = await PushNotifications.checkPermissions();
        if (!active) return;
        setPermission(status.receive === 'granted' ? 'granted' : 'denied');
        if (status.receive === 'granted') void registerToken();
      } catch {
        if (active) setPermission('denied');
      }
    };

    void setup();
    return () => {
      active = false;
      listeners.forEach((listener) => void listener.remove());
    };
  }, [routeNotification, userId]);

  const enableNotifications = async () => {
    setRequesting(true);
    try {
      const status = await PushNotifications.requestPermissions();
      setPermission(status.receive === 'granted' ? 'granted' : 'denied');
      if (status.receive === 'granted') {
        await PushNotifications.register();
      } else {
        setDismissed(true);
      }
    } catch {
      setPermission('denied');
      setDismissed(true);
    } finally {
      setRequesting(false);
    }
  };

  const showPrompt =
    nativeRuntime &&
    permission !== 'granted' &&
    !dismissed &&
    (pathname === '/profile' || pathname.startsWith('/profile/') || pathname.startsWith('/dashboard'));

  if (!showPrompt) return null;
  return (
    <aside className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[80] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-lg">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Bell className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink-900">গুরুত্বপূর্ণ আপডেট পান</p>
        <p className="text-xs text-ink-500">অনুরোধের অবস্থা ও বার্তার নোটিফিকেশন চালু করুন।</p>
      </div>
      <button
        type="button"
        onClick={() => void enableNotifications()}
        disabled={requesting}
        className="min-h-10 shrink-0 rounded-lg bg-brand-700 px-3 text-xs font-bold text-white disabled:opacity-60"
      >
        {requesting ? 'অপেক্ষা করুন' : 'চালু করুন'}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500"
        aria-label="এখন নয়"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
