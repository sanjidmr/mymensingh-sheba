/**
 * Notification writer helpers (fire-and-forget, never blocks the caller).
 * Mirrors the DB `notifications` RLS contract:
 *  - notifyCustomer: writes a personal notification for one account
 *    (allowed by RLS because it is either their own row or an admin action).
 *  - notifyAdminHub: writes a row every admin sees in /admin/notifications.
 * In preview mode (no Supabase) these are silent no-ops.
 */
import { isSupabaseConfigured, createClient } from './supabase/client';

export type NotifType = 'info' | 'success' | 'warning' | 'danger';

interface BaseNotif {
  title: string;
  body?: string;
  type?: NotifType;
  relatedType?: string;
  relatedId?: string;
}

export async function notifyCustomer(opts: BaseNotif & { userId: string }): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  if (!client) return;
  try {
    await client.from('notifications').insert({
      user_id: opts.userId,
      target_role: 'customer',
      title: opts.title,
      body: opts.body || '',
      type: opts.type || 'info',
      related_type: opts.relatedType || null,
      related_id: opts.relatedId || null,
    });
  } catch {
    // Notifications must never break the primary operation.
  }
}

export async function notifyAdminHub(opts: BaseNotif): Promise<void> {
  if (!isSupabaseConfigured) return;
  const client = createClient();
  if (!client) return;
  try {
    await client.from('notifications').insert({
      user_id: null,
      target_role: 'admin',
      title: opts.title,
      body: opts.body || '',
      type: opts.type || 'info',
      related_type: opts.relatedType || null,
      related_id: opts.relatedId || null,
    });
  } catch {
    // Fire-and-forget.
  }
}