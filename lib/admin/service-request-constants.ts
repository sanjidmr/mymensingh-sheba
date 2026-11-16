export const HOME_SERVICE_SLUGS = [
  'kajer-bua',
  'electrician',
  'plumber',
  'basha-paltano',
  'ac-fridge',
  'home-tutor',
  'home-moving',
] as const;

export const SERVICE_REQUEST_STATUSES = [
  'new',
  'submitted',
  'reviewing',
  'assigned',
  'contacted',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
] as const;

export function isHomeServiceSlug(value: string): value is (typeof HOME_SERVICE_SLUGS)[number] {
  return HOME_SERVICE_SLUGS.some((slug) => slug === value);
}
