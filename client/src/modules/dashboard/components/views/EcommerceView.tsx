'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Theme, formatCurrency, statusStyles, stockStatusStyle } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, Btn, Badge } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';
import { useListCustomers } from '@/modules/customers';
import { useListOrders, useUpdateOrderStatusMutation } from '@/modules/orders';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import type { Customer } from '@/shared/types';
import type { Order as RealOrder } from '@/shared/types';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';

type RealOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

const REAL_ORDER_STATUSES: RealOrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const realStatusStyle = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'DELIVERED': return { bg: '#dcfce7', color: '#166534' };
    case 'SHIPPED':   return { bg: '#dbeafe', color: '#1e40af' };
    case 'PROCESSING': return { bg: '#fff7ed', color: '#c2410c' };
    case 'CONFIRMED': return { bg: '#f0f9ff', color: '#0369a1' };
    case 'CANCELLED': return { bg: '#fee2e2', color: '#b91c1c' };
    case 'REFUNDED':  return { bg: '#fdf4ff', color: '#86198f' };
    default:          return { bg: '#fef9c3', color: '#854d0e' };
  }
};

interface EcommerceViewProps {
  products: Product[];
  orders: Order[];
}

type TabType = 'orders' | 'products' | 'customers';
type OrderFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';
type ProductFilter = 'all' | 'active' | 'low' | 'out';

const getTrackingSteps = (t: any) => [
  { status: 'PENDING',    label: t.ecommerce.placed,     icon: '🛒' },
  { status: 'CONFIRMED',  label: t.ecommerce.confirmed,  icon: '✅' },
  { status: 'PROCESSING', label: t.ecommerce.processing, icon: '⚙️' },
  { status: 'SHIPPED',    label: t.ecommerce.shipped,    icon: '🚚' },
  { status: 'DELIVERED',  label: t.ecommerce.delivered,  icon: '📦' },
];

const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

const getStepState = (stepStatus: string, orderStatus: string): 'done' | 'active' | 'upcoming' => {
  const upper = orderStatus.toUpperCase();
  if (upper === 'CANCELLED' || upper === 'REFUNDED') return 'upcoming';
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const orderIdx = STATUS_ORDER.indexOf(upper);
  if (stepIdx < orderIdx) return 'done';
  if (stepIdx === orderIdx) return 'active';
  return 'upcoming';
};

function formatDateLabel(value?: string) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleDateString('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getSegmentColor(segment?: string) {
  const normalized = String(segment || 'NEW').toUpperCase();

  if (normalized === 'VIP') {
    return { bg: '#fef3c7', color: '#92400e' };
  }
  if (normalized === 'REGULAR') {
    return { bg: '#dbeafe', color: '#1e40af' };
  }
  if (normalized === 'INACTIVE') {
    return { bg: '#fee2e2', color: '#991b1b' };
  }

  return { bg: '#f3f4f6', color: '#374151' };
}

