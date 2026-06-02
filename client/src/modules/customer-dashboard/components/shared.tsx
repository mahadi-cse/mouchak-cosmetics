/**
 * Shared UI micro-components and pure utility functions for all customer
 * dashboard tab views.  Nothing here owns any state or side-effects — it is
 * purely presentational / utility.
 */
import React from 'react';
import { DESIGN } from '../tokens';
import type { DashboardOrderStatus } from '@/modules/customer-dashboard';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

export const money = (value?: number | string | null): string => {
  if (value === null || value === undefined) return '৳0';
  return `৳${Number(value).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
};

export const toDateLabel = (value?: string | null): string => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const toDateInputValue = (value?: string | null): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export const STATUS_ORDER: DashboardOrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED',
];

export const orderStatusStyle = (status: DashboardOrderStatus) => {
  switch (status) {
    case 'DELIVERED':  return { background: '#ecfdf3', color: DESIGN.success };
    case 'SHIPPED':    return { background: '#eff6ff', color: DESIGN.info };
    case 'PROCESSING': return { background: '#fff7ed', color: '#c2410c' };
    case 'CONFIRMED':  return { background: '#f0f9ff', color: '#0369a1' };
    case 'CANCELLED':  return { background: '#fef2f2', color: '#b91c1c' };
    case 'REFUNDED':   return { background: '#fdf4ff', color: '#86198f' };
    default:           return { background: '#fff7ed', color: DESIGN.warning };
  }
};

export const getStepState = (
  stepStatus: DashboardOrderStatus,
  orderStatus: DashboardOrderStatus,
): 'done' | 'active' | 'upcoming' => {
  if (orderStatus === 'CANCELLED' || orderStatus === 'REFUNDED') return 'upcoming';
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const orderIdx = STATUS_ORDER.indexOf(orderStatus);
  if (stepIdx < orderIdx) return 'done';
  if (stepIdx === orderIdx) return 'active';
  return 'upcoming';
};

// ---------------------------------------------------------------------------
// Shared micro-components
// ---------------------------------------------------------------------------

export function SectionContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border bg-white p-5 shadow-[0_2px_8px_rgba(233,30,140,0.04)]"
      style={{ borderColor: DESIGN.border }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: DESIGN.border }}>
      <p className="text-sm" style={{ color: DESIGN.mutedFg }}>{message}</p>
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: DESIGN.border }}>
      <p className="text-sm" style={{ color: DESIGN.mutedFg }}>{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: '#fecaca', background: '#fff1f2' }}>
      <p className="text-sm font-semibold" style={{ color: '#b91c1c' }}>{message}</p>
    </div>
  );
}
