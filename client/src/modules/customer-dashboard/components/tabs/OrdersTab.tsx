import React, { useState } from 'react';
import { DESIGN } from '../../tokens';
import { money, toDateLabel, orderStatusStyle, SectionContainer, EmptyState, LoadingState, ErrorState } from '../shared';
import {
  useCustomerDashboardOrders,
  type CustomerDashboardOrder,
} from '@/modules/customer-dashboard';

interface OrdersTabProps { onTrack: (orderId: number) => void; }

function OrderCard({ order, onTrack }: { order: CustomerDashboardOrder; onTrack: (id: number) => void }) {
  const itemCount   = order.items.reduce((s, i) => s + i.quantity, 0);
  const statusStyle = orderStatusStyle(order.status);

  return (
    <div className="rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1"
      style={{ borderColor: DESIGN.border, boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: DESIGN.fg }}>{order.orderNumber}</p>
          <p className="text-xs" style={{ color: DESIGN.mutedFg }}>Placed on {toDateLabel(order.createdAt)}</p>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]" style={statusStyle}>
          {order.status}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {[
          { label: 'Total',   value: money(order.total)              },
          { label: 'Items',   value: String(itemCount)               },
          { label: 'Payment', value: order.payment?.status || 'PENDING' },
          { label: 'City',    value: order.shippingCity              },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>{label}</p>
            <p className="font-semibold" style={{ color: DESIGN.fg }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: DESIGN.mutedFg }}>{order.notes || 'No additional order notes'}</p>
        <button onClick={() => onTrack(order.id)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:-translate-y-0.5"
          style={{ background: DESIGN.primary }}>
          Track Order
        </button>
      </div>
    </div>
  );
}

export default function OrdersTab({ onTrack }: OrdersTabProps) {
  const [search, setSearch] = useState('');
  const params = React.useMemo(() => ({
    page: 1, limit: 20, ...(search.trim() ? { search: search.trim() } : {}),
  }), [search]);
  const q = useCustomerDashboardOrders(params);
  if (q.isLoading) return <LoadingState message="Loading your orders..." />;
  if (q.isError)   return <ErrorState   message="Unable to load your orders at this moment." />;
  const orders = q.data?.orders || [];
  return (
    <SectionContainer>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xl font-bold" style={{ color: DESIGN.fg }}>My Orders</p>
          <p className="text-sm"           style={{ color: DESIGN.mutedFg }}>Track and review your purchases.</p>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-[#e91e8c] focus:ring-4 focus:ring-pink-100 md:w-72"
          style={{ borderColor: DESIGN.border, color: DESIGN.fg }}
          placeholder="Search by order number or name" />
      </div>
      <div className="space-y-3">
        {orders.length === 0
          ? <EmptyState message="No orders found for the current filter." />
          : orders.map((o) => <OrderCard key={o.id} order={o} onTrack={onTrack} />)}
      </div>
    </SectionContainer>
  );
}