export default function EcommerceView({ products, orders }: EcommerceViewProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
  const TRACKING_STEPS = useMemo(() => getTrackingSteps(t), [t]);

  const [tab, setTab] = useState<TabType>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<number, RealOrderStatus>>({});

  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');

  const [customerSearch, setCustomerSearch] = useState('');

  // Real orders from API
  const { data: realOrdersData, isLoading: realOrdersLoading, refetch: refetchOrders } = useListOrders(
    { page: 1, limit: 50, ...(orderFilter !== 'all' ? { status: orderFilter.toUpperCase() } : {}) },
    { enabled: tab === 'orders', staleTime: 30 * 1000 }
  );
  const realOrders: RealOrder[] = Array.isArray(realOrdersData) ? realOrdersData : [];

  const updateStatusMutation = useUpdateOrderStatusMutation({
    onSuccess: () => { void refetchOrders(); },
  });
  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersError,
    error: customersErrorData,
    refetch: refetchCustomers,
  } = useListCustomers(
    { page: 1, limit: 100 },
    { enabled: tab === 'customers', staleTime: 5 * 60 * 1000 }
  );

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter = productFilter === 'all' ? true : product.status === productFilter;
      const matchesSearch = !term
        ? true
        : product.name.toLowerCase().includes(term) || product.sku.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [products, productSearch, productFilter]);

  const totalCustomers = customers.length;
  const returningCustomers = customers.filter((customer) => Number(customer.totalOrders || 0) > 1).length;
  const activeCustomers = customers.filter((customer) => customer.isActive).length;
  const averageLtv =
    totalCustomers > 0
      ? customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0) / totalCustomers
      : 0;

  const filteredCustomers = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();

    return customers.filter((customer: Customer) => {
      if (!term) return true;

      const firstName = customer.user?.firstName || '';
      const lastName = customer.user?.lastName || '';
      const email = customer.user?.email || '';
      const segment = String(customer.segment || 'NEW');
      const fullName = `${firstName} ${lastName}`.trim();

      return [fullName, email, segment].some((value) => value.toLowerCase().includes(term));
    });
  }, [customers, customerSearch]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex gap-1 overflow-x-auto rounded-[10px] p-1 ${isMobile ? 'w-full' : 'w-fit'}`}
        style={{ background: Theme.muted }}
      >
        {(['orders', 'products', 'customers'] as const).map((tTab) => (
          <button
            key={tTab}
            onClick={() => setTab(tTab)}
            className={`cursor-pointer whitespace-nowrap rounded-lg border-none px-4 py-2 text-[13px] font-semibold capitalize ${isMobile ? 'flex-1' : ''}`}
            style={{
              background: tab === tTab ? '#fff' : 'transparent',
              color: tab === tTab ? Theme.primary : Theme.mutedFg,
              boxShadow: tab === tTab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t.ecommerce[tTab]}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <>
          {/* Stat cards row */}
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6 2xl:gap-4">
            {[
              { label: t.ecommerce.totalOrders, value: realOrders.length, icon: '📦', accent: '#f0f4ff', numColor: Theme.fg },
              { label: t.ecommerce.pending, value: realOrders.filter(o => String(o.status).toUpperCase() === 'PENDING').length, icon: '⏳', accent: '#fffbeb', numColor: '#b45309' },
              { label: t.ecommerce.processing, value: realOrders.filter(o => String(o.status).toUpperCase() === 'PROCESSING').length, icon: '⚙️', accent: '#fff7ed', numColor: '#c2410c' },
              { label: t.ecommerce.shipped, value: realOrders.filter(o => String(o.status).toUpperCase() === 'SHIPPED').length, icon: '🚚', accent: '#eff6ff', numColor: '#1d4ed8' },
              { label: t.ecommerce.delivered, value: realOrders.filter(o => String(o.status).toUpperCase() === 'DELIVERED').length, icon: '✅', accent: '#f0fdf4', numColor: '#15803d' },
              { label: t.ecommerce.avgValue, value: formatCurrency(realOrders.length > 0 ? realOrders.reduce((s, o) => s + Number(o.total || 0), 0) / realOrders.length : 0), icon: '💳', accent: '#fdf2f8', numColor: Theme.primary },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: Theme.border, background: stat.accent }}
              >
                <span className="text-2xl leading-none">{stat.icon}</span>
                <div className="min-w-0">
                  <div className="text-[22px] font-black leading-tight tracking-tight" style={{ color: stat.numColor }}>{stat.value}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.07em] leading-tight" style={{ color: Theme.mutedFg }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <Card pad={0}>
            <div className="flex items-center justify-between border-b px-[18px] py-[14px]" style={{ borderBottomColor: Theme.border }}>
              <div>
                <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>{t.ecommerce.allOrders}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                  {t.ecommerce.ordersShown.replace('{count}', realOrders.filter(o => {
                    const term = orderSearch.trim().toLowerCase();
                    if (!term) return true;
                    return (o.orderNumber || '').toLowerCase().includes(term) || (o.shippingName || '').toLowerCase().includes(term);
                  }).length.toString()).replace('{total}', realOrders.length.toString())}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder={t.ecommerce.searchOrderOrCustomer}
                  className="w-[200px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg }}
                />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value as OrderFilter)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
                >
                  <option value="all">{t.ecommerce.allStatus}</option>
                  <option value="pending">{t.ecommerce.pending}</option>
                  <option value="confirmed">{t.ecommerce.confirmed}</option>
                  <option value="processing">{t.ecommerce.processing}</option>
                  <option value="shipped">{t.ecommerce.shipped}</option>
                  <option value="delivered">{t.ecommerce.delivered}</option>
                  <option value="cancelled">{t.ecommerce.cancelled}</option>
                </select>
                <Btn variant="ghost" size="sm" onClick={() => void refetchOrders()}>{t.ecommerce.refresh}</Btn>
              </div>
            </div>

            {realOrdersLoading ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>{t.ecommerce.loadingOrders}</div>
            ) : (
              <div className="divide-y" style={{ borderColor: Theme.border }}>
                {realOrders.filter(o => {
                  const term = orderSearch.trim().toLowerCase();
                  if (!term) return true;
                  return (o.orderNumber || '').toLowerCase().includes(term) || (o.shippingName || '').toLowerCase().includes(term);
                }).length === 0 && (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                    {t.ecommerce.noOrdersFound}
                  </div>
                )}
                {realOrders
                  .filter(o => {
                    const term = orderSearch.trim().toLowerCase();
                    if (!term) return true;
                    return (o.orderNumber || '').toLowerCase().includes(term) || (o.shippingName || '').toLowerCase().includes(term);
                  })
                  .map((order) => {
                    const currentStatus = String(order.status).toUpperCase() as RealOrderStatus;
                    const statusStyle = realStatusStyle(currentStatus);
                    const isExpanded = expandedOrderId === order.id;
                    const selected = pendingStatus[order.id] ?? currentStatus;
                    const isSaving = updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id;
                    const isTerminal = currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED';

                    return (
                      <div key={order.id}>
                        {/* Collapsed row */}
                        <div
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-bold" style={{ color: Theme.primary }}>#{order.orderNumber}</span>
                              <span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>{order.shippingName || 'N/A'}</span>
                              <Badge label={currentStatus} bg={statusStyle.bg} color={statusStyle.color} />
                            </div>
                            <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                              {order.items?.length ?? 0} {order.items?.length === 1 ? t.ecommerce.item : t.ecommerce.items} · {formatCurrency(Number(order.total || 0))} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : t.na}
                            </div>
                          </div>
                          <span style={{ color: Theme.mutedFg, fontSize: 14, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>▶</span>
                        </div>

                        {/* Expanded detail — compact single-screen layout */}
                        {isExpanded && (
                          <div className="px-4 pb-3 pt-1" style={{ background: Theme.muted }}>
                            <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
                              {/* Left: stepper + status update */}
                              <div className="flex-1 min-w-0">
                                {/* Compact inline stepper */}
                                {currentStatus !== 'CANCELLED' && currentStatus !== 'REFUNDED' ? (
                                  <div className="flex items-center gap-0 mb-2">
                                    {TRACKING_STEPS.map((step, idx) => {
                                      const state = getStepState(step.status, currentStatus);
                                      return (
                                        <React.Fragment key={step.status}>
                                          <div className="flex flex-col items-center" style={{ minWidth: 44 }}>
                                            <div
                                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
                                              style={{
                                                background: state !== 'upcoming' ? Theme.primary : '#e5e7eb',
                                                color: state !== 'upcoming' ? '#fff' : Theme.mutedFg,
                                                fontWeight: 700,
                                                boxShadow: state === 'active' ? `0 0 0 2px ${Theme.primary}33` : 'none',
                                              }}
                                            >
                                              {step.icon}
                                            </div>
                                            <p className="mt-0.5 text-[8px] font-semibold text-center leading-tight" style={{ color: state !== 'upcoming' ? Theme.fg : Theme.mutedFg }}>
                                              {step.label}
                                            </p>
                                          </div>
                                          {idx < TRACKING_STEPS.length - 1 && (
                                            <div className="h-[2px] flex-1 mx-0.5 -mt-3" style={{ background: getStepState(TRACKING_STEPS[idx + 1].status, currentStatus) !== 'upcoming' ? Theme.primary : '#e5e7eb' }} />
                                          )}
                                        </React.Fragment>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="mb-2 rounded px-2 py-1 text-[10px] font-semibold" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                                    Order {currentStatus.toLowerCase()}
                                  </div>
                                )}

                                {/* Inline info row */}
                                <div className="flex gap-2 text-[10px] flex-wrap" style={{ color: Theme.mutedFg }}>
                                  <span>📍 {order.shippingName}, {order.shippingCity}</span>
                                  <span>·</span>
                                  <span>📞 {order.shippingPhone}</span>
                                  {(order.customer?.user?.email) && (
                                    <>
                                      <span>·</span>
                                      <span>✉️ {order.customer?.user?.email}</span>
                                    </>
                                  )}
                                  <span>·</span>
                                  <span>{(order.items || []).map((item: any) => `${item.productName || item.product?.name || 'Item'} ×${item.quantity}`).join(', ')}</span>
                                </div>

                                {/* Payment Info */}
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-zinc-600 border border-zinc-200">
                                    <span className="opacity-50">Method:</span> {order.payment?.method || 'CASH'}
                                  </span>
                                  {order.payment?.tranId && (
                                    <span className="flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-emerald-700 border border-emerald-100">
                                      <span className="opacity-50">TXN:</span> {order.payment.tranId}
                                    </span>
                                  )}
                                </div>

                                {/* Timeline pills */}
                                {order.trackingEvents && order.trackingEvents.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {order.trackingEvents.map((event) => (
                                      <span key={event.id} className="rounded bg-white border px-1.5 py-0.5 text-[9px]" style={{ borderColor: Theme.border, color: Theme.mutedFg }}>
                                        {event.title} <span className="opacity-60">{new Date(event.createdAt).toLocaleString('en-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Right: amount + status update */}
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <div className="text-base font-black" style={{ color: Theme.primary }}>{formatCurrency(Number(order.total || 0))}</div>
                                {!isTerminal && (
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={selected}
                                      onChange={(e) => setPendingStatus(prev => ({ ...prev, [order.id]: e.target.value as RealOrderStatus }))}
                                      className="rounded border px-1.5 py-1 text-[11px] outline-none"
                                      style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
                                      disabled={isSaving}
                                    >
                                      {REAL_ORDER_STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                    <Btn
                                      variant="primary"
                                      size="sm"
                                      onClick={async () => {
                                        if (selected === currentStatus) return;
                                        const confirmed = await confirmDialog({
                                          title: t.ecommerce.updateOrderStatus,
                                          text: t.ecommerce.changeStatusMsg.replace('{orderNumber}', order.orderNumber).replace('{status}', selected),
                                          confirmButtonText: t.ecommerce.update,
                                          icon: 'question',
                                        });
                                        if (confirmed) {
                                          updateStatusMutation.mutate({ orderId: order.id, data: { status: selected } });
                                        }
                                      }}
                                      disabled={selected === currentStatus || isSaving}
                                    >
                                      {isSaving ? t.ecommerce.updating : t.ecommerce.update}
                                    </Btn>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'products' && (
        <Card pad={0}>
          <div
            className="flex items-center justify-between border-b px-[18px] py-[14px]"
            style={{ borderBottomColor: Theme.border }}
          >
            <div>
              <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>
                {t.ecommerce.productCatalogue}
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                {t.ecommerce.productsShown.replace('{count}', filteredProducts.length.toString()).replace('{total}', products.length.toString())}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder={t.ecommerce.searchNameOrSku}
                className="w-[200px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg }}
              />
              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value as ProductFilter)}
                className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
              >
                <option value="all">{t.ecommerce.allStock}</option>
                <option value="active">{t.ecommerce.inStock}</option>
                <option value="low">{t.ecommerce.lowStock}</option>
                <option value="out">{t.ecommerce.outOfStock}</option>
              </select>
              <Btn variant="primary" size="sm" onClick={() => router.push('/dashboard/settings?tab=products')}>
                {t.products.addProduct}
              </Btn>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  {[t.returns.product, t.modal.sku, t.ecommerce.price, t.returns.stock, t.inventory.status, ''].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-[11px] text-left text-[11px] font-bold uppercase tracking-[0.06em]"
                      style={{ color: Theme.mutedFg, background: Theme.muted }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                        {t.products.noProducts}
                      </td>
                    </tr>
                  )}

                  {filteredProducts.map((p, i) => {
                    const stockStyle = stockStatusStyle(p.status);
                    const stockLabel = p.status === 'out' ? t.ecommerce.outOfStock : p.status === 'low' ? t.ecommerce.lowStock : t.ecommerce.inStock;

                    return (
                      <tr key={p.sku} style={{ background: i % 2 === 0 ? '#fff' : Theme.muted }}>
                        <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: Theme.fg }}>
                          {p.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: Theme.mutedFg }}>
                          {p.sku}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: Theme.fg }}>
                          {formatCurrency(p.price)}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-bold" style={{ color: Theme.fg }}>
                          {p.stock}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          <Badge label={stockLabel} bg={stockStyle.bg} color={stockStyle.color} />
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          <Btn variant="ghost" size="sm" onClick={() => router.push('/dashboard/settings?tab=products')}>
                            {t.inventory.edit}
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
      )}

      {tab === 'customers' && (
        <div className="flex flex-col gap-[14px]">
          {/* Stat cards row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 2xl:gap-4">
            {[
              { label: t.ecommerce.totalCustomers, value: totalCustomers, icon: '👥', accent: '#fdf2f8', numColor: Theme.primary },
              { label: t.ecommerce.active, value: activeCustomers, icon: '🟢', accent: '#f0fdf4', numColor: '#15803d' },
              { label: t.ecommerce.returning, value: `${totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : '0.0'}%`, icon: '↩️', accent: '#eff6ff', numColor: '#1d4ed8' },
              { label: t.ecommerce.avgLtv, value: formatCurrency(averageLtv), icon: '💎', accent: '#f0f4ff', numColor: Theme.fg },
            ].map(stat => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{ borderColor: Theme.border, background: stat.accent }}
              >
                <span className="text-2xl leading-none">{stat.icon}</span>
                <div className="min-w-0">
                  <div className="text-[22px] font-black leading-tight tracking-tight" style={{ color: stat.numColor }}>{stat.value}</div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.07em] leading-tight" style={{ color: Theme.mutedFg }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <Card pad={0}>
            <div className="flex items-center justify-between border-b px-[18px] py-[14px]" style={{ borderBottomColor: Theme.border }}>
              <div>
                <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>
                  {t.ecommerce.customerDirectory}
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                  {t.ecommerce.customersShown.replace('{count}', filteredCustomers.length.toString()).replace('{total}', customers.length.toString())}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder={t.ecommerce.searchCustomer}
                  className="w-[220px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg }}
                />
                <Btn variant="ghost" size="sm" onClick={() => void refetchCustomers()}>
                  {t.ecommerce.refresh}
                </Btn>
              </div>
            </div>

            {customersLoading ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                {t.ecommerce.loadingCustomers}
              </div>
            ) : customersError ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: Theme.danger }}>
                  {(customersErrorData as { message?: string })?.message || t.ecommerce.failedLoadCustomers}
                </p>
                <div className="mt-3">
                  <Btn variant="primary" size="sm" onClick={() => void refetchCustomers()}>
                    {t.ecommerce.retry}
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead>
                    <tr>
                      {[t.ecommerce.customer, t.ecommerce.segment, t.ecommerce.orders, t.ecommerce.totalSpent, t.ecommerce.loyalty, t.ecommerce.lastOrder].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-[11px] text-left text-[11px] font-bold uppercase tracking-[0.06em]"
                          style={{ color: Theme.mutedFg, background: Theme.muted }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                          {t.ecommerce.noCustomersMatched}
                        </td>
                      </tr>
                    )}

                    {filteredCustomers.map((customer: Customer, index: number) => {
                      const firstName = customer.user?.firstName || '';
                      const lastName = customer.user?.lastName || '';
                      const fullName = `${firstName} ${lastName}`.trim() || `Customer #${customer.id}`;
                      const email = customer.user?.email || 'N/A';
                      const segment = String(customer.segment || 'NEW').toUpperCase();
                      const segmentStyle = getSegmentColor(segment);
                      const lastOrderValue =
                        (customer as { lastOrderAt?: string; lastOrderDate?: string }).lastOrderAt ||
                        customer.lastOrderDate;

                      return (
                        <tr key={customer.id} style={{ background: index % 2 === 0 ? '#fff' : Theme.muted }}>
                          <td className="px-4 py-3">
                            <p className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                              {fullName}
                            </p>
                            <p className="text-xs" style={{ color: Theme.mutedFg }}>
                              {email}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-[13px]">
                            <Badge label={segment} bg={segmentStyle.bg} color={segmentStyle.color} />
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: Theme.fg }}>
                            {customer.totalOrders}
                          </td>
                          <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: Theme.fg }}>
                            {formatCurrency(Number(customer.totalSpent || 0))}
                          </td>
                          <td className="px-4 py-3 text-[13px]" style={{ color: Theme.mutedFg }}>
                            {customer.loyaltyPoints}
                          </td>
                          <td className="px-4 py-3 text-[13px]" style={{ color: Theme.mutedFg }}>
                            {formatDateLabel(lastOrderValue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
