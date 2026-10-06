import { Metadata } from 'next';
import { use } from 'react';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { StaffDetailShell } from '@/components/staff/StaffDetailShell';
import { fetchStaffProfileForMetadata } from '@/lib/staff-service-metadata';

const serviceUi = STAFF_SERVICE_UI['kajer-bua'];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchStaffProfileForMetadata(id);
  if (!profile) return { title: 'প্রোফাইল পাওয়া যায়নি' };
  return {
    title: `${profile.nameBn} - ${profile.titleBn} | ময়মনসিংহে কাজের বুয়া`,
    description: profile.aboutBn || `${profile.titleBn} - ময়মনসিংহ সিটি কর্পোরেশন এলাকায় সার্ভিস প্রদান করেন।`,
    openGraph: {
      title: `${profile.nameBn} - ${profile.titleBn}`,
      description: profile.aboutBn || '',
      type: 'profile',
    },
  };
}

export default function KajerBuaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <StaffDetailShell
      profileId={id}
      serviceSlug="kajer-bua"
      serviceUi={serviceUi}
      heroGradient="from-emerald-700 via-emerald-800 to-emerald-900"
      heroText="text-emerald-100"
      heroBadge="কাজের বুয়া"
      imageless
    />
  );
}