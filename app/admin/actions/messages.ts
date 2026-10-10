'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

/**
 * Contact-message inbox.
 *
 * The contact form has written into `contact_messages` since the beginning and
 * a trigger has raised an admin notification for every message — but nothing
 * could read the table back. This is the missing half: status changes, an
 * internal note, and deletion.
 *
 * Logged-in customers receive private replies in their dashboard. Guest
 * contact submissions remain phone/email follow-ups because they have no
 * authenticated inbox to associate a conversation with.
 */

export async function setMessageStatus(
  messageId: string,
  status: 'new' | 'reviewing' | 'replied' | 'closed'
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client
      .from('contact_messages')
      .update({ status })
      .eq('id', messageId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/messages');
    return { ok: true, message: 'বার্তার স্ট্যাটাস আপডেট হয়েছে।' };
  });
}

export async function markMessageRead(messageId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client
      .from('contact_messages')
      .update({ status: 'reviewing' })
      .eq('id', messageId)
      .eq('status', 'new');

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/messages');
    return { ok: true, message: 'পড়া হিসেবে চিহ্নিত করা হয়েছে।' };
  });
}

export async function saveMessageNote(
  messageId: string,
  note: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const trimmed = note.trim();
    if (trimmed.length > 1000) {
      return { ok: false, error: 'নোটটি ১০০০ অক্ষরের বেশি হতে পারবে না।' };
    }

    const { error } = await client
      .from('contact_messages')
      .update({ admin_notes: trimmed || null })
      .eq('id', messageId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/messages');
    return { ok: true, message: 'নোট সংরক্ষিত হয়েছে।' };
  });
}

export async function deleteMessage(messageId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('contact_messages').delete().eq('id', messageId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/messages');
    return { ok: true, message: 'বার্তাটি মুছে ফেলা হয়েছে।' };
  });
}

export async function replyToCustomerMessage(
  messageId: string,
  body: string
): Promise<ActionResult> {
  return runAdminAction(async (client, adminId) => {
    const trimmed = body.trim();
    if (!messageId || trimmed.length < 1 || trimmed.length > 1500) {
      return { ok: false, error: 'উত্তর ১ থেকে ১৫০০ অক্ষরের মধ্যে লিখুন।' };
    }

    const { error: replyError } = await client.from('contact_message_replies').insert({
      message_id: messageId,
      sender_id: adminId,
      sender_role: 'admin',
      body: trimmed,
    });
    if (replyError) return { ok: false, error: replyError.message };

    const { error: statusError } = await client
      .from('contact_messages')
      .update({ status: 'replied' })
      .eq('id', messageId);
    if (statusError) return { ok: false, error: statusError.message };

    revalidatePath('/admin/messages');
    revalidatePath(`/admin/messages/${messageId}`);
    revalidatePath('/dashboard/messages');
    return { ok: true, message: 'উত্তর গ্রাহকের কাছে পাঠানো হয়েছে।' };
  });
}