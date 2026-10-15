import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DASHBOARD_RANGES } from '@/lib/admin/dashboard-metrics';

/**
 * Preset range tabs.
 *
 * Plain links, so the whole control works without client JavaScript and the
 * active window is always reflected in the URL — which means a dashboard view
 * can be bookmarked or shared. Choosing a preset clears any custom `from`/`to`
 * because the link carries only `?range=`.
 */
export function DashboardRangeTabs({
  activeKey,
  customLabel,
}: {
  activeKey: string;
  /** When a custom date range is active, its label, shown as an extra tab. */
  customLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label="সময়সীমা"
      className="inline-flex flex-wrap items-center gap-0.5 rounded-md border border-admin-border bg-white p-0.5"
    >
      {DASHBOARD_RANGES.map((option) => {
        const active = option.key === activeKey;
        return (
          <Link
            key={option.key}
            href={`/admin?range=${option.key}`}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-8 items-center rounded px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent',
              active
                ? 'bg-admin-navy text-white'
                : 'text-admin-muted hover:bg-admin-page hover:text-admin-navy'
            )}
          >
            {option.label}
          </Link>
        );
      })}
      {customLabel && (
        <span
          className="inline-flex min-h-8 items-center rounded bg-admin-page px-2.5 text-xs font-semibold text-admin-navy"
          title="কাস্টম সময়সীমা সক্রিয়"
        >
          {customLabel}
        </span>
      )}
    </div>
  );
}
