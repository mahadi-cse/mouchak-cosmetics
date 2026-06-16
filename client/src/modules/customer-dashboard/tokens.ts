/**
 * Customer-dashboard design tokens.
 *
 * Single source of truth for all colours / shadows used inside
 * CustomerDashboardView and its tab sub-components.
 *
 * Primary brand colour intentionally mirrors the CSS variable `--primary`
 * that is injected server-side by the root layout. Using this object avoids
 * scattering magic hex strings across 1,700+ lines of render code.
 */
export const DESIGN = {
  primary:    'var(--primary)',
  primaryDark:'var(--primary-dark)',
  bg:         '#f6f0f3',
  fg:         '#1f2937',
  mutedFg:    '#4b5563',
  subtleFg:   '#9ca3af',
  card:       '#ffffff',
  border:     'var(--primary-light)',
  ring:       'var(--primary-light)',
  softPink:   'var(--primary-pale)',
  success:    '#059669',
  warning:    '#f59e0b',
  info:       '#3b82f6',
} as const;

export type DesignTokens = typeof DESIGN;
