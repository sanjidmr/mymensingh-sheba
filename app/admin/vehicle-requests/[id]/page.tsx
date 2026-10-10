import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, MapPin, Phone, Users } from 'lucide-react';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { PageHeader, DetailField, Panel } from '@/components/admin/PageHeader';
import VehicleRequestActions from '@/components/admin/VehicleRequestActions';
import { fetchVehicleRequestById } from '@/lib/admin/queries';
import { formatDateTime, formatDate } from '@/lib/admin/format';
import { getAreaById } from '@/lib/locations';

export const dynamic = 'force-dynamic';

export default async function AdminVehicleRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchVehicleRequestById(id);

  if (result.unavailable) {
    return (
      <>
        <PageHeader title="গাড়ি বুকিং" breadcrumb={{ href: '/admin/vehicle-requests', label: 'গাড়ি রিকোয়েস্ট' }} />
        <AdminError title="বুকিং লোড করা যায়নি" message={result.error} />
      </>
    );
  }

  if (!result.row) {
    return (
      <>
        <PageHeader title="গাড়ি বুকিং" breadcrumb={{ href: '/admin/vehicle-requests', label: 'গাড়ি রিকোয়েস্ট' }} />
        <AdminEmpty
          title="বুকিংটি পাওয়া যায়নি"
          description="রেকর্ডটি মুছে ফেলা হয়েছে অথবা লিংকটি ভুল।"
          action={
            <Link
              href="/admin/vehicle-requests"
              className="inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            >
              বুকিং তালিকায় ফিরুন
            </Link>
          }
        />
      </>
    );
  }

  const booking = result.row;
  const pickup = booking.pickup_area_id ? getAreaById(booking.pickup_area_id) : undefined;
  const destination = booking.destination_area_id ? getAreaById(booking.destination_area_id) : undefined;
  const title = booking.vehicle_name || booking.vehicle_kind;

  return (
    <>
      <PageHeader
        title="গাড়ি, অটো ও CNG বুকিং"
        description={`${title} · জমা ${formatDateTime(booking.created_at)}`}
        breadcrumb={{ href: '/admin/vehicle-requests', label: 'গাড়ি রিকোয়েস্ট' }}
        actions={<VehicleRequestActions request={booking} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="যাত্রার বিবরণ">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="যানবাহনের ধরন">{booking.vehicle_kind}</DetailField>
            <DetailField label="যানবাহন / তালিকা">{booking.vehicle_name || '—'}</DetailField>
            <DetailField label="পিকআপ এলাকা">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-ink-400" />
                {pickup?.nameBn ?? booking.pickup_area_id ?? '—'}
              </span>
            </DetailField>
            <DetailField label="গন্তব্য এলাকা">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-ink-400" />
                {destination?.nameBn ?? booking.destination_area_id ?? '—'}
              </span>
            </DetailField>
            <DetailField label="যাত্রার তারিখ">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
                {formatDate(booking.travel_date)}
              </span>
            </DetailField>
            <DetailField label="যাত্রার সময়">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-ink-400" />
                {booking.travel_time || 'উল্লেখ নেই'}
              </span>
            </DetailField>
            <DetailField label="যাত্রী সংখ্যা">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-ink-400" />
                {booking.passenger_count ?? 'উল্লেখ নেই'}
              </span>
            </DetailField>
            <DetailField label="ভ্রমণের সময়কাল">{booking.trip_duration || 'উল্লেখ নেই'}</DetailField>
            <DetailField label="বাজেট">
              {booking.budget ? `৳${booking.budget.toLocaleString('bn-BD')}` : 'উল্লেখ নেই'}
            </DetailField>
            <DetailField label="অতিরিক্ত নির্দেশনা" wide>
              <span className="whitespace-pre-wrap">{booking.notes || 'কোনো অতিরিক্ত তথ্য দেওয়া হয়নি।'}</span>
            </DetailField>
          </dl>
        </Panel>

        <Panel title="গ্রাহকের যোগাযোগ">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="নাম">{booking.contact_name}</DetailField>
            <DetailField label="ফোন">
              <a className="inline-flex items-center gap-1.5 text-brand-700 hover:underline" href={`tel:${booking.contact_phone}`}>
                <Phone className="h-3.5 w-3.5" />
                {booking.contact_phone}
              </a>
            </DetailField>
            <DetailField label="বুকিং স্ট্যাটাস">{booking.status}</DetailField>
            <DetailField label="জমা দেওয়ার সময়">{formatDateTime(booking.created_at)}</DetailField>
          </dl>
        </Panel>
      </div>
    </>
  );
}
