import Link from 'next/link';
import { HOMEPAGE_SECTIONS } from '@/lib/site-content';
import { getSiteContentOverrides } from '@/lib/site-content-server';
import { fetchPlatformSettings } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError } from '@/components/admin/States';
import { Panel } from '@/components/admin/PageHeader';
import WebsiteSections from '@/components/admin/website/WebsiteSections';
import WebsiteServices from '@/components/admin/website/WebsiteServices';
import WebsiteContact from '@/components/admin/website/WebsiteContact';
import WebsiteEditorial from '@/components/admin/website/WebsiteEditorial';
import { LAUNCH_SERVICES } from '@/lib/services-data';

export const dynamic = 'force-dynamic';

export default async function AdminWebsitePage() {
  const [overrides, settings] = await Promise.all([
    getSiteContentOverrides(),
    fetchPlatformSettings(),
  ]);

  if (settings.unavailable) {
    return (
      <>
        <PageHeader
          title="ওয়েবসাইট ম্যানেজমেন্ট"
          description="হোমপেজ সেকশন, সেবা কার্ড, ক্যাটাগরি ও সাইটের তথ্য পরিবর্তন করুন।"
        />
        <AdminError
          title={settings.error ? 'প্ল্যাটফর্ম সেটিংস লোড করা যায়নি' : 'ডেটাবেজ সংযুক্ত নেই'}
          message={settings.error}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="ওয়েবসাইট ম্যানেজমেন্ট"
        description="হোমপেজের সেকশন, সেবা তালিকা ও যোগাযোগের তথ্য এখানে পরিবর্তন করুন। পরিবর্তন সাথে সাথে ওয়েবসাইটে কার্যকর হয়।"
      />

      <div className="space-y-5">
        <Panel
          title="হোমপেজ সেকশন"
          description="হোমপেজের যেকোনো সেকশন চালু বা বন্ধ করুন। বন্ধ করলে সেকশনটি ওয়েবসাইটে দেখা যাবে না।"
        >
          <WebsiteSections
            sections={HOMEPAGE_SECTIONS}
            overrides={overrides.homepage_sections ?? {}}
          />
        </Panel>

        <Panel
          title="সেবা তালিকা"
          description="সেবা ডিরেক্টরি ও ফুটারে দেখানো সেবাগুলোর নাম, বিবরণ, ছবি ও ক্রম পরিবর্তন করুন।"
        >
          <WebsiteServices
            overrides={overrides.launch_services ?? LAUNCH_SERVICES.map((service) => ({
              slug: service.slug,
              nameBn: service.nameBn,
              nameEn: service.nameEn,
              shortDesc: service.shortDesc,
              coverImage: service.coverImage,
              sort_order: service.sortOrder,
            }))}
          />
        </Panel>

        <Panel
          title="যোগাযোগের তথ্য"
          description="ওয়েবসাইটে দেখানো ফোন, ইমেইল, সোশ্যাল মিডিয়া ও ঠিকানা।"
        >
          <WebsiteContact overrides={overrides.site_contact ?? {}} />
        </Panel>
        <Panel
          title="ঘোষণা, তথ্য পৃষ্ঠা, Footer ও SEO"
          description="সংরক্ষিত পরিবর্তন হোমপেজ, /about, /help, Footer এবং সাইটের social-sharing metadata-তে কার্যকর হয়।"
        >
          <WebsiteEditorial overrides={overrides} />
        </Panel>
        <Panel
          title="হিরো ও মিডিয়া"
          description="ক্যারোসেল ছবি, ক্রম ও সক্রিয় অবস্থা আলাদা হিরো ম্যানেজমেন্ট ও মিডিয়া লাইব্রেরিতে পরিচালিত হয়।"
        >
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/hero" className="inline-flex min-h-10 items-center rounded-md border border-admin-border px-3 font-semibold text-admin-navy hover:bg-admin-page">হিরো স্লাইড পরিচালনা</Link>
            <Link href="/admin/media" className="inline-flex min-h-10 items-center rounded-md border border-admin-border px-3 font-semibold text-admin-navy hover:bg-admin-page">মিডিয়া লাইব্রেরি</Link>
            <Link href="/admin/posts?kind=news" className="inline-flex min-h-10 items-center rounded-md border border-admin-border px-3 font-semibold text-admin-navy hover:bg-admin-page">Featured পোস্ট</Link>
          </div>
        </Panel>
      </div>
    </>
  );
}