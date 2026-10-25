import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Clock3, MapPin, Phone, Users } from 'lucide-react';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { PageHeader, DetailField, Panel } from '@/components/admin/PageHeader';
import VehicleRequestActions from '@/components/admin/VehicleRequestActions';
import { fetchAssignableVehicles, fetchVehicleRequestById } from '@/lib/admin/queries';
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
        <PageHeader title="যানবাহন বুকিং অনুরোধ" breadcrumb={{ href: '/admin/vehicle-requests', label: 'যানবাহন বুকিং অনুরোধ' }} />
        <AdminError title="রিকোয়েস্ট লোড করা যায়নি" message={result.error} />
      </>
    );
  }

  if (!result.row) {
    return (
      <>
        <PageHeader title="যানবাহন বুকিং অনুরোধ" breadcrumb={{ href: '/admin/vehicle-requests', label: 'যানবাহন বুকিং অনুরোধ' }} />
        <AdminEmpty
          title="রিকোয়েস্টটি পাওয়া যায়নি"
          description="রেকর্ডটি নেই অথবা লিংকটি ভুল।"
          action={
            <Link
              href="/admin/vehicle-requests"
              className="inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
            >
              রিকোয়েস্ট তালিকায় ফিরুন
            </Link>
          }
        />
      </>
    );
  }

  const booking = result.row;
  const assignableVehicles = await fetchAssignableVehicles();
  const pickup = booking.pickup_area_id ? getAreaById(booking.pickup_area_id) : undefined;
  const destination = booking.destination_area_id ? getAreaById(booking.destination_area_id) : undefined;
  const title = booking.vehicle_name || booking.vehicle_kind;

  return (
    <>
      <PageHeader
        title="যানবাহন বুকিং অনুরোধ"
        description={`রেফারেন্স ${booking.reference_code || booking.id} · ${title} · জমা ${formatDateTime(booking.created_at)} · সর্বশেষ আপডেট ${formatDateTime(booking.updated_at)}`}
        breadcrumb={{ href: '/admin/vehicle-requests', label: 'যানবাহন বুকিং অনুরোধ' }}
        actions={<VehicleRequestActions request={booking} vehicles={assignableVehicles} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="যাত্রার বিবরণ">
          {booking.vehicle_image_url && (
            <div className="relative mb-4 h-44 w-full overflow-hidden rounded-lg bg-mist-100 sm:max-w-sm">
              <Image
                src={booking.vehicle_image_url}
                alt={booking.vehicle_title || booking.vehicle_name || 'নির্বাচিত যানবাহন'}
                fill
                sizes="(max-width: 640px) 100vw, 384px"
                unoptimized
                className="object-cover"
              />
            </div>
          )}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="রিকোয়েস্টে দেওয়া ধরন">{booking.vehicle_kind}</DetailField>
            <DetailField label="রিকোয়েস্টে সংরক্ষিত নাম">{booking.vehicle_name || 'উল্লেখ নেই'}</DetailField>
            <DetailField label="তালিকায় সংরক্ষিত ধরন">{booking.vehicle_listing_kind || (booking.vehicle_title ? 'উল্লেখ নেই' : 'তালিকা সংযুক্ত নেই')}</DetailField>
            <DetailField label="যানবাহন তালিকা ID">{booking.vehicle_listing_id || 'বর্তমান তালিকা সংযুক্ত নেই'}</DetailField>
            <DetailField label="বর্তমান তালিকা" wide>
              {booking.vehicle_title && booking.vehicle_slug ? (
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {booking.vehicle_is_active
                    ? <Link className="text-brand-700 hover:underline" href={`/gari-auto-cng/${booking.vehicle_slug}`}>{booking.vehicle_title}</Link>
                    : <span>{booking.vehicle_title} (অপ্রকাশিত)</span>}
                  <Link className="text-brand-700 hover:underline" href={`/admin/directories/vehicle/${booking.vehicle_listing_id}/edit`}>অ্যাডমিন তালিকা</Link>
                </span>
              ) : (
                <span>বর্তমান তালিকা সংযুক্ত নেই। রিকোয়েস্টের সংরক্ষিত নাম উপরে দেখানো হয়েছে।</span>
              )}
            </DetailField>
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
            <DetailField label="আনুমানিক দূরত্ব">
              {booking.estimated_distance_km != null
                ? `${booking.estimated_distance_km.toLocaleString('bn-BD')} কিমি · ${booking.distance_source === 'road_route' ? 'সড়কপথ' : 'গ্রাহকের ম্যানুয়াল অনুমান'}`
                : 'পুরোনো অনুরোধে দূরত্ব সংরক্ষিত হয়নি'}
            </DetailField>
            <DetailField label="দর ও আনুমানিক ভাড়া">
              {booking.rate_per_km != null
                ? `৳${booking.rate_per_km.toLocaleString('bn-BD', { maximumFractionDigits: 2 })} / কিমি · আনুমানিক মোট ৳${booking.estimated_fare?.toLocaleString('bn-BD', { maximumFractionDigits: 2 }) ?? '—'}${booking.minimum_fare != null ? ` · ন্যূনতম ৳${booking.minimum_fare.toLocaleString('bn-BD', { maximumFractionDigits: 2 })}` : ''}${booking.additional_fee ? ` · অতিরিক্ত ৳${booking.additional_fee.toLocaleString('bn-BD', { maximumFractionDigits: 2 })}${booking.additional_fee_note_bn ? ` (${booking.additional_fee_note_bn})` : ''}` : ''}`
                : 'তালিকায় দর ছিল না; ভাড়ার কোটেশন লাগবে'}
            </DetailField>
            <DetailField label="নির্ধারিত যানবাহন">
              {booking.assigned_vehicle_listing_id
                ? assignableVehicles.find((vehicle) => vehicle.id === booking.assigned_vehicle_listing_id)?.title_bn
                  ?? (booking.assigned_vehicle_listing_id === booking.vehicle_listing_id ? booking.vehicle_title : null)
                  ?? 'সংরক্ষিত যানবাহন আর সক্রিয় নেই'
                : 'নির্ধারণ করা হয়নি'}
            </DetailField>
            <DetailField label="নির্ধারিত চালক">
              {booking.assigned_driver_name || 'নির্ধারণ করা হয়নি'}
              {booking.assigned_driver_phone ? ` · ${booking.assigned_driver_phone}` : ''}
            </DetailField>
            <DetailField label="অতিরিক্ত নির্দেশনা" wide>
              <span className="whitespace-pre-wrap">{booking.notes || 'কোনো অতিরিক্ত তথ্য দেওয়া হয়নি।'}</span>
            </DetailField>
            <DetailField label="অ্যাডমিন নোট" wide>
              <span className="whitespace-pre-wrap">{booking.admin_notes || 'কোনো নোট নেই।'}</span>
            </DetailField>
          </dl>
        </Panel>

        <Panel title="গ্রাহকের যোগাযোগ">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailField label="প্রোফাইলের নাম">{booking.customer_full_name || 'প্রোফাইল সংযুক্ত নেই'}</DetailField>
            <DetailField label="রিকোয়েস্টে দেওয়া নাম">{booking.contact_name}</DetailField>
            <DetailField label="ফোন">
              <a className="inline-flex items-center gap-1.5 text-brand-700 hover:underline" href={`tel:${booking.contact_phone}`}>
                <Phone className="h-3.5 w-3.5" />
                {booking.contact_phone}
              </a>
            </DetailField>
            <DetailField label="রিকোয়েস্টের অবস্থা">{booking.status}</DetailField>
            <DetailField label="জমা দেওয়ার সময়">{formatDateTime(booking.created_at)}</DetailField>
            <DetailField label="সর্বশেষ আপডেট">{formatDateTime(booking.updated_at)}</DetailField>
            <DetailField label="নোট" wide>
              অবস্থা পরিবর্তন বুকিং, পেমেন্ট বা চালক নিশ্চিত করে না। এই ব্যবস্থায় বাহ্যিক বুকিং ইন্টিগ্রেশন নেই।
            </DetailField>
          </dl>
        </Panel>
      </div>
    </>
  );
}
