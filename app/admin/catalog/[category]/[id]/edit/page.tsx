import { notFound } from 'next/navigation';
import ServiceListingForm from '@/components/admin/ServiceListingForm';
import ListingSubEntities from '@/components/admin/ListingSubEntities';
import { AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { fetchAdminServiceListing } from '@/lib/admin/queries';
import type { ServiceCategory } from '@/lib/catalog-types';

const CATEGORIES: ServiceCategory[] = ['vehicle', 'bus', 'wifi', 'coaching'];

export const dynamic = 'force-dynamic';

export default async function EditServiceListingPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category, id } = await params;
  if (!CATEGORIES.includes(category as ServiceCategory)) notFound();
  let listing;
  try {
    listing = await fetchAdminServiceListing(id);
  } catch (error) {
    return (
      <>
        <PageHeader title="তালিকা সম্পাদনা" breadcrumb={{ href: `/admin/catalog/${category}`, label: 'তালিকা' }} />
        <AdminError title="তালিকা লোড করা যায়নি" message={error instanceof Error ? error.message : undefined} />
      </>
    );
  }
  if (!listing || listing.category !== category) notFound();
  return (
    <div className="space-y-6">
      <ServiceListingForm category={category as ServiceCategory} listing={listing} />
      <ListingSubEntities category={category as ServiceCategory} listingId={listing.id} />
    </div>
  );
}
