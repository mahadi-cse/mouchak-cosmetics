import React, { useState, useEffect } from 'react';
import { DESIGN } from '../../tokens';
import {
  money, toDateLabel, orderStatusStyle, getStepState,
  SectionContainer, EmptyState, LoadingState, ErrorState,
  STATUS_ORDER,
} from '../shared';
import {
  useCustomerDashboardOrders,
  useCustomerOrderTracking,
} from '@/modules/customer-dashboard';
import type { DashboardOrderStatus } from '@/modules/customer-dashboard';

const TRACKING_STEPS: Array<{ status: DashboardOrderStatus; label: string; icon: string }> = [
  { status: 'PENDING',    label: 'Order Placed', icon: '🛒' },
  { status: 'CONFIRMED',  label: 'Confirmed',    icon: '✅' },
  { status: 'PROCESSING', label: 'Processing',   icon: '⚙️' },
  { status: 'SHIPPED',    label: 'Shipped',      icon: '🚚' },
  { status: 'DELIVERED',  label: 'Delivered',    icon: '📦' },
];

interface TrackingTabProps {
  initialOrderId?: number;
  onOrderIdChange?: (id: number) => void;
}

export default function TrackingTab({ initialOrderId, onOrderIdChange }: TrackingTabProps) {
  const [trackingOrderId, setTrackingOrderId] = useState<number | undefined>(initialOrderId);

  // Keep parent in sync if needed
  const setId = (id: number) => {
    setTrackingOrderId(id);
    onOrderIdChange?.(id);
  };

  const ordersQ = useCustomerDashboardOrders({ page: 1, limit: 20 });
  const trackingQ = useCustomerOrderTracking(trackingOrderId, {
    enabled: !!trackingOrderId,
  });

  // Auto-select first order
  useEffect(() => {
    const orders = ordersQ.data?.orders || [];
    if (orders.length > 0 && !trackingOrderId) setId(orders[0].id);
    if (trackingOrderId && !orders.some((o) => o.id === trackingOrderId)) {
      if (orders[0]) setId(orders[0].id);
    }
  }, [ordersQ.data, trackingOrderId]);

  // Sync if parent changes initialOrderId
  useEffect(() => {
    if (initialOrderId) setTrackingOrderId(initialOrderId);
  }, [initialOrderId]);

  if (ordersQ.isLoading) return <LoadingState message="Loading trackable orders..." />;
  if (ordersQ.isError)   return <ErrorState   message="Unable to load orders for tracking." />;

  const orders = ordersQ.data?.orders || [];
  if (orders.length === 0) return <EmptyState message="No orders available to track right now." />;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
      {/* Order list */}
      <SectionContainer>
        <p className="text-sm font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>Select Order</p>
        <div className="mt-3 space-y-2">
          {orders.map((order) => {
            const isActive = trackingOrderId === order.id;
            return (
              <button key={order.id} onClick={() => setId(order.id)}
                className="w-full rounded-xl border px-3 py-2 text-left transition"
                style={{ borderColor: isActive ? DESIGN.primary : DESIGN.border, background: isActive ? DESIGN.softPink : '#fff' }}>
                <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>{order.orderNumber}</p>
                <p className="text-xs" style={{ color: DESIGN.mutedFg }}>{toDateLabel(order.createdAt)}</p>
              </button>
            );
          })}
        </div>
      </SectionContainer>

      {/* Timeline */}
      <SectionContainer>
        {trackingQ.isLoading ? (
          <LoadingState message="Loading tracking timeline..." />
        ) : trackingQ.isError || !trackingQ.data ? (
          <ErrorState message="Could not load tracking timeline for this order." />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>{trackingQ.data.orderNumber}</p>
                <p className="text-sm" style={{ color: DESIGN.mutedFg }}>Order placed on {toDateLabel(trackingQ.data.createdAt)}</p>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]"
                style={orderStatusStyle(trackingQ.data.status)}>
                {trackingQ.data.status}
              </span>
            </div>

            {trackingQ.data.status !== 'CANCELLED' && trackingQ.data.status !== 'REFUNDED' ? (
              <div className="mt-6 flex items-center gap-0">
                {TRACKING_STEPS.map((step, idx) => {
                  const state = getStepState(step.status, trackingQ.data!.status);
                  return (
                    <React.Fragment key={step.status}>
                      <div className="flex flex-col items-center gap-1.5 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-base transition-all"
                          style={{
                            background:  state === 'done' ? DESIGN.primary : state === 'active' ? DESIGN.softPink : '#f3f4f6',
                            border: `2px solid ${state === 'upcoming' ? '#e5e7eb' : DESIGN.primary}`,
                            fontSize: 16,
                          }}>
                          {state === 'done' ? '✓' : step.icon}
                        </div>
                        <p className="text-center text-[10px] font-semibold leading-tight"
                          style={{ color: state === 'upcoming' ? DESIGN.subtleFg : DESIGN.primary, maxWidth: 56 }}>
                          {step.label}
                        </p>
                      </div>
                      {idx < TRACKING_STEPS.length - 1 && (
                        <div className="h-0.5 flex-1 mx-1"
                          style={{ background: getStepState(TRACKING_STEPS[idx + 1].status, trackingQ.data!.status) !== 'upcoming' ? DESIGN.primary : '#e5e7eb' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                This order has been {trackingQ.data.status.toLowerCase()}.
              </div>
            )}

            {trackingQ.data.trackingEvents.length > 0 && (
              <div className="mt-6 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>Timeline</p>
                {trackingQ.data.trackingEvents.map((event, index) => (
                  <div key={event.id} className="relative pl-8">
                    {index < trackingQ.data!.trackingEvents.length - 1 && (
                      <div className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px" style={{ background: DESIGN.border }} />
                    )}
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-2"
                      style={{ borderColor: DESIGN.primary, background: DESIGN.softPink }} />
                    <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>{event.title}</p>
                    <p className="text-xs" style={{ color: DESIGN.mutedFg }}>{event.description || 'Status updated'}</p>
                    <p className="text-xs" style={{ color: DESIGN.subtleFg }}>{toDateLabel(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </div>
  );
}
