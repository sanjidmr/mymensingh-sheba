import { formatBnNumber } from '@/lib/admin/dashboard-metrics';
import { CHART_COLORS } from './colors';

export interface BarChartRow {
  label: string;
  primary: number;
  /** An optional second measure drawn as a thinner bar beneath the first. */
  secondary?: number;
}

/**
 * Horizontal bars — one row per category, scaled against the largest value in
 * the set.
 *
 * Horizontal rather than vertical because the labels here are Bengali service
 * names, which do not fit under a vertical bar. Each row is announced to screen
 * readers with its exact figures rather than relying on the bar length.
 */
export function BarChart({
  rows,
  primaryLabel,
  secondaryLabel,
  primaryColor = CHART_COLORS.navy,
  secondaryColor = CHART_COLORS.accent,
  ariaLabel,
  emptyText = 'নির্বাচিত সময়ে কোনো ডেটা নেই।',
}: {
  rows: BarChartRow[];
  primaryLabel: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
  ariaLabel: string;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-admin-muted">{emptyText}</p>;
  }

  const max = Math.max(1, ...rows.flatMap((row) => [row.primary, row.secondary ?? 0]));

  return (
    <div className="min-w-0 space-y-3.5" role="group" aria-label={ariaLabel}>
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium text-admin-text">{row.label}</span>
            <span className="shrink-0 tabular-nums text-admin-muted">
              <span className="font-semibold text-admin-text">{formatBnNumber(row.primary)}</span>
              {row.secondary !== undefined && (
                <span>
                  <span aria-hidden="true"> · </span>
                  {formatBnNumber(row.secondary)}
                </span>
              )}
            </span>
          </div>
          <div
            className="space-y-1"
            role="img"
            aria-label={
              row.secondary !== undefined
                ? `${row.label}: ${primaryLabel} ${row.primary}, ${secondaryLabel ?? ''} ${row.secondary}`
                : `${row.label}: ${row.primary}`
            }
          >
            <div className="h-2 overflow-hidden rounded-full bg-admin-page">
              <div
                className="h-full rounded-full"
                style={{ width: `${(row.primary / max) * 100}%`, backgroundColor: primaryColor }}
              />
            </div>
            {row.secondary !== undefined && (
              <div className="h-2 overflow-hidden rounded-full bg-admin-page">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((row.secondary ?? 0) / max) * 100}%`,
                    backgroundColor: secondaryColor,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-admin-muted">
        <Legend color={primaryColor} label={primaryLabel} />
        {secondaryLabel && <Legend color={secondaryColor} label={secondaryLabel} />}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
