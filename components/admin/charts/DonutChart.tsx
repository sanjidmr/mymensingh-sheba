import { formatBnNumber } from '@/lib/admin/dashboard-metrics';
import { CHART_COLORS, CHART_PALETTE } from './colors';

export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

interface DonutSegment {
  slice: DonutSlice;
  length: number;
  offset: number;
  color: string;
}

/**
 * Lay the slices out around the circumference.
 *
 * Kept at module scope rather than inline in the render body: the cumulative
 * offset is a running total, and accumulating one inside JSX is both harder to
 * read and flagged by the hooks linter. The donut and its legend are built from
 * this single list, so a slice and its legend swatch can never disagree on
 * colour.
 */
function buildSegments(
  slices: DonutSlice[],
  total: number,
  circumference: number
): DonutSegment[] {
  const segments: DonutSegment[] = [];
  let offset = 0;
  slices.forEach((slice, index) => {
    const length = (slice.value / total) * circumference;
    segments.push({
      slice,
      length,
      offset,
      color: slice.color ?? CHART_PALETTE[index % CHART_PALETTE.length],
    });
    offset += length;
  });
  return segments;
}

/**
 * A donut built from stroked circles.
 *
 * No charting dependency: each slice is an arc on the circumference expressed as
 * a `stroke-dasharray` offset. The legend carries the actual figures and
 * percentages so the meaning never depends on judging an arc by eye.
 */
export function DonutChart({
  slices,
  ariaLabel,
  centerLabel = 'মোট',
  emptyText = 'নির্বাচিত সময়ে কোনো ডেটা নেই।',
}: {
  slices: DonutSlice[];
  ariaLabel: string;
  centerLabel?: string;
  emptyText?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total <= 0) {
    return <p className="text-sm text-admin-muted">{emptyText}</p>;
  }

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const segments = buildSegments(slices, total, circumference);

  return (
    <div className="flex min-w-0 flex-col items-center gap-5 sm:flex-row">
      <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img" aria-label={ariaLabel}>
        <g transform="rotate(-90 80 80)">
          {segments.map((segment) => (
            <circle
              key={segment.slice.label}
              cx={80}
              cy={80}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={20}
              strokeDasharray={`${segment.length} ${circumference - segment.length}`}
              strokeDashoffset={-segment.offset}
            />
          ))}
        </g>
        <text
          x={80}
          y={74}
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill={CHART_COLORS.navy}
        >
          {formatBnNumber(total)}
        </text>
        <text x={80} y={92} textAnchor="middle" fontSize="10" fill={CHART_COLORS.muted}>
          {centerLabel}
        </text>
      </svg>

      <ul className="w-full min-w-0 space-y-1.5">
        {segments.map((segment) => {
          const pct = (segment.slice.value / total) * 100;
          return (
            <li key={segment.slice.label} className="flex min-w-0 items-center justify-between gap-3 text-xs">
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="min-w-0 truncate text-admin-text">{segment.slice.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-admin-muted">
                <span className="font-semibold text-admin-text">
                  {formatBnNumber(segment.slice.value)}
                </span>
                <span aria-hidden="true"> · </span>
                {formatBnNumber(pct, 1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
