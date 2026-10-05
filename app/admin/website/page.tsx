import { HOMEPAGE_SECTIONS } from '@/lib/site-content';
import { getSiteContentOverrides } from '@/lib/site-content-server';
import { fetchPlatformSettings } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError } from '@/components/admin/States';
import { Panel } from '@/components/admin/PageHeader';
import WebsiteSections from '@/components/admin/website/WebsiteSections';
import WebsiteServices from '@/components/admin/website/WebsiteServices';
import WebsiteContact from '@/components/admin/website/WebsiteContact';

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
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
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
          <WebsiteServices overrides={overrides.launch_services ?? []} />
        </Panel>

        <Panel
          title="যোগাযোগের তথ্য"
          description="ওয়েবসাইটে দেখানো ফোন, ইমেইল, সোশ্যাল মিডিয়া ও ঠিকানা।"
        >
          <WebsiteContact overrides={overrides.site_contact ?? {}} />
        </Panel>
      </div>
    </>
  );
}