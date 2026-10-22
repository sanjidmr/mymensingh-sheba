import { AdminEmpty, AdminError } from '@/components/admin/States';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import { getAdminDataClient } from '@/lib/admin/queries';
import { listAdminEmailJobs, type AdminEmailJobSummary } from '@/lib/admin-email-alerts.server';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: 'অপেক্ষমাণ',
  processing: 'পাঠানো হচ্ছে',
  accepted_by_provider: 'Brevo গ্রহণ করেছে',
  delivered: 'ডেলিভার হয়েছে',
  retry_scheduled: 'পুনরায় চেষ্টা নির্ধারিত',
  failed: 'ব্যর্থ',
};

export default async function AdminEmailDeliveriesPage() {
  let jobs: AdminEmailJobSummary[] = [];
  let error: 'unauthorized' | 'unavailable' | null = null;
  try {
    const admin = await getAdminDataClient();
    if (!admin) {
      error = 'unauthorized';
    } else {
      jobs = await listAdminEmailJobs();
    }
  } catch {
    error = 'unavailable';
  }
  if (error === 'unauthorized') {
    return <AdminError title="অ্যাক্সেস যাচাই করা যায়নি" message="অ্যাডমিন হিসেবে আবার লগইন করুন।" />;
  }
  if (error === 'unavailable') {
    return (
      <AdminError
        title="ইমেইল ডেলিভারির তথ্য লোড করা যায়নি"
        message="ডাটাবেজ সংযোগ এবং admin email outbox migration যাচাই করুন।"
      />
    );
  }

  const failedCount = jobs.filter((job) => job.status === 'failed').length;
  const awaitingCount = jobs.filter((job) =>
    ['pending', 'processing', 'retry_scheduled'].includes(job.status)
  ).length;

  return (
    <>
      <PageHeader
        title="অ্যাডমিন ইমেইল ডেলিভারি"
        description="Brevo-তে গ্রহণ এবং Gmail-এ প্রকৃত ডেলিভারি আলাদাভাবে দেখানো হয়।"
        count={`শেষ ১০০টি job · অপেক্ষমাণ ${awaitingCount} · ব্যর্থ ${failedCount}`}
      />
      <Panel>
        {jobs.length === 0 ? (
          <AdminEmpty
            title="এখনো কোনো ইমেইল job নেই"
            description="গুরুত্বপূর্ণ notification তৈরি হলে transactional outbox-এ দেখা যাবে।"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead>
                <tr className="border-b border-admin-border text-admin-muted">
                  <th className="px-3 py-2 font-semibold">ঘটনা</th>
                  <th className="px-3 py-2 font-semibold">অবস্থা</th>
                  <th className="px-3 py-2 font-semibold">চেষ্টা</th>
                  <th className="px-3 py-2 font-semibold">শেষ ত্রুটি</th>
                  <th className="px-3 py-2 font-semibold">Brevo message ID</th>
                  <th className="px-3 py-2 font-semibold">সময়</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.event_id} className="border-b border-admin-border/70 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-admin-text">{job.related_type}</div>
                      <code className="mt-1 block break-all text-[10px] text-admin-muted">{job.event_id}</code>
                      {job.related_id && (
                        <code className="mt-1 block break-all text-[10px] text-admin-muted">{job.related_id}</code>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={job.status === 'failed' ? 'font-semibold text-red-700' : 'text-admin-text'}>
                        {STATUS_LABELS[job.status] ?? job.status}
                      </span>
                      {job.status === 'accepted_by_provider' && (
                        <span className="mt-1 block text-[10px] text-amber-700">Gmail delivery নিশ্চিত নয়</span>
                      )}
                    </td>
                    <td className="px-3 py-3">{job.attempt_count}</td>
                    <td className="max-w-52 break-words px-3 py-3 text-red-700">{job.last_error || '—'}</td>
                    <td className="max-w-48 break-all px-3 py-3 font-mono">{job.provider_message_id || '—'}</td>
                    <td className="px-3 py-3 text-admin-muted">
                      <time dateTime={job.created_at}>{new Date(job.created_at).toLocaleString('bn-BD')}</time>
                      {job.sent_at && (
                        <span className="mt-1 block">গ্রহণ: {new Date(job.sent_at).toLocaleString('bn-BD')}</span>
                      )}
                      {job.delivered_at && (
                        <span className="mt-1 block text-emerald-700">
                          ডেলিভার: {new Date(job.delivered_at).toLocaleString('bn-BD')}
                        </span>
                      )}
                      {job.next_retry_at && (
                        <span className="mt-1 block">পরের চেষ্টা: {new Date(job.next_retry_at).toLocaleString('bn-BD')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
