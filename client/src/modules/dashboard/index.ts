// Dashboard Module - Exports
export { default as DashboardShell } from './components/DashboardShell';
export { default as DashboardPageView } from './components/DashboardPageView';
export { default as OverviewView } from './components/views/OverviewView';

// Primitive Components



// Hooks
export { useResponsive, ResponsiveContext } from '@/shared/hooks/useResponsive';
export { useBreakpoint } from '@/shared/hooks/useBreakpoint';
export { useDashboardData } from './hooks/useDashboardData';

// Utils
export { Theme } from './utils/theme';
export { NAV, SETTINGS_ITEMS } from './utils/constants';

// Types
export type { Product, SellLog, Order } from './types';

// Locales
export { DashboardLocaleProvider, useDashboardLocale } from './locales/DashboardLocaleContext';
export type { Locale, DashboardTranslations } from './locales/types';
