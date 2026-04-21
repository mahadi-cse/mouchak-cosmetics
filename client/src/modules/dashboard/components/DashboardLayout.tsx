'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { User, LogOut } from 'lucide-react';
import { NAV, SETTINGS_ITEMS } from '@/modules/dashboard/utils/constants';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import OverviewView from './views/OverviewView';
import EcommerceView from './views/EcommerceView';
import InventoryView from './views/InventoryView';
import SalesView from './views/SalesView';
import AnalyticsView from './views/AnalyticsView';
import BranchesView from './views/BranchesView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';
import ManualSaleModal from './ManualSaleModal';
import { Product, SellLog, Order } from '@/modules/dashboard/data/mockData';

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
  navigate: (id: string, settingsTabId?: string) => void;
  setSettingsTab: (id: string) => void;
  setSettingsOpen: (open: boolean) => void;
  lowCount: number;
  time: Date;
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
  navItems: { id: string; label: string; icon: string; badge?: string }[];
}> = ({
  activeNav,
  settingsOpen,
  settingsTab,
  navigate,
  setSettingsTab,
  setSettingsOpen,
  lowCount,
  time,
  isMobile,
  setSidebarOpen,
  navItems,
}) => {
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settingsOpen && settingsRef.current) {
      setTimeout(() => {
        settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [settingsOpen]);

  return (
  <>
    {/* Logo */}
    <div
      className="shrink-0 px-5 pb-4 pt-5"
      style={{ borderBottom: `1px solid ${Theme.border}` }}
    >
      <div
        className="flex items-center justify-between"
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
            }}
            className="mt-0.5"
          >
            Cosmetics · Control Centre
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="cursor-pointer border-0 bg-transparent p-0 text-[20px] leading-none"
            style={{ color: Theme.mutedFg }}
          >
            ✕
          </button>
        )}
      </div>
    </div>

    {/* Nav */}
    <nav
      className="flex flex-1 flex-col gap-px px-2 py-1 overflow-y-auto"
    >
      {navItems.map((n) => {
        const isSettings = n.id === 'settings';
        const active = activeNav === n.id;

        if (isSettings) {
          return (
            <div key="settings" ref={settingsRef}>
              <button
                onClick={() => {
                  navigate('settings');
                  setSettingsOpen(!settingsOpen);
                }}
                className="flex w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 px-3 py-[11px] text-left text-[13px] transition-all duration-150"
                style={{
                  background: active ? Theme.secondary : 'transparent',
                  color: active ? Theme.primary : Theme.mutedFg,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span style={{ fontSize: 15 }}>⚙️</span>
                <span className="flex-1">Settings</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    transition: 'transform 0.2s',
                    transform: settingsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: active ? Theme.primary : Theme.mutedFg,
                  }}
                  className="inline-block"
                >
                  ›
                </span>
              </button>
              {settingsOpen && (
                <div
                  className="mb-1 ml-2 border-l-2 pl-2"
                  style={{ borderLeftColor: Theme.border }}
                >
                  {SETTINGS_ITEMS.map((item) => {
                    const subActive = active && settingsTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSettingsTab(item.id);
                          navigate('settings', item.id);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        className="flex w-full cursor-pointer items-center gap-[9px] rounded-lg border-0 px-[10px] py-[9px] text-left text-[13px] transition-colors duration-100"
                        style={{
                          background: subActive ? `${Theme.primary}12` : 'transparent',
                          color: subActive ? Theme.primary : Theme.fg,
                          fontWeight: subActive ? 700 : 400,
                        }}
                      >
                        <span className="shrink-0 text-sm">
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
            className="flex w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 px-3 py-[11px] text-left text-[13px] transition-all duration-150"
            style={{
              background: active ? Theme.secondary : 'transparent',
              color: active ? Theme.primary : Theme.mutedFg,
              fontWeight: active ? 700 : 500,
            }}
          >
            <span style={{ fontSize: 15 }}>{n.icon}</span>
            <span className="flex-1">{n.label}</span>
            {n.id === 'inventory' && lowCount > 0 && (
              <span
                className="rounded-[20px] px-[7px] py-px text-[10px] font-bold text-white"
                style={{ background: Theme.warning }}
              >
                {lowCount}
              </span>
            )}
            {n.badge && (
              <span
                className="rounded-[20px] px-[7px] py-px text-[10px] font-semibold"
                style={{ background: Theme.muted, color: Theme.mutedFg }}
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
      <div className="shrink-0 px-5 py-[14px]" style={{ borderTop: `1px solid ${Theme.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: Theme.fg }}>
          {time.toLocaleTimeString('en-BD', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
        <div className="mt-0.5" style={{ fontSize: 11, color: Theme.mutedFg }}>
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
};

export default function DashboardLayout({
  products,
  setProducts,
  sellLog,
  setSellLog,
  orders,
  time,
}: DashboardLayoutProps) {
  const { isMobile } = useResponsive();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathSection = pathname.split('/')[2] || 'overview';
  const allowedNavIds = useMemo(() => new Set([...NAV.map((n) => n.id), 'profile']), []);
  const [activeNav, setActiveNav] = useState(allowedNavIds.has(pathSection) ? pathSection : 'overview');
  const [settingsTab, setSettingsTab] = useState(searchParams.get('tab') || 'general');
  const [settingsOpen, setSettingsOpen] = useState(activeNav === 'settings');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [navItems, setNavItems] = useState(NAV);
  
  useEffect(() => {
    if (!session?.accessToken) return;
    import('@/shared/lib/apiClient').then(({ apiClient }) => {
      apiClient.get('/auth/profile').then(res => {
        const data = res.data.data;
        if (data && data.userModules && data.userModules.length > 0) {
          const dynamicNav = data.userModules.map((um: any) => ({
            id: um.module.code,
            label: um.module.name,
            icon: um.module.icon || '📦',
            badge: um.module.badge
          }));
          setNavItems(dynamicNav);
        }
      }).catch(err => {
        console.error("Failed to load nav modules", err);
      });
    });
  }, [session?.accessToken]);

  const lowCount = products.filter((p) => p.status !== 'active').length;
  const settingsLabel = SETTINGS_ITEMS.find((i) => i.id === settingsTab)?.label || '';
  const topbarLabel =
    activeNav === 'settings'
      ? `Settings › ${settingsLabel}`
      : activeNav === 'profile'
        ? 'User Profile'
        : navItems.find((n) => n.id === activeNav)?.label || activeNav;

  const views: Record<string, React.ReactNode> = {
    profile: <ProfileView />,
    overview: <OverviewView products={products} orders={orders} onQuickSale={() => setModal(true)} />,
    sales: (
      <SalesView
        products={products}
        setProducts={setProducts}
        sellLog={sellLog}
        setSellLog={setSellLog}
      />
    ),
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

  const navigate = (id: string, settingsTabId?: string) => {
    const tab = settingsTabId || (id === 'settings' ? settingsTab : undefined);
    const path = id === 'overview' ? '/dashboard' : `/dashboard/${id}`;
    const target = id === 'settings' && tab ? `${path}?tab=${encodeURIComponent(tab)}` : path;
    setActiveNav(id);
    if (id === 'settings' && tab) setSettingsTab(tab);
    router.push(target);
    setSidebarOpen(false);
    if (id !== 'settings') setSettingsOpen(false);
    if (id === 'settings') setSettingsOpen(true);
  };

  useEffect(() => {
    const syncFromUrl = () => {
      const section = window.location.pathname.split('/')[2] || 'overview';
      const nextNav = allowedNavIds.has(section) ? section : 'overview';
      setActiveNav(nextNav);
      setSettingsOpen(nextNav === 'settings');
      if (nextNav === 'settings') {
        const tabFromUrl = new URLSearchParams(window.location.search).get('tab');
        if (tabFromUrl && SETTINGS_ITEMS.some((item) => item.id === tabFromUrl)) {
          setSettingsTab(tabFromUrl);
        }
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [allowedNavIds]);

  useEffect(() => {
    setSettingsOpen(activeNav === 'settings');
  }, [activeNav]);

  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: Theme.bg,
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        color: Theme.fg,
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          className="fixed right-5 top-5 z-[9998] rounded-[10px] px-5 py-[14px] text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
          style={{ background: Theme.success }}
        >
          {toast}
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className="flex w-56 shrink-0 flex-col overflow-y-auto"
          style={{
            background: Theme.card,
            borderRight: `1px solid ${Theme.border}`,
          }}
        >
          <SidebarContent
            activeNav={activeNav}
            settingsOpen={settingsOpen}
            settingsTab={settingsTab}
            navigate={navigate}
            setSettingsTab={setSettingsTab}
            setSettingsOpen={setSettingsOpen}
            lowCount={lowCount}
            time={time}
            isMobile={isMobile}
            setSidebarOpen={setSidebarOpen}
            navItems={navItems}
          />
        </aside>
      )}

      {/* Mobile Sidebar Drawer */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[1000] bg-black/40"
          />
          <div
            className="fixed bottom-0 left-0 top-0 z-[1001] flex w-[272px] flex-col overflow-y-auto shadow-[4px_0_20px_rgba(0,0,0,0.15)]"
            style={{
              background: Theme.card,
              borderRight: `1px solid ${Theme.border}`,
            }}
          >
            <SidebarContent
              activeNav={activeNav}
              settingsOpen={settingsOpen}
              settingsTab={settingsTab}
              navigate={navigate}
              setSettingsTab={setSettingsTab}
              setSettingsOpen={setSettingsOpen}
              lowCount={lowCount}
              time={time}
              isMobile={isMobile}
              setSidebarOpen={setSidebarOpen}
              navItems={navItems}
            />
          </div>
        </>
      )}

      {/* Main content area */}
      <main
        className={`flex flex-1 flex-col overflow-auto ${isMobile ? 'pb-[60px]' : 'pb-0'}`}
      >
        {/* Topbar */}
        <header
          className={`sticky top-0 z-10 flex shrink-0 items-center justify-between ${isMobile ? 'h-[52px] px-4' : 'h-[58px] px-[26px]'}`}
          style={{
            background: Theme.card,
            borderBottom: `1px solid ${Theme.border}`,
          }}
        >
          <div className="flex items-center gap-[10px]">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex cursor-pointer flex-col gap-1 border-0 bg-transparent p-1"
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-0.5 w-5 rounded-sm"
                    style={{ background: Theme.fg }}
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              className={isMobile ? 'max-w-40' : undefined}
            >
              {topbarLabel}
            </span>
          </div>
          <div className={`flex items-center ${isMobile ? 'gap-[10px]' : 'gap-4'}`}>
            {/* Profile Dropdown - AdminLTE Style */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-1.5 py-1 shrink-0 cursor-pointer rounded-full transition-all hover:shadow-md"
                style={{
                  background: Theme.secondary,
                  border: `1px solid ${Theme.border}`,
                }}
                title="User Profile"
              >
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold"
                  style={{ background: Theme.primary, color: 'white' }}
                >
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {!isMobile && (
                  <span className="text-[13px] font-bold pr-1" style={{ color: Theme.fg }}>
                    {session?.user?.name || 'User'}
                  </span>
                )}
              </button>

              {/* AdminLTE Style Dropdown Menu */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-full mt-3 w-64 rounded-lg shadow-2xl z-50 overflow-hidden"
                  style={{
                    background: Theme.card,
                  }}
                >
                  {/* User Header Section */}
                  <div
                    className="px-6 py-6 border-b text-center"
                    style={{
                      borderColor: Theme.border,
                      background: `linear-gradient(180deg, ${Theme.secondary}20 0%, transparent 100%)`,
                    }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-full text-[28px] font-black text-white shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${Theme.primary} 0%, ${Theme.primary}dd 100%)`,
                          border: `4px solid ${Theme.card}`,
                        }}
                      >
                        {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="space-y-1">
                        <div
                          className="text-[16px] font-bold tracking-tight"
                          style={{ color: Theme.fg }}
                        >
                          {session?.user?.name || 'User'}
                        </div>
                        <div
                          className="text-[11px] font-medium uppercase tracking-widest opacity-60"
                          style={{ color: Theme.mutedFg }}
                        >
                          Administrator
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Button Section - Side by Side */}
                  <div className="flex gap-3 px-5 py-4" style={{ background: Theme.card }}>
                    {/* Profile Button */}
                    <button
                      onClick={() => {
                        navigate('profile');
                        setProfileOpen(false);
                      }}
                      className="flex-1 px-3 py-2.5 rounded-xl text-center text-[12px] font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                      style={{
                        background: Theme.secondary + '40',
                        color: Theme.primary,
                        border: `1px solid ${Theme.secondary}`,
                      }}
                    >
                      <User size={15} strokeWidth={2.5} />
                      <span>Account</span>
                    </button>

                    {/* Sign Out Button */}
                    <button
                      onClick={handleLogout}
                      className="flex-1 px-3 py-2.5 rounded-xl text-center text-[12px] font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                      style={{
                        background: '#fff1f2',
                        color: '#e11d48',
                        border: '1px solid #ffe4e6',
                      }}
                    >
                      <LogOut size={15} strokeWidth={2.5} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto ${isMobile ? 'px-[14px] py-4' : 'px-[26px] py-[22px]'}`}
        >
          {views[activeNav]}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-[100] flex h-[60px] items-stretch shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          style={{
            background: Theme.card,
            borderTop: `1px solid ${Theme.border}`,
          }}
        >
          {[
            { id: 'overview', label: 'Home', icon: '◈' },
            { id: 'inventory', label: 'Inventory', icon: '📦' },
            { id: 'sales', label: 'Sales', icon: '💰' },
            { id: 'ecommerce', label: 'Orders', icon: '🌐' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map((n) => {
            const active = activeNav === n.id;
            return (
              <button
                key={n.id}
                onClick={() => navigate(n.id)}
                className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] border-0 transition-all duration-150"
                style={{
                  background: active ? Theme.secondary : 'transparent',
                  color: active ? Theme.primary : Theme.mutedFg,
                }}
              >
                {n.id === 'inventory' && lowCount > 0 && (
                  <div
                    className="absolute right-[calc(50%-14px)] top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
                    style={{ background: Theme.warning }}
                  >
                    {lowCount}
                  </div>
                )}
                <span style={{ fontSize: 18 }}>{n.icon}</span>
                <span
                  className="text-[9px] tracking-[0.02em]"
                  style={{ fontWeight: active ? 700 : 500 }}
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
    className="flex min-h-[400px] flex-col items-center justify-center gap-[18px] px-5 py-8 text-center"
  >
    <div
      className="flex h-20 w-20 items-center justify-center rounded-[22px] text-[40px]"
      style={{ background: Theme.secondary }}
    >
      🖥️
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: Theme.fg }}>
      Point of Sale
    </div>
    <div
      className="max-w-[380px] text-sm leading-[1.8]"
      style={{ color: Theme.mutedFg }}
    >
      Full POS terminal planned for next release. Until then, use{' '}
      <strong style={{ color: Theme.primary }}>Manual Sell</strong> in Inventory for
      walk-in sales with real-time stock sync.
    </div>
  </div>
);
