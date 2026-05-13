'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { User, LogOut } from 'lucide-react';
import { useProfileQuery } from '@/modules/auth';
import { NAV, SETTINGS_ITEMS } from '@/modules/dashboard/utils/constants';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OverviewView from './views/OverviewView';
import EcommerceView from './views/EcommerceView';
import InventoryView from './views/InventoryView';
import SalesView from './views/SalesView';
import ReturnsView from './views/ReturnsView';
import SuppliersView from './views/SuppliersView';
import ProductsView from './views/ProductsView';
import CategoriesView from './views/CategoriesView';
import AnalyticsView from './views/AnalyticsView';
import BranchesView from './views/BranchesView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';
import ManualSaleModal from './ManualSaleModal';
import { Product, SellLog, Order } from '@/modules/dashboard/data/mockData';
import { useDashboardLocale } from '../locales/DashboardLocaleContext';

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
  userModuleCodes: Set<string> | null;
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
  userModuleCodes,
}) => {
  const settingsRef = useRef<HTMLDivElement>(null);
  const { t } = useDashboardLocale();

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
      className="shrink-0 px-5 pb-3 pt-4"
      style={{ borderBottom: `1px solid ${Theme.border}` }}
    >
      <div className="flex items-center justify-between">
        <Link href="/" className="no-underline cursor-pointer hover:opacity-80 transition-opacity">
          <div
            style={{
              fontSize: 22,
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
            {t.sidebar.brandSub}
          </div>
        </Link>
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
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2 overflow-y-auto">
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
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3.5 py-2.5 text-left text-[13.5px] transition-all duration-200"
                style={{
                  background: active ? Theme.secondary : 'transparent',
                  color: active ? Theme.primary : Theme.mutedFg,
                  fontWeight: active ? 700 : 500,
                }}
              >
                <span style={{ fontSize: 16 }}>⚙️</span>
                <span className="flex-1">{t.sidebar.settings}</span>
                <motion.span
                  animate={{ rotate: settingsOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: active ? Theme.primary : Theme.mutedFg,
                  }}
                  className="inline-block"
                >
                  ›
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {settingsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mb-1 ml-3 border-l-2 pl-2 pt-1"
                      style={{ borderLeftColor: Theme.border }}
                    >
                      {SETTINGS_ITEMS.filter((item) => {
                        if (!userModuleCodes) return true;
                        return userModuleCodes.has(`settings:${item.id}`);
                      }).map((item) => {
                        const localizedLabel = (t.settingsItems as any)[item.id] || item.label;
                        const subActive = active && settingsTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSettingsTab(item.id);
                              navigate('settings', item.id);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 px-3 py-2 text-left text-[13px] transition-colors duration-150"
                            style={{
                              background: subActive ? `${Theme.primary}12` : 'transparent',
                              color: subActive ? Theme.primary : Theme.fg,
                              fontWeight: subActive ? 700 : 400,
                            }}
                          >
                            <span className="shrink-0 text-sm">{item.icon}</span>
                            <span>{localizedLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }

        return (
          <button
            key={n.id}
            onClick={() => {
              navigate(n.id);
              if (isMobile) setSidebarOpen(false);
            }}
            className="relative flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3.5 py-2.5 text-left text-[13.5px] transition-all duration-200"
            style={{
              background: active ? Theme.secondary : 'transparent',
              color: active ? Theme.primary : Theme.mutedFg,
              fontWeight: active ? 700 : 500,
            }}
          >
            {active && (
              <motion.div
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded-xl"
                style={{ background: Theme.secondary }}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative" style={{ fontSize: 16 }}>{n.icon}</span>
            <span className="relative flex-1">{n.label}</span>
            {n.id === 'inventory' && lowCount > 0 && (
              <span
                className="relative rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ background: Theme.warning }}
              >
                {lowCount}
              </span>
            )}
            {n.badge && (
              <span
                className="relative rounded-full px-2 py-0.5 text-[10px] font-semibold"
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
    <div className="shrink-0 px-5 py-4" style={{ borderTop: `1px solid ${Theme.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg }}>
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
  </>
  );
};


// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function DashboardLayout({
  products,
  setProducts,
  sellLog,
  setSellLog,
  orders,
  time,
}: DashboardLayoutProps) {
  const { locale, t, toggleLocale } = useDashboardLocale();
  const { isMobile } = useResponsive();
  const { data: session } = useSession();
  const { data: profileUser } = useProfileQuery();
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

  const NAV_CACHE_KEY = 'mouchak.nav.modules.v1';

  const [navItems, setNavItems] = useState(() => {
    if (typeof window === 'undefined') return NAV;
    try {
      const cached = localStorage.getItem(NAV_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.navItems?.length > 0) return parsed.navItems;
      }
    } catch {}
    return NAV;
  });
  const [userModuleCodes, setUserModuleCodes] = useState<Set<string> | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(NAV_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.isAdmin) return null;
        if (parsed.codes?.length > 0) return new Set<string>(parsed.codes);
      }
    } catch {}
    return null;
  });
  
  useEffect(() => {
    if (!session?.accessToken) return;
    import('@/shared/lib/apiClient').then(({ apiClient }) => {
      apiClient.get('/auth/profile').then(res => {
        const data = res.data.data;
        if (!data) return;

        const userTypeCode = data.userType?.code;
        if (userTypeCode === '1x101') {
          setNavItems(NAV);
          setUserModuleCodes(null);
          try { localStorage.setItem(NAV_CACHE_KEY, JSON.stringify({ isAdmin: true, navItems: NAV })); } catch {}
          return;
        }

        if (data.userModules && data.userModules.length > 0) {
          const codes = data.userModules.map((um: any) => um.module.code as string);
          const codeSet = new Set<string>(codes);
          setUserModuleCodes(codeSet);
          const filtered = NAV.filter(n => codeSet.has(n.id));
          const finalNav = filtered.length > 0 ? filtered : NAV;
          setNavItems(finalNav);
          try { localStorage.setItem(NAV_CACHE_KEY, JSON.stringify({ codes, navItems: finalNav })); } catch {}
        }
      }).catch(err => {
        console.error("Failed to load nav modules", err);
      });
    });
  }, [session?.accessToken]);

  const lowCount = products.filter((p) => p.status !== 'active').length;
  const settingsItemsLocalized = SETTINGS_ITEMS.map((item) => ({
    ...item,
    label: (t.settingsItems as any)[item.id] || item.label,
  }));
  const settingsLabel = settingsItemsLocalized.find((i) => i.id === settingsTab)?.label || '';
  const navItemsLocalized = navItems.map((n: any) => ({
    ...n,
    label: (t.nav as any)[n.id] || n.label,
    badge: n.badge ? t.nav.soon : n.badge,
  }));
  const topbarLabel =
    activeNav === 'settings'
      ? `${t.nav.settings} › ${settingsLabel}`
      : activeNav === 'profile'
        ? t.topbar.userProfile
        : navItemsLocalized.find((n: { id: string; label: string }) => n.id === activeNav)?.label || activeNav;

  const views: Record<string, React.ReactNode> = {
    profile: <ProfileView />,
    overview: <OverviewView products={products} orders={orders} onQuickSale={() => setModal(true)} />,
    products: <ProductsView />,
    categories: <CategoriesView />,
    sales: (
      <SalesView
        products={products}
        setProducts={setProducts}
        sellLog={sellLog}
        setSellLog={setSellLog}
      />
    ),
    ecommerce: <EcommerceView products={products} orders={orders} />,
    returns: <ReturnsView />,
    suppliers: <SuppliersView />,
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
    window.history.pushState(null, '', target);
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

  const resolvedView = (() => {
    if (activeNav === 'profile' || !userModuleCodes) return views[activeNav];
    if (userModuleCodes.has(activeNav)) return views[activeNav];
    const firstAllowed = navItems[0]?.id;
    if (firstAllowed && firstAllowed !== activeNav) {
      setTimeout(() => navigate(firstAllowed), 0);
      return null;
    }
    return views[activeNav];
  })();

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
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed right-5 top-5 z-[9998] rounded-xl px-5 py-3.5 text-[13px] font-semibold text-white shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
            style={{ background: Theme.success }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className="flex w-[260px] shrink-0 flex-col overflow-y-auto"
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
            navItems={navItemsLocalized}
            userModuleCodes={userModuleCodes}
          />
        </aside>
      )}

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-[1000] bg-black/40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 top-0 z-[1001] flex w-[280px] flex-col overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.12)]"
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
                navItems={navItemsLocalized}
                userModuleCodes={userModuleCodes}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <main
        className={`flex flex-1 flex-col overflow-auto ${isMobile ? 'pb-[60px]' : 'pb-0'}`}
      >
        {/* Topbar */}
        <header
          className={`sticky top-0 z-10 flex shrink-0 items-center justify-between ${isMobile ? 'h-[52px] px-4' : 'h-[58px] px-8'}`}
          style={{
            background: Theme.card,
            borderBottom: `1px solid ${Theme.border}`,
          }}
        >
          <div className="flex items-center gap-2.5">
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
                <span style={{ fontSize: 12, color: Theme.mutedFg }}>{t.topbar.dashboard}</span>
                <span style={{ color: Theme.border }}>›</span>
              </>
            )}
            <span
              style={{
                fontSize: 14,
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
            {/* Language Toggle */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{
                background: locale === 'bn' ? Theme.primary : Theme.secondary,
                color: locale === 'bn' ? '#fff' : Theme.fg,
                border: `1px solid ${locale === 'bn' ? Theme.primary : Theme.border}`,
              }}
              title={locale === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English'}
            >
              <span style={{ fontSize: 14 }}>🌐</span>
              <span>{locale === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-2 py-1.5 shrink-0 cursor-pointer rounded-full transition-all duration-200 hover:shadow-md"
                style={{
                  background: Theme.secondary,
                  border: `1px solid ${Theme.border}`,
                }}
                title="User Profile"
              >
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold overflow-hidden"
                  style={{ background: Theme.primary, color: 'white' }}
                >
                  {profileUser?.avatarUrl
                    ? <img src={profileUser.avatarUrl} alt={profileUser.name} className="h-full w-full object-cover" />
                    : profileUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                {!isMobile && (
                  <span className="text-[13px] font-bold pr-1.5" style={{ color: Theme.fg }}>
                    {profileUser?.name || 'User'}
                  </span>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-3 w-64 rounded-xl shadow-2xl z-50 overflow-hidden"
                    style={{ background: Theme.card, border: `1px solid ${Theme.border}` }}
                  >
                    {/* User Header */}
                    <div
                      className="px-6 py-6 border-b text-center"
                      style={{
                        borderColor: Theme.border,
                        background: `linear-gradient(180deg, ${Theme.secondary}20 0%, transparent 100%)`,
                      }}
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div
                          className="flex h-20 w-20 items-center justify-center rounded-full text-[28px] font-black text-white shadow-lg overflow-hidden"
                          style={{ 
                            background: `linear-gradient(135deg, ${Theme.primary} 0%, ${Theme.primary}dd 100%)`,
                            border: `4px solid ${Theme.card}`,
                          }}
                        >
                          {profileUser?.avatarUrl
                            ? <img src={profileUser.avatarUrl} alt={profileUser.name} className="h-full w-full object-cover" />
                            : profileUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="space-y-1">
                          <div className="text-[16px] font-bold tracking-tight" style={{ color: Theme.fg }}>
                            {profileUser?.name || t.profile.user}
                          </div>
                          <div className="text-[11px] font-medium uppercase tracking-widest opacity-60" style={{ color: Theme.mutedFg }}>
                            {profileUser?.role || t.profile.administrator}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 px-5 py-4" style={{ background: Theme.card }}>
                      <button
                        onClick={() => { navigate('profile'); setProfileOpen(false); }}
                        className="flex-1 px-3 py-2.5 rounded-xl text-center text-[12px] font-bold transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        style={{
                          background: Theme.secondary + '40',
                          color: Theme.primary,
                          border: `1px solid ${Theme.secondary}`,
                        }}
                      >
                        <User size={15} strokeWidth={2.5} />
                        <span>{t.profile.account}</span>
                      </button>
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
                        <span>{t.profile.logout}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content with page transition */}
        <div
          className={`flex-1 overflow-y-auto ${isMobile ? 'px-[14px] py-4' : 'px-8 py-6'}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav + (activeNav === 'settings' ? settingsTab : '')}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {resolvedView}
            </motion.div>
          </AnimatePresence>
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
            { id: 'overview', label: t.mobileNav.home, icon: '◈' },
            { id: 'inventory', label: t.mobileNav.inventory, icon: '📦' },
            { id: 'sales', label: t.mobileNav.sales, icon: '💰' },
            { id: 'ecommerce', label: t.mobileNav.orders, icon: '🌐' },
            { id: 'settings', label: t.mobileNav.settings, icon: '⚙️' },
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
      <AnimatePresence>
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
                  note: note || t.walkInSale,
                  date: t.justNow,
                  by: t.manager,
                },
                ...sellLog,
              ]);
              setToast(`✓ ${t.sold} ${qty} × ${product.name}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const POSView: React.FC = () => {
  const { t } = useDashboardLocale();
  return (
  <div className="flex min-h-[400px] flex-col items-center justify-center gap-[18px] px-5 py-8 text-center">
    <div
      className="flex h-20 w-20 items-center justify-center rounded-[22px] text-[40px]"
      style={{ background: Theme.secondary }}
    >
      🖥️
    </div>
    <div style={{ fontSize: 26, fontWeight: 800, color: Theme.fg }}>
      {t.pos.title}
    </div>
    <div
      className="max-w-[380px] text-sm leading-[1.8]"
      style={{ color: Theme.mutedFg }}
    >
      {t.pos.description}{' '}
      <strong style={{ color: Theme.primary }}>{t.pos.manualSell}</strong> {t.pos.suffix}
    </div>
  </div>
  );
};
