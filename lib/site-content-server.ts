import { createClient } from '@supabase/supabase-js';
import { cache } from 'react';
import type { SiteContentOverrides } from './site-content';

const OVERRIDE_KEYS = new Set([
  'homepage_sections',
  'launch_services',
  'site_contact',
  'announcement',
  'about_content',
  'faq_content',
  'footer_content',
  'seo',
]);

export const getSiteContentOverrides = cache(async (): Promise<SiteContentOverrides> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return {};

  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client
    .from('platform_settings')
    .select('key, value')
    .in('key', Array.from(OVERRIDE_KEYS));

  if (error) {
    console.error('Site content overrides could not be loaded.', error.message);
    return {};
  }
  if (!Array.isArray(data)) {
    console.error('Site content overrides returned an invalid response.');
    return {};
  }

  const overrides: SiteContentOverrides = {};
  for (const row of data) {
    const value = row.value;
    if (!value || typeof value !== 'object') continue;

    switch (row.key) {
      case 'homepage_sections': {
        const obj = value as Record<string, unknown>;
        overrides.homepage_sections = {};
        for (const [key, val] of Object.entries(obj)) {
          overrides.homepage_sections[key] = val === true;
        }
        break;
      }
      case 'launch_services': {
        overrides.launch_services = Array.isArray(value)
          ? (value as SiteContentOverrides['launch_services'])
          : [];
        break;
      }
      case 'site_contact': {
        const obj = value as {
          phone?: string | null;
          email?: string | null;
          officeAddress?: string | null;
          serviceAreaBn?: string | null;
          hoursBn?: string | null;
          socials?: { icon: string; labelBn: string; href: string | null }[];
        };
        overrides.site_contact = {
          phone: obj.phone ?? null,
          email: obj.email ?? null,
          officeAddress: obj.officeAddress ?? null,
          serviceAreaBn: obj.serviceAreaBn ?? null,
          hoursBn: obj.hoursBn ?? null,
          socials: obj.socials?.map((s) => ({
            icon: s.icon === 'messenger' ? 'messenger' : 'facebook',
            labelBn: s.labelBn,
            href: s.href && /^https:\/\/\S+$/i.test(s.href) ? s.href : null,
          })) ?? [],
        };
        break;
      }
      case 'announcement': {
        const obj = value as Record<string, unknown>;
        overrides.announcement = {
          enabled: obj.enabled === true,
          title: typeof obj.title === 'string' ? obj.title : '',
          body: typeof obj.body === 'string' ? obj.body : '',
          href: typeof obj.href === 'string' &&
            obj.href.startsWith('/') &&
            !obj.href.startsWith('//') &&
            !obj.href.includes('\\') ? obj.href : null,
          linkLabel: typeof obj.linkLabel === 'string' ? obj.linkLabel : null,
        };
        break;
      }
      case 'about_content': {
        const obj = value as Record<string, unknown>;
        overrides.about_content = {
          heading: typeof obj.heading === 'string' ? obj.heading : '',
          intro: typeof obj.intro === 'string' ? obj.intro : '',
        };
        break;
      }
      case 'faq_content': {
        overrides.faq_content = Array.isArray(value)
          ? value.filter((item): item is { question: string; answer: string } => (
              Boolean(item) &&
              typeof item === 'object' &&
              typeof (item as Record<string, unknown>).question === 'string' &&
              typeof (item as Record<string, unknown>).answer === 'string'
            ))
          : [];
        break;
      }
      case 'footer_content': {
        const obj = value as Record<string, unknown>;
        const validLinks = (items: unknown) => Array.isArray(items)
          ? items.filter((item): item is { label: string; href: string } => (
              Boolean(item) &&
              typeof item === 'object' &&
              typeof (item as Record<string, unknown>).label === 'string' &&
              typeof (item as Record<string, unknown>).href === 'string' &&
              (item as Record<string, string>).href.startsWith('/') &&
              !(item as Record<string, string>).href.startsWith('//') &&
              !(item as Record<string, string>).href.includes('\\')
            ))
          : [];
        overrides.footer_content = {
          description: typeof obj.description === 'string' ? obj.description : '',
          companyLinks: validLinks(obj.companyLinks),
          supportLinks: validLinks(obj.supportLinks),
        };
        break;
      }
      case 'seo': {
        const obj = value as Record<string, unknown>;
        overrides.seo = {
          title: typeof obj.title === 'string' ? obj.title : '',
          description: typeof obj.description === 'string' ? obj.description : '',
          ogImage: typeof obj.ogImage === 'string' &&
            (obj.ogImage.startsWith('/') && !obj.ogImage.startsWith('//') ||
              /^https:\/\/\S+$/i.test(obj.ogImage)) ? obj.ogImage : null,
        };
        break;
      }
    }
  }

  return overrides;
});
