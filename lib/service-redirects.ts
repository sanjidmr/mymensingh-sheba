/**
 * Human-friendly `/services/<slug>` aliases for the homepage "আরও দেখুন" links.
 * Each alias route immediately redirects to the canonical service page,
 * so no content is duplicated and links always work.
 */
export interface ServiceRedirectMap {
  slug: string;
  target: string;
}

export const SERVICE_REDIRECTS: ServiceRedirectMap[] = [
  { slug: 'toilet', target: '/tolet' },
  { slug: 'to-let', target: '/tolet' },
  { slug: 'electrician', target: '/electrician' },
  { slug: 'plumber', target: '/plumber' },
  { slug: 'maid', target: '/kajer-bua' },
  { slug: 'kajer-bua', target: '/kajer-bua' },
  { slug: 'tutor', target: '/home-tutor' },
  { slug: 'home-tutor', target: '/home-tutor' },
  { slug: 'blood-donor', target: '/blood-donor' },
  { slug: 'home-moving', target: '/home-moving' },
];