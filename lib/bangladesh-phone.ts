import { formatPhone, normalizePhone } from './phone.ts';

export { formatPhone, normalizePhone };

/**
 * Returns a validated Bangladeshi mobile in local 01XXXXXXXXX form.
 * Accepts local, 880, +880, and 00880 forms with common visual separators.
 */
export function normalizeBangladeshMobile(value: string | null | undefined): string | null {
  return normalizePhone(value);
}

export function phoneHref(value: string): string | null {
  const normalized = normalizeBangladeshMobile(value);
  return normalized ? `tel:+88${normalized}` : null;
}

export function whatsappHref(value: string): string | null {
  const normalized = normalizeBangladeshMobile(value);
  return normalized ? `https://wa.me/88${normalized}` : null;
}

export function resolveBangladeshContact(phone: string | null | undefined, whatsapp?: string | null) {
  const callNumber = normalizeBangladeshMobile(phone);
  const whatsappNumber = normalizeBangladeshMobile(whatsapp) ?? callNumber;
  return {
    callNumber,
    whatsappNumber,
    callHref: callNumber ? `tel:+88${callNumber}` : null,
    whatsappHref: whatsappNumber ? `https://wa.me/88${whatsappNumber}` : null,
  };
}
