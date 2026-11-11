export const SITE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

const FILE_EXTENSION_BY_TYPE: Record<(typeof SITE_IMAGE_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export function siteMediaPath(folder: string, file: File): string {
  const safeFolder = folder.replace(/^\/+|\/+$/g, '');
  if (
    !/^[a-z0-9][a-z0-9_/-]{0,40}$/i.test(safeFolder) ||
    safeFolder.includes('//') ||
    safeFolder.split('/').some((part) => part === '.' || part === '..')
  ) {
    throw new Error('ছবির ফোল্ডার সঠিক নয়।');
  }
  const extension = FILE_EXTENSION_BY_TYPE[file.type as (typeof SITE_IMAGE_TYPES)[number]];
  if (!extension) throw new Error('শুধুমাত্র JPG, PNG, WebP বা AVIF ছবি আপলোড করা যাবে।');
  return `${safeFolder}/${crypto.randomUUID()}.${extension}`;
}

export function validateSiteImage(file: File): string | null {
  if (!SITE_IMAGE_TYPES.includes(file.type as (typeof SITE_IMAGE_TYPES)[number])) {
    return 'শুধুমাত্র JPG, PNG, WebP বা AVIF ছবি আপলোড করা যাবে।';
  }
  if (file.size === 0) return 'ফাইলটি খালি, অনুগ্রহ করে আরেকটি ছবি বেছে নিন।';
  return null;
}
