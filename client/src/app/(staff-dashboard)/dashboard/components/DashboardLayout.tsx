'use client';

import React, { useState } from 'react';
import { Theme } from '../theme';
import { useResponsive } from '../page';
import { NAV, SETTINGS_ITEMS } from '../constants';
import OverviewView from './views/OverviewView';
import EcommerceView from './views/EcommerceView';
import InventoryView from './views/InventoryView';
import AnalyticsView from './views/AnalyticsView';
import BranchesView from './views/BranchesView';
import SettingsView from './views/SettingsView';
import ManualSaleModal from './ManualSaleModal';
import { Product, SellLog, Order } from '../data/mockData';

interface DashboardLayoutProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  sellLog: SellLog[];
  setSellLog: (log: SellLog[]) => void;
  orders: Order[];
  time: Date;
}

const SidebarContent: React.FC<{
  activeNav: string;
  settingsOpen: boolean;
  settingsTab: string;
  navigate: (id: string) => void;
  setActiveNav: (id: string) => void;
  setSettingsTab: (id: string) => void;
  setSettingsOpen: (open: boolean) => void;
  lowCount: number;
  time: Date;
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
}> = ({
  activeNav,
  settingsOpen,
  settingsTab,
  navigate,
  setActiveNav,
  setSettingsTab,
  setSettingsOpen,
  lowCount,
  time,
  isMobile,
  setSidebarOpen,
}) => (
  <>
    {/* Logo */}
    <div
      style={{
        padding: '20px 20px 16px',
        borderBottom: `1px solid ${Theme.border}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: Theme.primary,
              letterSpacing: '-0.02em',
            }}
          >
            Mouchak
          </div>
          <div
            style={{
              fontSize: 10,
              color: Theme.mutedFg,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            Cosmetics · Control Centre
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: Theme.mutedFg,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>

    {/* Role */}
    <div
      style={{
        margin: '14px 12px 8px',
        background: Theme.secondary,
        borderRadius: 10,
        padding: '10px 14px',
        border: '1px solid #fecdd3',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#be185d',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Signed in as
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: Theme.primary,
          marginTop: 2,
        }}
      >
        OWNER
      </div>
      <div style={{ fontSize: 11, color: Theme.mutedFg }}>Full access · all modules</div>
    </div>

    {/* Nav */}
    <nav
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        padding: '4px 8px',
        overflowY: 'auto',
      }}
    >
      {NAV.map((n) => {
        const isSettings = n.id === 'settings';
        const active = activeNav === n.id;

        if (isSettings) {
          return (
            <div key="settings">
              <button
                onClick={() => {
                  setActiveNav('settings');
                  setSettingsOpen(!settingsOpen);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 12px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  background: active ? Theme.secondary : 'transparent',
                  color: active ? Theme.primary : Theme.mutedFg,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 15 }}>⚙️</span>
                <span style={{ flex: 1 }}>Settings</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                    transform: settingsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: active ? Theme.primary : Theme.mutedFg,
                  }}
                >
                  ›
                </span>
              </button>
              {settingsOpen && (
                <div
                  style={{
                    marginLeft: 8,
                    marginBottom: 4,
                    borderLeft: `2px solid ${Theme.border}`,
                    paddingLeft: 8,
                  }}
                >
                  {SETTINGS_ITEMS.map((item) => {
                    const subActive = active && settingsTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveNav('settings');
                          setSettingsTab(item.id);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '9px 10px',
                          width: '100%',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                          background: subActive ? `${Theme.primary}12` : 'transparent',
                          color: subActive ? Theme.primary : Theme.fg,
                          fontWeight: subActive ? 700 : 400,
                          fontSize: 13,
                          transition: 'background 0.12s',
                        }}
                      >
                        <span style={{ fontSize: 14, flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <button
            key={n.id}
            onClick={() => navigate(n.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '11px 12px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              background: active ? Theme.secondary : 'transparent',
              color: active ? Theme.primary : Theme.mutedFg,
              fontWeight: active ? 700 : 500,
              fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.id === 'inventory' && lowCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: Theme.warning,
                  color: '#fff',
                  borderRadius: 20,
                  padding: '1px 7px',
                }}
              >
                {lowCount}
              </span>
            )}
            {n.badge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: Theme.muted,
                  color: Theme.mutedFg,
                  borderRadius: 20,
                  padding: '1px 7px',
                }}
              >
                {n.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>

    {/* Clock */}
    {(
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${Theme.border}`, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: Theme.fg }}>
          {time.toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
        <div style={{ fontSize: 11, color: Theme.mutedFg, marginTop: 2 }}>
          {time.toLocaleDateString('en-BD', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </div>
      </div>
    )}
  </>
);

export default function DashboardLayout({
  products,
  setProducts,
  sellLog,
  setSellLog,
  orders,
  time,
}: DashboardLayoutProps) {
  const { isMobile } = useResponsive();
  const [activeNav, setActiveNav] = useState('overview');
  const [settingsTab, setSettingsTab] = useState('general');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const lowCount = products.filter((p) => p.status !== 'active').length;
  const settingsLabel = SETTINGS_ITEMS.find((i) => i.id === settingsTab)?.label || '';
  const topbarLabel =
    activeNav === 'settings'
      ? `Settings › ${settingsLabel}`
      : NAV.find((n) => n.id === activeNav)?.label;

  const views: Record<string, React.ReactNode> = {
    overview: <OverviewView products={products} orders={orders} onQuickSale={() => setModal(true)} />,
    ecommerce: <EcommerceView products={products} orders={orders} />,
    inventory: (
      <InventoryView
        products={products}
        setProducts={setProducts}
        sellLog={sellLog}
        setSellLog={setSellLog}
      />
    ),
    analytics: <AnalyticsView />,
    branches: <BranchesView />,
    pos: <POSView />,
    settings: (
      <SettingsView products={products} tab={settingsTab} setTab={setSettingsTab} />
    ),
  };

  const navigate = (id: string) => {
    setActiveNav(id);
    setSidebarOpen(false);
    if (id !== 'settings') setSettingsOpen(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: Theme.bg,
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        color: Theme.fg,
        overflow: 'hidden',
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9998,
            background: Theme.success,
            color: '#fff',
            borderRadius: 10,
            padding: '14px 20px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          style={{
            width: 224,
            background: Theme.card,
            borderRight: `1px solid ${Theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <SidebarContent
            activeNav={activeNav}
            settingsOpen={settingsOpen}
            settingsTab={settingsTab}
            navigate={navigate}
            setActiveNav={setActiveNav}
            setSettingsTab={setSettingsTab}
            setSettingsOpen={setSettingsOpen}
            lowCount={lowCount}
            time={time}
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
          />
        </aside>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 1000,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 272,
              background: Theme.card,
              borderRight: `1px solid ${Theme.border}`,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1001,
              overflowY: 'auto',
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
            }}
          >
            <SidebarContent
              activeNav={activeNav}
              settingsOpen={settingsOpen}
              settingsTab={settingsTab}
              navigate={navigate}
              setActiveNav={setActiveNav}
              setSettingsTab={setSettingsTab}
              setSettingsOpen={setSettingsOpen}
              lowCount={lowCount}
              time={time}
              isMobile={isMobile}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: isMobile ? 60 : 0,
        }}
      >
        {/* Topbar */}
        <header
          style={{
            height: isMobile ? 52 : 58,
            background: Theme.card,
            borderBottom: `1px solid ${Theme.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 16px' : '0 26px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  padding: 4,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 20,
                      height: 2,
                      borderRadius: 2,
                      background: Theme.fg,
                    }}
                  />
                ))}
              </button>
            )}
            {!isMobile && (
              <>
                <span style={{ fontSize: 12, color: Theme.mutedFg }}>Dashboard</span>
                <span style={{ color: Theme.border }}>›</span>
              </>
            )}
            <span
              style={{
                fontSize: isMobile ? 14 : 14,
                fontWeight: 700,
                color: Theme.fg,
                maxWidth: isMobile ? 160 : undefined,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {topbarLabel}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: Theme.mutedFg }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: Theme.success,
                }}
              />
              {!isMobile && 'SSLCommerz · '}Live
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: Theme.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: Theme.primary,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              O
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? '16px 14px' : '22px 26px',
            overflowY: 'auto',
          }}
        >
          {views[activeNav]}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: Theme.card,
            borderTop: `1px solid ${Theme.border}`,
            display: 'flex',
            alignItems: 'stretch',
            height: 60,
            zIndex: 100,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          }}
        >
          {[
            { id: 'overview', label: 'Home', icon: '◈' },
            { id: 'ecommerce', label: 'Orders', icon: '🌐' },
            { id: 'inventory', label: 'Inventory', icon: '📦' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map((n) => {
            const active = activeNav === n.id;
            return (
              <button
                key={n.id}
                onClick={() => navigate(n.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  border: 'none',
                  cursor: 'pointer',
                  background: active ? Theme.secondary : 'transparent',
                  color: active ? Theme.primary : Theme.mutedFg,
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {n.id === 'inventory' && lowCount > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 'calc(50% - 14px)',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: Theme.warning,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#fff',
                    }}
                  >
                    {lowCount}
                  </div>
                )}
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: '0.02em',
                  }}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Manual Sale Modal */}
      {modal && (
        <ManualSaleModal
          products={products}
          onClose={() => setModal(false)}
          onConfirm={(product: Product, qty: number, note: string, total: number) => {
            setProducts(
              products.map((p: Product) => {
                if (p.id !== product.id) return p;
                const ns = p.stock - qty;
                return {
                  ...p,
                  stock: ns,
                  manualSold: p.manualSold + qty,
                  sold: p.sold + qty,
                  status: ns === 0 ? 'out' : ns < 15 ? 'low' : 'active',
                };
              })
            );
            setSellLog([
              {
                id: `MS-${String(sellLog.length + 1).padStart(3, '0')}`,
                product: product.name,
                qty,
                amount: total,
                note: note || 'Walk-in sale',
                date: 'Just now',
                by: 'Manager',
              },
              ...sellLog,
            ]);
            setToast(`✓ Sold ${qty} × ${product.name}`);
          }}
        />
      )}
    </div>
  );
}

const POSView: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 400,
      gap: 18,
      textAlign: 'center',
      padding: '32px 20px',
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 22,
        background: Theme.secondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 40,
      }}
    >
      🖥️
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: Theme.fg }}>
      Point of Sale
    </div>
    <div
      style={{
        fontSize: 14,
        color: Theme.mutedFg,
        maxWidth: 380,
        lineHeight: 1.8,
      }}
    >
      Full POS terminal planned for next release. Until then, use{' '}
      <strong style={{ color: Theme.primary }}>Manual Sell</strong> in Inventory for
      walk-in sales with real-time stock sync.
    </div>
  </div>
);
