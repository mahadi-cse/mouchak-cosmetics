'use client';

import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

type CustomerNavId = 'profile' | 'order' | 'wishlist' | 'order-tracking';

const CUSTOMER_NAV_ITEMS: Array<{ id: CustomerNavId; label: string; icon: string }> = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'order', label: 'Order', icon: '🧾' },
  { id: 'wishlist', label: 'Wishlist', icon: '💖' },
  { id: 'order-tracking', label: 'Order tracking', icon: '📦' },
];

const contentByNav: Record<CustomerNavId, { title: string; subtitle: string }> = {
  profile: {
    title: 'Profile',
    subtitle: 'Manage your personal information and preferences.',
  },
  order: {
    title: 'Order',
    subtitle: 'See your purchase history and latest order details.',
  },
  wishlist: {
    title: 'Wishlist',
    subtitle: 'Keep your favorite products ready for checkout.',
  },
  'order-tracking': {
    title: 'Order tracking',
    subtitle: 'Track shipment updates and delivery progress in one place.',
  },
};

export default function CustomerDashboardClient() {
  const [activeNav, setActiveNav] = React.useState<CustomerNavId>('profile');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const activeContent = contentByNav[activeNav];

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: Theme.bg,
        color: Theme.fg,
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
      }}
    >
      <aside
        className="hidden w-64 shrink-0 flex-col border-r md:flex"
        style={{ borderColor: Theme.border, background: Theme.card }}
      >
        <div className="px-5 pb-4 pt-5" style={{ borderBottom: `1px solid ${Theme.border}` }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: Theme.primary, letterSpacing: '-0.02em' }}>
            Mouchak
          </div>
          <div
            className="mt-0.5"
            style={{
              fontSize: 10,
              color: Theme.mutedFg,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Customer Dashboard
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {CUSTOMER_NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="flex w-full items-center gap-3 rounded-[10px] border-0 px-3 py-[11px] text-left text-[14px] transition"
                style={{
                  background: isActive ? Theme.secondary : 'transparent',
                  color: isActive ? Theme.primary : Theme.mutedFg,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside
            className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r md:hidden"
            style={{ borderColor: Theme.border, background: Theme.card }}
          >
            <div className="flex items-center justify-between px-5 pb-4 pt-5" style={{ borderBottom: `1px solid ${Theme.border}` }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: Theme.primary, letterSpacing: '-0.02em' }}>
                  Mouchak
                </div>
                <div
                  className="mt-0.5"
                  style={{
                    fontSize: 10,
                    color: Theme.mutedFg,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Customer Dashboard
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="border-0 bg-transparent text-xl"
                style={{ color: Theme.mutedFg, cursor: 'pointer' }}
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-3">
              {CUSTOMER_NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      setSidebarOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-[10px] border-0 px-3 py-[11px] text-left text-[14px] transition"
                    style={{
                      background: isActive ? Theme.secondary : 'transparent',
                      color: isActive ? Theme.primary : Theme.mutedFg,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex items-center justify-between border-b px-4 py-3 md:px-6"
          style={{ borderColor: Theme.border, background: Theme.card }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
              style={{ borderColor: Theme.border, color: Theme.fg, background: Theme.card, cursor: 'pointer' }}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div>
              <p className="text-lg font-black" style={{ color: Theme.fg }}>
                Customer dashboard
              </p>
              <p className="text-xs" style={{ color: Theme.mutedFg }}>
                Welcome to your account space
              </p>
            </div>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: Theme.secondary, color: Theme.primary }}
          >
            Active
          </div>
        </header>

        <section className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: Theme.border }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: Theme.mutedFg }}>
                Current Section
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: Theme.fg }}>
                {activeContent.title}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: Theme.border }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: Theme.mutedFg }}>
                Saved Items
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: Theme.primary }}>
                0
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: Theme.border }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: Theme.mutedFg }}>
                Trackable Orders
              </p>
              <p className="mt-2 text-lg font-black" style={{ color: Theme.fg }}>
                0
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: Theme.border }}>
            <p className="text-xl font-black" style={{ color: Theme.fg }}>
              {activeContent.title}
            </p>
            <p className="mt-1 text-sm" style={{ color: Theme.mutedFg }}>
              {activeContent.subtitle}
            </p>
            <div className="mt-5 rounded-xl border border-dashed p-4" style={{ borderColor: Theme.border, background: Theme.muted }}>
              <p className="text-sm font-semibold" style={{ color: Theme.fg }}>
                {activeContent.title} content will be expanded here.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
