import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { FileText, Home, Users } from 'lucide-react';
import { DetailField, PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminError } from '@/components/admin/States';
import { fetchAdminUserDetail, type AdminUserDetail } from '@/lib/admin/queries';
import { getAreaById } from '@/lib/locations';
import { formatDateTime } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function list(value: unknown): string {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').join(' · ') || '—'
    : '—';
}

function area(value: unknown): string {
  const id = text(value);
  return id ? getAreaById(id)?.nameBn ?? id : '—';
}

function FieldGrid({ fields }: { fields: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => <DetailField key={label} label={label}>{value || '—'}</DetailField>)}
    </dl>
  );
}

function ProfilePanel({
  title,
  fields,
}: {
  title: string;
  fields: Array<[string, ReactNode]>;
}) {
  return (
    <Panel title={title}>
      <FieldGrid fields={fields} />
    </Panel>
  );
}

function ItemsPanel({
  title,
  icon,
  items,
  empty,
  renderItem,
}: {
  title: string;
  icon: ReactNode;
  items: Record<string, unknown>[];
  empty: string;
  renderItem: (item: Record<string, unknown>) => { title: string; lines: string[]; href?: string };
}) {
  return (
    <Panel title={title} actions={<span className="text-xs text-admin-muted">{items.length.toLocaleString('bn-BD')} টি</span>}>
      {items.length === 0 ? (
        <p className="text-sm text-admin-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-admin-border">
          {items.map((item) => {
            const rendered = renderItem(item);
            const body = (
              <div className="flex min-w-0 gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 text-admin-muted">{icon}</span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-admin-text">{rendered.title || 'শিরোনাম নেই'}</p>
                  {rendered.lines.filter(Boolean).map((line, index) => (
                    <p key={index} className="mt-1 break-words text-xs leading-relaxed text-admin-muted">{line}</p>
                  ))}
                </div>
              </div>
            );
            return (
              <li key={text(item.id)}>
                {rendered.href ? <Link href={rendered.href} className="block hover:bg-admin-page/70">{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function ProfileContent({ detail }: { detail: AdminUserDetail }) {
  const { profile } = detail;
  const name = text(profile.full_name) || 'নাম নেই';
  const phone = text(profile.phone);
  const profileStatus = text(profile.status);
  return (
    <>
      <PageHeader
        title={name}
        description="অ্যাকাউন্ট, সার্ভিস প্রোফাইল, তৈরি করা পোস্ট এবং জমা দেওয়া অনুরোধের বিস্তারিত।"
        breadcrumb={{ href: '/admin/users', label: 'ইউজার তালিকায় ফিরুন' }}
        actions={phone ? <a href={`tel:${phone}`} className="inline-flex min-h-11 items-center rounded-lg bg-admin-navy px-4 text-sm font-semibold text-white">কল করুন</a> : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['তৈরি পোস্ট', detail.communityPosts.length],
          ['বাসা ভাড়া বিজ্ঞাপন', detail.toletListings.length],
          ['সার্ভিস প্রোফাইল', [detail.toletProfile, detail.tutorProfile, detail.donorProfile].filter(Boolean).length + detail.serviceListings.length],
          ['জমা অনুরোধ', detail.serviceRequests.length + detail.toletRequests.length + detail.vehicleRequests.length],
        ].map(([label, count]) => (
          <div key={label} className="rounded-admin-card border border-admin-border bg-white p-3">
            <p className="text-xs text-admin-muted">{label}</p>
            <p className="mt-1 text-xl font-bold text-admin-text">{Number(count).toLocaleString('bn-BD')}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <ProfilePanel
          title="ব্যক্তিগত তথ্য"
          fields={[
            ['প্রোফাইল আইডি', text(profile.public_id) || '—'],
            ['ফোন নম্বর', phone || '—'],
            ['ইমেইল', text(profile.email) || '—'],
            ['ঠিকানা / এলাকা', area(profile.primary_area_id)],
            ['অ্যাকাউন্ট', profileStatus === 'active' ? 'সক্রিয়' : profileStatus],
            ['ভূমিকা', text(profile.role) === 'admin' ? 'অ্যাডমিন' : 'কাস্টমার'],
            ['যাচাইকৃত', profile.is_verified === true ? 'হ্যাঁ' : 'না'],
            ['যোগদানের তারিখ', text(profile.created_at) ? formatDateTime(text(profile.created_at)) : '—'],
            ['জরুরি যোগাযোগ', text(profile.emergency_contact) || '—'],
            ['পরিচিতি', text(profile.bio) || '—'],
          ]}
        />

        {detail.toletProfile && (
          <ProfilePanel title="বাসা মালিক প্রোফাইল" fields={[
            ['নাম', text(detail.toletProfile.owner_name)],
            ['ফোন', text(detail.toletProfile.phone)],
            ['অবস্থা', text(detail.toletProfile.status)],
            ['ঠিকানা', `${area(detail.toletProfile.primary_area_id)}${text(detail.toletProfile.address_line) ? ` · ${text(detail.toletProfile.address_line)}` : ''}`],
            ['মোট বিজ্ঞাপন', text(detail.toletProfile.total_listings_count)],
            ['যাচাইকৃত', detail.toletProfile.is_verified === true ? 'হ্যাঁ' : 'না'],
            ...(text(detail.toletProfile.rejection_reason) ? [['প্রত্যাখ্যানের কারণ', text(detail.toletProfile.rejection_reason)] as [string, ReactNode]] : []),
          ]} />
        )}

        {detail.tutorProfile && (
          <ProfilePanel title="গৃহ শিক্ষক প্রোফাইল" fields={[
            ['নাম', text(detail.tutorProfile.full_name)],
            ['অবস্থা', text(detail.tutorProfile.status)],
            ['শিক্ষাপ্রতিষ্ঠান', text(detail.tutorProfile.institution)],
            ['বিভাগ / যোগ্যতা', [text(detail.tutorProfile.department), text(detail.tutorProfile.qualification)].filter(Boolean).join(' · ')],
            ['অভিজ্ঞতা', `${text(detail.tutorProfile.experience_years) || '০'} বছর`],
            ['এলাকা', list(detail.tutorProfile.preferred_areas)],
            ['শ্রেণি', list(detail.tutorProfile.preferred_classes)],
            ['বিষয়', list(detail.tutorProfile.preferred_subjects)],
            ['প্রত্যাশিত বেতন', `৳${text(detail.tutorProfile.expected_salary) || '০'}`],
            ['পরিচিতি', text(detail.tutorProfile.bio) || '—'],
          ]} />
        )}

        {detail.donorProfile && (
          <ProfilePanel title="রক্তদাতা প্রোফাইল" fields={[
            ['নাম', text(detail.donorProfile.full_name)],
            ['অবস্থা', text(detail.donorProfile.status)],
            ['রক্তের গ্রুপ', text(detail.donorProfile.blood_group)],
            ['এলাকা', area(detail.donorProfile.area_id)],
            ['উপলভ্যতা', detail.donorProfile.is_available === true ? 'রক্তদানে প্রস্তুত' : 'এখন উপলভ্য নন'],
            ['রক্তদানের সংখ্যা', text(detail.donorProfile.donation_count)],
            ['পরিচিতি', text(detail.donorProfile.intro) || '—'],
          ]} />
        )}

        <ItemsPanel
          title="তৈরি করা পোস্ট"
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
          items={detail.communityPosts}
          empty="এই ইউজারের তৈরি কোনো পোস্ট নেই।"
          renderItem={(item) => ({
            title: text(item.title_bn),
            lines: [
              `${text(item.kind)} · ${text(item.status)}`,
              [
                text(item.category),
                area(item.area_id),
                text(item.organization_bn),
                text(item.job_type),
                item.price != null ? `৳${text(item.price)}` : '',
                item.salary_min != null || item.salary_max != null ? `৳${text(item.salary_min) || '০'}–${text(item.salary_max) || '০'}` : '',
                text(item.deadline) ? `শেষ তারিখ: ${text(item.deadline)}` : '',
                text(item.created_at) ? formatDateTime(text(item.created_at)) : '',
              ].filter(Boolean).join(' · '),
              text(item.summary_bn) || text(item.body_bn),
            ],
            href: `/admin/posts/${text(item.id)}`,
          })}
        />
        <ItemsPanel
          title="বাসা ভাড়া বিজ্ঞাপন"
          icon={<Home className="h-4 w-4" aria-hidden="true" />}
          items={detail.toletListings}
          empty="এই ইউজারের কোনো বাসা ভাড়ার বিজ্ঞাপন নেই।"
          renderItem={(item) => ({
            title: text(item.title),
            lines: [
              `${text(item.property_type)} · ${text(item.status)} · ৳${text(item.rent_price)}`,
              `${area(item.area_id)}${text(item.specific_address) ? ` · ${text(item.specific_address)}` : ''}`,
              text(item.description),
              list(item.facilities),
              text(item.created_at) ? formatDateTime(text(item.created_at)) : '',
            ],
            href: `/admin/tolet/${text(item.id)}`,
          })}
        />
        <ItemsPanel
          title="অন্যান্য সার্ভিস প্রোফাইল"
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          items={detail.serviceListings}
          empty="এই ইউজারের অন্য কোনো সার্ভিস তালিকা নেই।"
          renderItem={(item) => ({
            title: text(item.title_bn),
            lines: [
              `${text(item.category)} · ${text(item.status)}`,
              [text(item.summary_bn), list(item.area_ids)].filter(Boolean).join(' · '),
              text(item.address_bn) || text(item.description_bn),
              text(item.created_at) ? formatDateTime(text(item.created_at)) : '',
            ],
            href: `/admin/directories/${text(item.category)}/${text(item.id)}/edit`,
          })}
        />

        {[
          { title: 'সাধারণ সেবা অনুরোধ', icon: <FileText className="h-4 w-4" aria-hidden="true" />, items: detail.serviceRequests },
          { title: 'বাসা ভাড়া অনুরোধ', icon: <Home className="h-4 w-4" aria-hidden="true" />, items: detail.toletRequests },
          { title: 'যানবাহন অনুরোধ', icon: <FileText className="h-4 w-4" aria-hidden="true" />, items: detail.vehicleRequests },
        ].map(({ title, icon, items }) => (
          <ItemsPanel
            key={title}
            title={title}
            icon={icon}
            items={items}
            empty="এই ধরনের কোনো অনুরোধ নেই।"
            renderItem={(item) => {
              const route = item.pickup_area_id
                ? `${area(item.pickup_area_id)}${text(item.destination_area_id) ? ` → ${area(item.destination_area_id)}` : ''}`
                : area(item.area_id);
              const date = text(item.created_at) ? formatDateTime(text(item.created_at)) : '';
              const travel = [text(item.travel_date), text(item.travel_time)].filter(Boolean).join(' · ');
              return {
                title: text(item.contact_name) || text(item.service_type) || text(item.service_slug) || 'সেবা অনুরোধ',
                lines: [
                  `${text(item.status)}${route !== '—' ? ` · ${route}` : ''}`,
                  [text(item.details), text(item.message), text(item.notes), text(item.quotation), text(item.admin_notes), travel].filter(Boolean).join(' · '),
                  date,
                ],
              };
            }}
            />
        ))}
      </div>
    </>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchAdminUserDetail(id);
  if (result.error) {
    return <><PageHeader title="ইউজার বিস্তারিত" breadcrumb={{ href: '/admin/users', label: 'ইউজার তালিকায় ফিরুন' }} /><AdminError title="ইউজারের তথ্য লোড করা যায়নি" message={result.error} /></>;
  }
  if (!result.data) notFound();
  return <ProfileContent detail={result.data} />;
}
