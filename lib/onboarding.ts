export interface OnboardingProfile {
  fullName?: string | null;
  phone?: string | null;
  primaryAreaId?: string | null;
  onboardingCompletedAt?: string | null;
}

export function normalizeBangladeshPhone(value: string): { local: string; international: string } | null {
  const ascii = value.replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
  const digits = ascii.replace(/\D/g, '');
  const local = digits.startsWith('880') ? `0${digits.slice(3)}` : digits;
  if (!/^01[3-9]\d{8}$/.test(local)) return null;
  return { local, international: `+880${local.slice(1)}` };
}

export function isOnboardingComplete(
  profile: OnboardingProfile | null | undefined
): boolean {
  return Boolean(
    profile?.onboardingCompletedAt &&
      profile.fullName?.trim() &&
      normalizeBangladeshPhone(profile.phone ?? '') &&
      profile.primaryAreaId?.trim()
  );
}
