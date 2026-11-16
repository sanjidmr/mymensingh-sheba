import type { MetadataRoute } from 'next';

const SITE_URL = 'https://mymensinghsheba.com';

const STATIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/services',
  '/news',
  '/help',
  '/reviews',
  '/jobs',
  '/buy-sell',
  '/emergency-call',
  '/safety',
  '/how-it-works',
  '/mymensingh',
  '/home-moving',
  '/coaching',
  '/electrician',
  '/plumber',
  '/fire-service',
  '/fireservice',
  '/doctor',
  '/doctors',
  '/wifi',
  '/gari-auto-cng',
  '/basha-paltano',
  '/ac-fridge',
  '/kajer-bua',
  '/ambulance',
  '/police',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  return STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.7,
  }));
}
