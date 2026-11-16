import DirectoryShell from '@/components/directory/DirectoryShell';
import VehicleCategoryCards from '@/components/vehicle-booking/VehicleCategoryCards';

export default function VehicleDirectory() {
  return (
    <DirectoryShell
      title="গাড়ি, অটো ও CNG ভাড়া"
      subtitle="আপনার যাত্রার জন্য যানবাহন বেছে নিয়ে ভাড়ার অনুরোধ পাঠান।"
      breadcrumbs={[{ label: 'গাড়ি, অটো ও CNG ভাড়া' }]}
    >
      <VehicleCategoryCards className="mt-5" />
    </DirectoryShell>
  );
}