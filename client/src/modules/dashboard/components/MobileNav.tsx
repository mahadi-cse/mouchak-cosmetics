import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useDashboardLocale } from '../locales/DashboardLocaleContext';

interface MobileNavProps {
  activeNav: string;
  navigate: (id: string) => void;
  lowCount: number;
}

export function MobileNav({ activeNav, navigate, lowCount }: MobileNavProps) {
  const { t } = useDashboardLocale();

  return (
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
        { id: 'analytics', label: t.nav.analytics, icon: '📈' },
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
  );
}
