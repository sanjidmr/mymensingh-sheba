import { PushNotifications } from '@capacitor/push-notifications';
import { createClient } from '@/lib/supabase/client';
import { isNative } from '@/lib/platform';
import { safeStorage } from '@/lib/safe';

const DEVICE_TOKEN_KEY = 'mms-native-device-token-v1';

export async function saveDeviceToken(userId: string, token: string): Promise<boolean> {
  if (!isNative()) return false;
  const client = createClient();
  if (!client) return false;
  try {
    const { error } = await client.from('device_tokens').upsert(
      { user_id: userId, token, platform: 'android' },
      { onConflict: 'token' }
    );
    if (error) return false;
    safeStorage.set(DEVICE_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export async function removeDeviceToken(userId: string): Promise<void> {
  if (!isNative()) return;
  const client = createClient();
  let token = '';
  try {
    token = safeStorage.get(DEVICE_TOKEN_KEY) ?? '';
    if (token && client) {
      await client.from('device_tokens').delete().eq('user_id', userId).eq('token', token);
    }
    safeStorage.remove(DEVICE_TOKEN_KEY);
    await PushNotifications.unregister();
  } catch {
    // Removing a token is best-effort so an offline logout can still complete.
  }
}
