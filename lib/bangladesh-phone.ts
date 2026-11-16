const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

/**
 * Returns a validated Bangladeshi mobile in local 01XXXXXXXXX form.
 * Accepts local, 880, +880, and 00880 forms with common visual separators.
 */
export function normalizeBangladeshMobile(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;

  const formatted = value
    .replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)))
    .trim()
    .replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(formatted)) return null;

  if (/^01[3-9]\d{8}$/.test(formatted)) return formatted;
  if (/^8801[3-9]\d{8}$/.test(formatted)) return `0${formatted.slice(3)}`;
  if (/^\+8801[3-9]\d{8}$/.test(formatted)) return `0${formatted.slice(4)}`;
  if (/^008801[3-9]\d{8}$/.test(formatted)) return `0${formatted.slice(5)}`;
  return null;
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
