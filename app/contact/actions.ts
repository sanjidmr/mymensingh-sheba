'use server';

import {
  validateContactForm,
  hasContactErrors,
  CONTACT_FIELD_ORDER,
  type ContactFormValues,
  type ContactSubject,
} from '@/lib/contact-types';
import { submitContactMessage, type ContactSubmitResult } from '@/lib/contact-service';

/**
 * Server action behind the /contact form.
 *
 * The client already validates for fast feedback, but every value is re-checked
 * here — a server action is a public endpoint, so it cannot trust the payload
 * that arrives. Errors are returned field-by-field so the form can highlight
 * the exact inputs again after a failed round-trip.
 */
export interface ContactActionState {
  status: 'idle' | 'success' | 'error';
  errors: Partial<Record<keyof ContactFormValues, string>>;
  /** Whole-form message, shown above the fields. */
  formErrorBn: string;
  /** Concrete alternative offered when the message could not be stored. */
  fallbackEmail: string | null;
}

export const INITIAL_CONTACT_STATE: ContactActionState = {
  status: 'idle',
  errors: {},
  formErrorBn: '',
  fallbackEmail: null,
};

export async function sendContactMessage(
  values: ContactFormValues
): Promise<ContactActionState> {
  const errors = validateContactForm(values);

  if (hasContactErrors(errors)) {
    const firstBad = CONTACT_FIELD_ORDER.find((field) => errors[field]);
    return {
      status: 'error',
      errors,
      formErrorBn: firstBad
        ? 'কিছু তথ্য ঠিক করতে হবে। নিচে চিহ্নিত ঘরগুলো দেখুন।'
        : 'ফর্মটি সম্পূর্ণ করুন।',
      fallbackEmail: null,
    };
  }

  const result: ContactSubmitResult = await submitContactMessage({
    name: values.name,
    phone: values.phone,
    email: values.email.trim() || null,
    // Safe: `subject` is non-empty because validation passed above.
    subject: values.subject as ContactSubject,
    message: values.message,
  });

  if (!result.ok) {
    return {
      status: 'error',
      errors: {},
      formErrorBn: result.errorBn,
      fallbackEmail: result.fallbackEmail,
    };
  }

  return {
    status: 'success',
    errors: {},
    formErrorBn: '',
    fallbackEmail: null,
  };
}
