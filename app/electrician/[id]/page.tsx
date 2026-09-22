import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchStaffProfileById } from '@/lib/staff-service';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { StaffDetail } from '@/components/staff/StaffDetail';
import type { StaffProfile } from '@/lib/staff-types';

const serviceUi = STAFF_SERVICE_UI.electrician;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const profile = await fetchStaffProfileById(id);
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

export default async function ElectricianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await fetchStaffProfileById(id);
  if (!profile || profile.serviceSlug !== 'electrician') notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-sm text-amber-100 mb-3">
            <span className="px-2.5 py-0.5 bg-white/15 rounded-full text-xs font-semibold">
              ইলেকট্রিশিয়ান
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{profile.nameBn}</h1>
          <p className="text-amber-100 mt-2 text-base sm:text-lg max-w-2xl">{profile.titleBn}</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 -mt-6 relative z-10">
        <StaffDetail profile={profile} serviceUi={serviceUi} />
      </section>
    </div>
  );
}