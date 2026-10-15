import Link from 'next/link';
import { BusFront, GraduationCap, Router } from 'lucide-react';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminError } from '@/components/admin/States';
import { StatCard } from '@/components/admin/StatCard';
import { fetchServiceListings, parseListParams } from '@/lib/admin/queries';
import type { ServiceCategory } from '@/lib/catalog-types';

export const dynamic = 'force-dynamic';

const MODULES: Array<{
  category: ServiceCategory;
  title: string;
  description: string;
  href: string;
  icon: typeof BusFront;
}> = [
  {
    category: 'bus',
    title: 'বাস টিকিট তথ্য',
    description: 'অপারেটর, রুট, সময় ও সরবরাহকৃত ভাড়ার তথ্য। বুকিং নয়।',
    href: '/admin/catalog/bus',
    icon: BusFront,
  },
  {
    category: 'wifi',
    title: 'WiFi প্রদানকারী',
    description: 'প্রদানকারী, কভারেজ, স্পিড ও মূল্যতথ্য পরিচালনা করুন।',
    href: '/admin/catalog/wifi',
    icon: Router,
  },
  {
    category: 'coaching',
    title: 'কোচিং সেন্টার',
    description: 'প্রতিষ্ঠান, ক্লাস, বিষয় এবং সরবরাহকৃত ফি পরিচালনা করুন।',
    href: '/admin/catalog/coaching',
    icon: GraduationCap,
  },
];

export default async function AdminCatalogPage() {
  const counts = await Promise.all(
    MODULES.map(async (module) => ({
      category: module.category,
      result: await fetchServiceListings(parseListParams({}, { pageSize: 1 }), module.category),
    })),
  );
  const failed = counts.find(({ result }) => result.unavailable);

  return (
    <>
      <PageHeader
        title="ডিরেক্টরি ব্যবস্থাপনা"
        description="বাস, WiFi ও কোচিং ডিরেক্টরির বিদ্যমান রেকর্ড পরিচালনা করুন। সক্রিয় মান প্রকাশিত; এটি যাচাইকরণ বা প্রাপ্যতার প্রমাণ নয়।"
        actions={<Link href="/admin/vehicle-requests" className="inline-flex min-h-11 items-center rounded-md border border-admin-border bg-white px-3 text-sm font-semibold">যানবাহন রিকোয়েস্ট</Link>}
      />
      {failed && <AdminError title="ডিরেক্টরি গণনা করা যায়নি" message={failed.result.error} className="mb-4" />}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MODULES.map((module) => {
          const result = counts.find((item) => item.category === module.category)?.result;
          const Icon = module.icon;
          return (
            <Panel key={module.category} className="h-full" bodyClassName="flex h-full flex-col">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-admin-page text-admin-navy">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-admin-text">{module.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-admin-muted">{module.description}</p>
                </div>
              </div>
              {!result?.unavailable && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <StatCard label="মোট" value={result?.counts.total ?? 0} />
                  <StatCard label="প্রকাশিত" value={result?.counts.active ?? 0} tone="good" />
                  <StatCard label="অপ্রকাশিত" value={result?.counts.inactive ?? 0} />
                </div>
              )}
              <Link href={module.href} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90">
                মডিউল খুলুন
              </Link>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
