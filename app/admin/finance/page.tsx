import Link from 'next/link';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError } from '@/components/admin/States';
import FinanceManagement from '@/components/admin/FinanceManagement';
import { fetchAdminFinancialManagement } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

function dhakaToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const rawPage = Array.isArray(resolved.page) ? resolved.page[0] : resolved.page;
  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);
  const result = await fetchAdminFinancialManagement(page);

  return (
    <>
      <PageHeader
        title="আর্থিক হিসাব"
        description="সার্ভিসভিত্তিক প্রাপ্ত আয় ও বকেয়া সংরক্ষণ, সম্পাদনা এবং পর্যালোচনা করুন। সব পরিমাণ টাকা (৳) এককে।"
        count={`মোট ${result.total.toLocaleString('bn-BD')} টি হিসাব`}
      />
      {result.unavailable ? (
        <AdminError
          title="আর্থিক হিসাব লোড করা যায়নি"
          message={result.error ?? 'নতুন ডেটাবেস migration প্রয়োগ না হওয়া পর্যন্ত হিসাব মডিউল উপলভ্য হবে না।'}
        />
      ) : (
        <>
          <FinanceManagement records={result.records} summary={result.summary} today={dhakaToday()} />
          <nav className="mt-5 flex items-center justify-between gap-3" aria-label="আর্থিক হিসাবের পৃষ্ঠা">
            <span className="text-xs text-admin-muted">
              পৃষ্ঠা {page.toLocaleString('bn-BD')} / {Math.max(1, Math.ceil(result.total / result.pageSize)).toLocaleString('bn-BD')}
            </span>
            <div className="flex gap-2">
              {page > 1 && <Link href={`/admin/finance?page=${page - 1}`} className="inline-flex min-h-10 items-center rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold">আগের</Link>}
              {page * result.pageSize < result.total && <Link href={`/admin/finance?page=${page + 1}`} className="inline-flex min-h-10 items-center rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold">পরের</Link>}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
