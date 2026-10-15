/**
 * Chart colours.
 *
 * These are plain values rather than Tailwind classes because they are applied
 * to SVG `stroke`/`fill` attributes and inline widths, where a class-based
 * colour token cannot reach. They deliberately mirror the admin theme tokens in
 * `app/globals.css` (`--color-admin-navy`, `--color-admin-accent`, the status
 * palette) so a chart is drawn in exactly the same colours as the interface
 * around it.
 */
export const CHART_COLORS = {
  navy: '#14243b',
  accent: '#c49a45',
  success: '#16805d',
  info: '#2364a0',
  warning: '#9a6500',
  danger: '#b42335',
  muted: '#64748b',
  border: '#e1e6ed',
  grid: '#eef1f4',
} as const;

/** Hues for categorical charts (donuts, multi-series bars), in priority order. */
export const CHART_PALETTE: string[] = [
  CHART_COLORS.navy,
  CHART_COLORS.accent,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.danger,
  CHART_COLORS.warning,
  CHART_COLORS.muted,
];
