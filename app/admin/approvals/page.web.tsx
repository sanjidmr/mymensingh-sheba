import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import ApprovalManagement from '@/components/admin/ApprovalManagement';
import { fetchAdminApprovalQueue } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export default async function AdminApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawPage = Array.isArray(resolved.page) ? resolved.page[0] : resolved.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);
  const result = await fetchAdminApprovalQueue(page, 25);

  return (
    <>
      <PageHeader
        title="সকল অনুমোদন"
        description="কমিউনিটি পোস্ট, বাসা ভাড়া ও মালিক, গৃহশিক্ষক, রক্তদাতা এবং গ্রাহক-জমা সার্ভিস প্রোফাইল একই তালিকা থেকে পর্যালোচনা করুন।"
        count={`অপেক্ষমাণ ${result.total.toLocaleString('bn-BD')} টি`}
      />
      {result.unavailable ? (
        <AdminError title="অনুমোদনের তালিকা লোড করা যায়নি" message={result.error} />
      ) : result.total === 0 ? (
        <AdminEmpty title="সব আপডেট" description="এখন কোনো পোস্ট বা প্রোফাইল অনুমোদনের অপেক্ষায় নেই।" />
      ) : (
        <>
          <ApprovalManagement rows={result.rows} />
          <nav className="mt-5 flex items-center justify-between gap-3" aria-label="অনুমোদন তালিকার পৃষ্ঠা">
            <span className="text-xs text-admin-muted">
              পৃষ্ঠা {page.toLocaleString('bn-BD')} / {Math.ceil(result.total / result.pageSize).toLocaleString('bn-BD')}
            </span>
            <div className="flex gap-2">
              {page > 1 && <Link href={`/admin/approvals?page=${page - 1}`} className="inline-flex min-h-10 items-center rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold">আগের</Link>}
              {page * result.pageSize < result.total && <Link href={`/admin/approvals?page=${page + 1}`} className="inline-flex min-h-10 items-center rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold">পরের</Link>}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
