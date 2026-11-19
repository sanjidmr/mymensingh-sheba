const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯';

export function normalizePhone(input: string | null | undefined): string | null {
  if (typeof input !== 'string') return null;

  const formatted = input
    .replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)))
    .trim()
    .replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(formatted)) return null;
  const compact = formatted.replace(/^\+/, '');

  if (/^01[3-9]\d{8}$/.test(compact)) return compact;
  if (/^8801[3-9]\d{8}$/.test(compact)) return `0${compact.slice(3)}`;
  if (/^008801[3-9]\d{8}$/.test(compact)) return `0${compact.slice(5)}`;
  return null;
}

export function isValidBDPhone(input: string | null | undefined): boolean {
  const normalized = normalizePhone(input);
  return normalized !== null && /^01[3-9]\d{8}$/.test(normalized);
}

export function formatPhone(input: string | null | undefined): string {
  const normalized = normalizePhone(input);
  if (!normalized) return '';
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}
