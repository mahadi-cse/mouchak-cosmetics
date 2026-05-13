/**
 * Customer-dashboard design tokens.
 *
 * Single source of truth for all colours / shadows used inside
 * CustomerDashboardClient and its tab sub-components.
 *
 * Primary brand colour intentionally mirrors the CSS variable `--primary`
 * that is injected server-side by the root layout. Using this object avoids
 * scattering magic hex strings across 1,700+ lines of render code.
 */
export const DESIGN = {
  primary:    '#e91e8c',
  primaryDark:'#c91673',
  bg:         '#f6f0f3',
  fg:         '#1f2937',
  mutedFg:    '#4b5563',
  subtleFg:   '#9ca3af',
  card:       '#ffffff',
  border:     '#f3e0ea',
  ring:       '#f3c8dc',
  softPink:   '#fce7f3',
  success:    '#059669',
  warning:    '#f59e0b',
  info:       '#3b82f6',
} as const;

export type DesignTokens = typeof DESIGN;
