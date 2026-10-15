import { formatBnNumber } from '@/lib/admin/dashboard-metrics';
import { CHART_COLORS } from './colors';

export interface LineChartSeries {
  key: string;
  label: string;
  values: number[];
  color?: string;
  /** Render as a dashed comparison line (e.g. the previous period). */
  dashed?: boolean;
  /** Fill under the line with a faint tint. Only sensible for a single main series. */
  area?: boolean;
}

/**
 * A dependency-free responsive line chart.
 *
 * Drawn as a single SVG with an intrinsic aspect ratio, so it scales to its
 * container without JavaScript and without a charting library. The accessible
 * name summarises the series and the per-point values are available through SVG
 * `<title>` tooltips on hover.
 */
export function LineChart({
  series,
  labels,
  ariaLabel,
  height = 260,
}: {
  series: LineChartSeries[];
  labels: string[];
  ariaLabel: string;
  height?: number;
}) {
  const width = 760;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const pointCount = Math.max(0, ...series.map((s) => s.values.length));
  const niceMax = niceCeil(Math.max(1, ...series.flatMap((s) => s.values)));

  const x = (index: number) =>
    pointCount <= 1 ? padL + innerW / 2 : padL + index * (innerW / (pointCount - 1));
  const y = (value: number) =>
    padT + innerH - (Math.min(Math.max(value, 0), niceMax) / niceMax) * innerH;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t));
  const labelIndices =
    pointCount <= 6
      ? labels.map((_, index) => index)
      : Array.from({ length: 6 }, (_, k) => Math.round((k * (pointCount - 1)) / 5));

  return (
    <div className="min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={padL}
              x2={width - padR}
              y1={y(tick)}
              y2={y(tick)}
              stroke={CHART_COLORS.grid}
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="11"
              fill={CHART_COLORS.muted}
            >
              {formatBnNumber(tick)}
            </text>
          </g>
        ))}

        {labelIndices.map((index) => (
          <text
            key={`x-${index}`}
            x={x(index)}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill={CHART_COLORS.muted}
          >
            {labels[index] ?? ''}
          </text>
        ))}

        {series.map((item) => {
          if (item.values.length === 0) return null;
          const color = item.color ?? CHART_COLORS.navy;
          const points = item.values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
          const areaPoints = `${x(0)},${y(0)} ${points} ${x(item.values.length - 1)},${y(0)}`;
          return (
            <g key={item.key}>
              {item.area && (
                <polygon points={areaPoints} fill={color} opacity={0.08} />
              )}
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={item.dashed ? 1.5 : 2}
                strokeDasharray={item.dashed ? '5 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {item.values.length <= 31 &&
                item.values.map((value, index) => (
                  <circle
                    key={index}
                    cx={x(index)}
                    cy={y(value)}
                    r={item.dashed ? 2 : 2.5}
                    fill={color}
                  >
                    <title>{`${item.label} · ${labels[index] ?? ''}: ${formatBnNumber(value)}`}</title>
                  </circle>
                ))}
            </g>
          );
        })}
      </svg>

      <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-admin-muted">
        {series.map((item) => {
          const color = item.color ?? CHART_COLORS.navy;
          return (
            <li key={item.key} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block w-4"
                style={{
                  borderTop: item.dashed ? `2px dashed ${color}` : `3px solid ${color}`,
                }}
              />
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Round a maximum up to a readable axis bound (1, 2, 5 × a power of ten). */
function niceCeil(value: number): number {
  if (value <= 5) return Math.max(1, Math.ceil(value));
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}
