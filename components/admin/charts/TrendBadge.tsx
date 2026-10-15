import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricTrend } from '@/lib/admin/dashboard-metrics';

const TONE: Record<MetricTrend['tone'], string> = {
  good: 'text-status-success',
  bad: 'text-status-danger',
  neutral: 'text-admin-muted',
};

/**
 * A period-over-period change indicator.
 *
 * The colour says whether the movement is *favourable*, not merely whether it
 * points up — for a metric where lower is better the caller passes
 * `higherIsBetter: false` and a fall is rendered green. The direction arrow
 * always reflects the real movement, so the two can never disagree silently.
 */
export function TrendBadge({
  trend,
  className,
  title = 'আগের সমপরিমাণ সময়ের তুলনায়',
}: {
  trend: MetricTrend;
  className?: string;
  title?: string;
}) {
  const Icon =
    trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums', TONE[trend.tone], className)}
      title={title}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{trend.label}</span>
      <span className="sr-only">আগের সময়ের তুলনায়</span>
    </span>
  );
}
