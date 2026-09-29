/**
 * Mymensingh Sheba — contact form delivery.
 *
 * Same shape as the other service modules (`staff-service.ts` etc.):
 * Supabase when configured, otherwise a clearly-labelled in-memory fallback
 * that the UI can report honestly instead of pretending a message was sent.
 *
 * Honesty contract (see lib/site-contact.ts): when storage is unavailable the
 * form must NOT show the success panel. `persisted: false` tells the caller to
 * render the fallback state that offers the real, working alternative — the
 * published email address.
 */
import { isSupabaseConfigured, createClient } from './supabase/client';
import { SITE_CONTACT } from './site-contact';
import {
  normalizeBdPhone,
  type ContactSubject,
} from './contact-types';

export interface ContactSubmitResult {
  ok: boolean;
  /** True only when the message was actually stored. */
  persisted: boolean;
  /** Bengali message for the UI. Empty when `ok` is true. */
  errorBn: string;
  /** Set when we can offer a concrete alternative to the form. */
  fallbackEmail: string | null;
}

export interface ContactMessageInput {
  name: string;
  phone: string;
  email: string | null;
  subject: ContactSubject;
  message: string;
  userId?: string;
}

const SUCCESS: ContactSubmitResult = {
  ok: true,
  persisted: true,
  errorBn: '',
  fallbackEmail: null,
};

/**
 * Dev/offline stand-in so the form still behaves like a form in a local
 * checkout with no `.env`. Kept intentionally tiny — the record is dropped on
 * reload, which is exactly why the UI says so instead of claiming delivery.
 */
const offlineLog: Array<ContactMessageInput> = [];

function unavailable(): ContactSubmitResult {
  return {
    ok: false,
    persisted: false,
    errorBn:
      'এই মুহূর্তে অনলাইনে বার্তা গ্রহণের সেবা চালু নেই। অনুগ্রহ করে ইমেইলে আপনার বার্তা পাঠান।',
    fallbackEmail: SITE_CONTACT.email,
  };
}

/**
 * Store one contact message. Validation is assumed to have already run on the
 * client; the values are re-normalised here so the stored phone is in one
 * predictable format regardless of how it was typed.
 */
export async function submitContactMessage(
  input: ContactMessageInput
): Promise<ContactSubmitResult> {
  const phone = normalizeBdPhone(input.phone);
  const email = (input.email ?? '').trim() || null;

  if (!isSupabaseConfigured) {
    offlineLog.push({ ...input, phone, email });
    return unavailable();
  }

  const client = createClient();
  if (!client) return unavailable();

  const { error } = await client.from('contact_messages').insert({
    name: input.name.trim(),
    phone,
    email,
    subject: input.subject,
    message: input.message.trim(),
    user_id: input.userId || null,
  });

  if (error) {
    return {
      ok: false,
      persisted: false,
      errorBn: 'বার্তাটি পাঠানো যায়নি। একটু পরে আবার চেষ্টা করুন, অথবা ইমেইলে পাঠান।',
      fallbackEmail: SITE_CONTACT.email,
    };
  }

  return SUCCESS;
}
