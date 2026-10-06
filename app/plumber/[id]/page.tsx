import { Metadata } from 'next';
import { use } from 'react';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { StaffDetailShell } from '@/components/staff/StaffDetailShell';
import { fetchStaffProfileForMetadata } from '@/lib/staff-service-metadata';

const serviceUi = STAFF_SERVICE_UI.plumber;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchStaffProfileForMetadata(id);
  if (!profile) return { title: 'প্রোফাইল পাওয়া যায়নি' };
  return {
    title: `${profile.nameBn} - ${profile.titleBn} | ময়মনসিংহে প্লাম্বার`,
    description: profile.aboutBn || `${profile.titleBn} - ময়মনসিংহ সিটি কর্পোরেশন এলাকায় সার্ভিস প্রদান করেন।`,
    openGraph: {
      title: `${profile.nameBn} - ${profile.titleBn}`,
      description: profile.aboutBn || '',
      images: profile.imageUrl ? [profile.imageUrl] : [],
      type: 'profile',
    },
  };
}

export default function PlumberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <StaffDetailShell
      profileId={id}
      serviceSlug="plumber"
      serviceUi={serviceUi}
      heroGradient="from-cyan-500 via-cyan-600 to-cyan-700"
      heroText="text-cyan-100"
      heroBadge="প্লাম্বার"
    />
  );
}