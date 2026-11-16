import { Browser } from '@capacitor/browser';
import { Geolocation } from '@capacitor/geolocation';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { isNative } from '@/lib/platform';

export async function shareContent(input: {
  title: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  const url = input.url ?? (typeof window !== 'undefined' ? window.location.href : '');
  if (isNative()) {
    try {
      await Share.share({ ...input, url, dialogTitle: input.title });
      return true;
    } catch {
      // Fall through to the browser share/copy options.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ ...input, url });
      return true;
    } catch {
      // A dismissed share sheet is not a failure; try copying the link.
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && url) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function openExternalUrl(href: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;

  if (isNative()) {
    try {
      await Browser.open({ url: url.toString(), toolbarColor: '#0c3b2e' });
      return true;
    } catch {
      return false;
    }
  }

  window.open(url.toString(), '_blank', 'noopener,noreferrer');
  return true;
}

export async function triggerLightHaptic(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are optional on devices without the native capability.
  }
}

export type CurrentLocationResult =
  | { success: true; latitude: number; longitude: number; accuracy: number }
  | { success: false; error: string };

function locationErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('denied') || message.includes('permission')) {
    return 'অবস্থান ব্যবহারের অনুমতি দেওয়া হয়নি। সেটিংস থেকে অনুমতি দিয়ে আবার চেষ্টা করুন।';
  }
  if (message.includes('unavailable') || message.includes('disabled')) {
    return 'এই ডিভাইসে অবস্থান সেবা চালু নেই।';
  }
  if (message.includes('timeout')) return 'অবস্থান খুঁজতে সময় বেশি লাগছে। আবার চেষ্টা করুন।';
  return 'আপনার অবস্থান পাওয়া যায়নি। আবার চেষ্টা করুন।';
}

export async function getCurrentPosition(): Promise<CurrentLocationResult> {
  try {
    const position = isNative()
      ? await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 12_000 })
      : await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Location unavailable'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 12_000,
          });
        });
    return {
      success: true,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    return { success: false, error: locationErrorMessage(error) };
  }
}
