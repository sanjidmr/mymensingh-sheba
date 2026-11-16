import { getSiteContentOverrides } from '@/lib/site-content-server';
import { resolveServiceCoverImage } from '@/lib/site-content';
import {
  SERVICE_REQUEST_PAGES,
  type RequestServiceSlug,
} from '@/lib/service-request-pages';

const CMS_SERVICE_SLUG: Record<RequestServiceSlug, string> = {
  'kajer-bua': 'kajer-bua',
  electrician: 'electrician',
  plumber: 'plumber',
  'basha-paltano': 'home-moving',
  'ac-fridge': 'ac-fridge',
};

export async function getServiceRequestPageConfig(slug: RequestServiceSlug) {
  const config = SERVICE_REQUEST_PAGES[slug];
  const overrides = await getSiteContentOverrides();
  const cmsSlug = CMS_SERVICE_SLUG[slug];
  const coverImage = overrides.launch_services?.find((service) => service.slug === cmsSlug)?.coverImage;
  const imageSrc = resolveServiceCoverImage(coverImage, config.image.src);

  return { ...config, image: { ...config.image, src: imageSrc ?? config.image.src } };
}
