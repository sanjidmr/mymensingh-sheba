import { Metadata } from 'next';
import { use } from 'react';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { StaffDetailShell } from '@/components/staff/StaffDetailShell';
import { fetchStaffProfileForMetadata } from '@/lib/staff-service-metadata';

const serviceUi = STAFF_SERVICE_UI.electrician;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchStaffProfileForMetadata(id);
  if (!profile) return { title: 'প্রোফাইল পাওয়া যায়নি' };
  return {
    title: `${profile.nameBn} - ${profile.titleBn} | ময়মনসিংহে ইলেকট্রিশিয়ান`,
    description: profile.aboutBn || `${profile.titleBn} - ময়মনসিংহ সিটি কর্পোরেশন এলাকায় সার্ভিস প্রদান করেন।`,
    openGraph: {
      title: `${profile.nameBn} - ${profile.titleBn}`,
      description: profile.aboutBn || '',
      images: profile.imageUrl ? [profile.imageUrl] : [],
      type: 'profile',
    },
  };
}

export default function ElectricianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <StaffDetailShell
      profileId={id}
      serviceSlug="electrician"
      serviceUi={serviceUi}
      heroGradient="from-amber-500 via-amber-600 to-amber-700"
      heroText="text-amber-100"
      heroBadge="ইলেকট্রিশিয়ান"
    />
  );
}