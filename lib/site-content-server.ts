import type { SiteContentOverrides } from './site-content';

const OVERRIDE_KEYS = new Set(['homepage_sections', 'launch_services', 'site_contact']);

export async function getSiteContentOverrides(): Promise<SiteContentOverrides> {
  const { createServerSideClient } = await import('@/lib/supabase/server');
  const client = await createServerSideClient();
  if (!client) return {};

  const { data, error } = await client
    .from('platform_settings')
    .select('key, value')
    .in('key', Array.from(OVERRIDE_KEYS));

  if (error || !Array.isArray(data)) return {};

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
            href: s.href ?? null,
          })) ?? [],
        };
        break;
      }
    }
  }

  return overrides;
}
