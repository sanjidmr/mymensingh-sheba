import { notFound } from 'next/navigation';
import ServiceListingForm from '@/components/admin/ServiceListingForm';
import type { ServiceCategory } from '@/lib/catalog-types';

const CATEGORIES: ServiceCategory[] = ['vehicle', 'bus', 'wifi', 'coaching'];

export default async function NewServiceListingPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!CATEGORIES.includes(category as ServiceCategory)) notFound();
  return <ServiceListingForm category={category as ServiceCategory} />;
}
