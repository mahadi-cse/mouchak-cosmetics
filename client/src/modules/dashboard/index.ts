// Dashboard Module - Exports
export { default as DashboardLayout } from './components/DashboardLayout';

// Views
export { default as OverviewView } from './components/views/OverviewView';
export { default as ProductsView } from './components/views/ProductsView';
export { default as CategoriesView } from './components/views/CategoriesView';
export { default as EcommerceView } from './components/views/EcommerceView';
export { default as InventoryView } from './components/views/InventoryView';
export { default as AnalyticsView } from './components/views/AnalyticsView';
export { default as ReturnsView } from './components/views/ReturnsView';
export { default as SuppliersView } from './components/views/SuppliersView';
export { default as BranchesView } from './components/views/BranchesView';
export { default as SettingsView } from './components/views/SettingsView';

// Primitive Components
export { Card, Btn, Badge, SecHead, KpiCard } from './components/Primitives';
export { Th, Td } from './components/Table';

// Hooks
export { useResponsive, ResponsiveContext } from './hooks/useResponsive';
export { useBreakpoint } from './hooks/useBreakpoint';

// Utils
export { Theme } from './utils/theme';
export { NAV, SETTINGS_ITEMS } from './utils/constants';

// Types
export type { Product, SellLog, Order } from './data/mockData';
