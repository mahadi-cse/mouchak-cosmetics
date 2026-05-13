import React from 'react';
import { DESIGN } from '../../tokens';
import { money, toDateLabel, orderStatusStyle, SectionContainer, EmptyState, LoadingState } from '../shared';
import type { CustomerNavId } from '../CustomerDashboardView';
import {
  useCustomerDashboardSummary,
  useCustomerDashboardProfile,
} from '@/modules/customer-dashboard';

interface OverviewTabProps {
  onNavigate: (id: CustomerNavId, trackOrderId?: number) => void;
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
  const summaryQuery = useCustomerDashboardSummary();
  const profileQuery = useCustomerDashboardProfile();

  const isLoading = summaryQuery.isLoading || profileQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl" style={{ background: DESIGN.softPink }} />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border" style={{ borderColor: DESIGN.border, background: '#fff' }} />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl border" style={{ borderColor: DESIGN.border, background: '#fff' }} />
      </div>
    );
  }

  const s = summaryQuery.data;
  const p = profileQuery.data;

  const stats = [
    { label: 'Total Orders',  value: String(s?.totalOrders ?? 0),             icon: '🧾', accent: DESIGN.primary },
    { label: 'Active Orders', value: String(s?.activeOrders ?? 0),             icon: '⚡', accent: DESIGN.info },
    { label: 'Wishlist',      value: String(s?.wishlistCount ?? 0),            icon: '💖', accent: '#e11d48' },
    { label: 'Loyalty Points',value: (s?.loyaltyPoints ?? 0).toLocaleString(), icon: '⭐', accent: DESIGN.warning },
  ];

  const latestOrder = s?.latestOrder;
  const firstName   = p?.firstName || s?.customerName?.split(' ')[0] || 'there';
  const segment     = p?.segment || s?.segment;

  return (
    <div className="space-y-4">
      {/* Greeting banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{
          background: `linear-gradient(135deg, ${DESIGN.primary} 0%, ${DESIGN.primaryDark} 100%)`,
          boxShadow: '0 8px 32px rgba(233,30,140,0.22)',
        }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full opacity-20" style={{ background: '#fff' }} />
        <div className="pointer-events-none absolute -bottom-6 right-16 h-20 w-20 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-black text-white" style={{ letterSpacing: '-0.02em' }}>
              Welcome back, {firstName} 👋
            </p>
            <p className="mt-0.5 text-sm text-white/75">
              {money(s?.totalSpent ?? 0)} spent across {s?.totalOrders ?? 0} orders
            </p>
          </div>
          {segment && (
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              {segment}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border bg-white px-4 py-4 transition-all duration-300 hover:-translate-y-0.5"
            style={{ borderColor: DESIGN.border, boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
                {stat.label}
              </p>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-black" style={{ color: stat.accent, letterSpacing: '-0.03em' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Latest order + quick actions */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionContainer>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
            Latest Order
          </p>
          {latestOrder ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold" style={{ color: DESIGN.fg }}>{latestOrder.orderNumber}</p>
                  <p className="text-xs" style={{ color: DESIGN.mutedFg }}>Placed on {toDateLabel(latestOrder.createdAt)}</p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={orderStatusStyle(latestOrder.status)}
                >
                  {latestOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: DESIGN.softPink }}>
                <p className="text-sm font-semibold" style={{ color: DESIGN.mutedFg }}>Order Total</p>
                <p className="text-lg font-black" style={{ color: DESIGN.primary }}>{money(latestOrder.total)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate('order-tracking', latestOrder.id)}
                  className="flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: DESIGN.primary, boxShadow: '0 6px 16px rgba(233,30,140,0.22)' }}
                >
                  Track Order
                </button>
                <button
                  onClick={() => onNavigate('order')}
                  className="flex-1 rounded-xl border py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: DESIGN.border, color: DESIGN.primary }}
                >
                  All Orders
                </button>
              </div>
            </div>
          ) : (
            <EmptyState message="No orders placed yet. Start shopping!" />
          )}
        </SectionContainer>

        <SectionContainer>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
            Quick Actions
          </p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { label: 'My Orders',   icon: '🧾', nav: 'order'          },
              { label: 'Wishlist',    icon: '💖', nav: 'wishlist'       },
              { label: 'Track Order', icon: '📦', nav: 'order-tracking' },
              { label: 'Edit Profile',icon: '✏️', nav: 'profile'        },
              { label: 'Returns',     icon: '🔄', nav: 'returns'        },
            ] as { label: string; icon: string; nav: CustomerNavId }[]).map((action) => (
              <button
                key={action.nav}
                onClick={() => onNavigate(action.nav)}
                className="flex flex-col items-center gap-2 rounded-2xl border py-4 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: DESIGN.border, color: DESIGN.fg, background: '#fff', boxShadow: '0 2px 8px rgba(233,30,140,0.04)' }}
              >
                <span className="text-2xl">{action.icon}</span>
                <span style={{ color: DESIGN.mutedFg, fontSize: 12 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </SectionContainer>
      </div>

      {/* Account summary */}
      {p && (
        <SectionContainer>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: DESIGN.mutedFg }}>
            Account Summary
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
            {[
              { label: 'Email',        value: p.email },
              { label: 'Phone',        value: p.phone || '—' },
              { label: 'City',         value: p.city  || '—' },
              { label: 'Member Since', value: toDateLabel(p.createdAt) },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DESIGN.subtleFg }}>
                  {row.label}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: DESIGN.fg }}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </SectionContainer>
      )}
    </div>
  );
}
