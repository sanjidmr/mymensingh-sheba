const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'] as const;

/**
 * Converts ASCII digits inside a string or number into Bengali numerals.
 * Used across the Mymensingh পরিচিতি page so years and counts read natively
 * (১৭৮৭ instead of 1787) without hand-typing digits in every data file.
 */
export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
}
