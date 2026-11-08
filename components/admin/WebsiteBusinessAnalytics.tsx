import { Panel } from '@/components/admin/PageHeader';
import { SERVICE_LABELS, type WebsiteBusinessAnalyticsData } from '@/lib/admin/website-analytics';
import type { WebsiteAnalyticsRow } from '@/lib/admin/website-analytics';

const LABELS: Record<string, string> = {
  ...SERVICE_LABELS,
  created: 'নতুন তৈরি',
  total: 'সর্বমোট',
  new: 'নতুন',
  published: 'প্রকাশিত',
  pending: 'অপেক্ষমাণ',
  current: 'বর্তমান',
  active: 'সক্রিয়',
  inactive: 'নিষ্ক্রিয়',
  draft: 'খসড়া',
  pending_approval: 'অনুমোদনের অপেক্ষায়',
  pending_review: 'পর্যালোচনার অপেক্ষায়',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
  reviewing: 'পর্যালোচনাধীন',
  contacted: 'যোগাযোগ করা হয়েছে',
  in_progress: 'চলমান',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
  submitted: 'জমা',
  assigned: 'বরাদ্দ',
  closed: 'বন্ধ',
  customer: 'গ্রাহক',
  admin: 'অ্যাডমিন',
  news_editor: 'নিউজ এডিটর',
  service: 'সার্ভিস',
  vehicle: 'যানবাহন',
  blood: 'রক্ত',
  staff: 'কর্মী',
  service_listing: 'সার্ভিস তালিকা',
  home_tutor: 'গৃহশিক্ষক',
  blood_donor: 'রক্তদাতা',
  tolet: 'বাসা ভাড়া',
  buy_sell: 'কেনাবেচা',
};

function businessKeyLabel(key: string): string {
  return key.split(':').map((part) => LABELS[part] ?? part.replaceAll('_', ' ')).join(' · ');
}

function BusinessMetricList({
  title,
  description,
  rows,
}: {
  title: string;
  description?: string;
  rows: WebsiteAnalyticsRow[];
}) {
  return (
    <Panel title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-admin-muted">এই সময়সীমায় কোনো রেকর্ড নেই।</p>
      ) : (
        <div className="divide-y divide-admin-border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 break-words text-sm text-admin-text">{businessKeyLabel(row.key)}</span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-admin-navy">
                {row.count.toLocaleString('bn-BD')}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function WebsiteBusinessAnalytics({
  data,
}: {
  data: WebsiteBusinessAnalyticsData;
}) {
  const money = (amount: number) =>
    `৳ ${amount.toLocaleString('bn-BD', { maximumFractionDigits: 2 })}`;
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="অ্যাকাউন্ট ও নিবন্ধন" description="profiles টেবিলের স্থায়ী account records; নতুন সংখ্যা নির্বাচিত সময়ে তৈরি profile।">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-admin-border bg-admin-page p-3">
              <p className="text-xs text-admin-muted">মোট অ্যাকাউন্ট</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-admin-text">
                {data.accounts.total.toLocaleString('bn-BD')}
              </p>
            </div>
            <div className="rounded-lg border border-admin-border bg-admin-page p-3">
              <p className="text-xs text-admin-muted">নির্বাচিত সময়ে নতুন অ্যাকাউন্ট</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-admin-text">
                {data.accounts.new.toLocaleString('bn-BD')}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <BusinessMetricList
              title="নতুন অ্যাকাউন্টের role"
              rows={data.accounts.byRole}
            />
          </div>
        </Panel>
        <BusinessMetricList
          title="সার্ভিস প্রোফাইল"
          description="created: নির্বাচিত সময়ে নতুন; total: সর্বমোট profile snapshot।"
          rows={data.profiles}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <BusinessMetricList
          title="কমিউনিটি পোস্ট"
          description="new: সময়সীমায় তৈরি, published: published_at সময়সীমায়, pending: সময়সীমায় তৈরি বর্তমান অপেক্ষমাণ, current: সর্বমোট বর্তমান অবস্থা।"
          rows={data.posts}
        />
        <BusinessMetricList
          title="জমা হওয়া service request"
          description="নির্বাচিত সময়ে তৈরি request; service type ও বর্তমান status অনুযায়ী।"
          rows={data.requests}
        />
      </div>

      <Panel
        title="আর্থিক রেকর্ড"
        description="admin_financial_records-এর হাতে যোগ করা আয় ও বকেয়া; ব্যাংক/ওয়ালেট transaction stream নয়।"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-admin-border bg-admin-page p-3">
            <p className="text-xs text-admin-muted">নথিভুক্ত আয়</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-admin-text">{money(data.finance.income)}</p>
          </div>
          <div className="rounded-lg border border-admin-border bg-admin-page p-3">
            <p className="text-xs text-admin-muted">বকেয়া</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-admin-text">{money(data.finance.due)}</p>
          </div>
          <div className="rounded-lg border border-admin-border bg-admin-page p-3">
            <p className="text-xs text-admin-muted">আর্থিক রেকর্ড</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-admin-text">
              {data.finance.records.toLocaleString('bn-BD')}
            </p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          {data.finance.byService.length === 0 ? (
            <p className="text-sm text-admin-muted">এই সময়ে কোনো আর্থিক রেকর্ড নেই।</p>
          ) : (
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-admin-border text-left text-xs text-admin-muted">
                  <th className="py-2 pr-3 font-semibold">সার্ভিস</th>
                  <th className="py-2 pr-3 text-right font-semibold">আয়</th>
                  <th className="py-2 pr-3 text-right font-semibold">বকেয়া</th>
                  <th className="py-2 text-right font-semibold">রেকর্ড</th>
                </tr>
              </thead>
              <tbody>
                {data.finance.byService.map((row) => (
                  <tr key={row.key} className="border-b border-admin-border last:border-0">
                    <td className="py-2.5 pr-3">{LABELS[row.key] ?? row.key.replaceAll('_', ' ')}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{money(row.income)}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{money(row.due)}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {row.records.toLocaleString('bn-BD')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="mt-3 text-xs text-admin-muted">
          {data.finance.expensesTracked
            ? 'নথিভুক্ত ব্যয়ের হিসাব অন্তর্ভুক্ত।'
            : 'বর্তমান schema-তে ব্যয়ের আলাদা record নেই; তাই ব্যয়/লাভ দেখানো হয়নি।'}
        </p>
      </Panel>
    </>
  );
}
