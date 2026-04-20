'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Theme, formatCurrency, statusStyles, stockStatusStyle } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, Btn, Badge } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';
import { useListCustomers } from '@/modules/customers';
import { useListOrders, useUpdateOrderStatusMutation } from '@/modules/orders';
import type { Customer } from '@/shared/types';
import type { Order as RealOrder } from '@/shared/types';

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

  const [tab, setTab] = useState<TabType>('orders');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
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
        {(['orders', 'products', 'customers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer whitespace-nowrap rounded-lg border-none px-4 py-2 text-[13px] font-semibold capitalize ${isMobile ? 'flex-1' : ''}`}
            style={{
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? Theme.primary : Theme.mutedFg,
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <>
          {/* Stat cards row */}
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
            {[
              { label: 'Total Orders', value: realOrders.length, icon: '📦', accent: '#f0f4ff', numColor: Theme.fg },
              { label: 'Pending', value: realOrders.filter(o => String(o.status).toUpperCase() === 'PENDING').length, icon: '⏳', accent: '#fffbeb', numColor: '#b45309' },
              { label: 'Processing', value: realOrders.filter(o => String(o.status).toUpperCase() === 'PROCESSING').length, icon: '⚙️', accent: '#fff7ed', numColor: '#c2410c' },
              { label: 'Shipped', value: realOrders.filter(o => String(o.status).toUpperCase() === 'SHIPPED').length, icon: '🚚', accent: '#eff6ff', numColor: '#1d4ed8' },
              { label: 'Delivered', value: realOrders.filter(o => String(o.status).toUpperCase() === 'DELIVERED').length, icon: '✅', accent: '#f0fdf4', numColor: '#15803d' },
              { label: 'Avg. Value', value: formatCurrency(realOrders.length > 0 ? realOrders.reduce((s, o) => s + Number(o.total || 0), 0) / realOrders.length : 0), icon: '💳', accent: '#fdf2f8', numColor: Theme.primary },
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
                <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>All Orders</div>
                <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                  {realOrders.filter(o => {
                    const term = orderSearch.trim().toLowerCase();
                    if (!term) return true;
                    return (o.orderNumber || '').toLowerCase().includes(term) || (o.shippingName || '').toLowerCase().includes(term);
                  }).length} of {realOrders.length} orders shown
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order or customer"
                  className="w-[200px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg }}
                />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value as OrderFilter)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Btn variant="ghost" size="sm" onClick={() => void refetchOrders()}>Refresh</Btn>
              </div>
            </div>

            {realOrdersLoading ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>Loading orders...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead>
                    <tr>
                      {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Update Status'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-[11px] text-left text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: Theme.mutedFg, background: Theme.muted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {realOrders.filter(o => {
                      const term = orderSearch.trim().toLowerCase();
                      if (!term) return true;
                      return (o.orderNumber || '').toLowerCase().includes(term) || (o.shippingName || '').toLowerCase().includes(term);
                    }).length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                          No orders found.
                        </td>
                      </tr>
                    )}
                    {realOrders
                      .filter(o => {
                        const term = orderSearch.trim().toLowerCase();
                        if (!term) return true;
                        return (o.orderNumber || '').toLowerCase().includes(term) || (o.shippingName || '').toLowerCase().includes(term);
                      })
                      .map((order, i) => {
                        const currentStatus = String(order.status).toUpperCase() as RealOrderStatus;
                        const selected = pendingStatus[order.id] ?? currentStatus;
                        const statusStyle = realStatusStyle(currentStatus);
                        const isSaving = updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === order.id;

                        return (
                          <tr key={order.id} style={{ background: i % 2 === 0 ? '#fff' : Theme.muted }}>
                            <td className="px-4 py-3 text-[13px] font-bold" style={{ color: Theme.primary }}>
                              #{order.orderNumber}
                            </td>
                            <td className="px-4 py-3 text-[13px]" style={{ color: Theme.fg }}>
                              <p className="font-semibold">{order.shippingName || 'N/A'}</p>
                              <p className="text-xs" style={{ color: Theme.mutedFg }}>{order.shippingCity || ''}</p>
                            </td>
                            <td className="px-4 py-3 text-[13px]" style={{ color: Theme.mutedFg }}>
                              {order.items?.length ?? 0}
                            </td>
                            <td className="px-4 py-3 text-[13px] font-bold" style={{ color: Theme.fg }}>
                              {formatCurrency(Number(order.total || 0))}
                            </td>
                            <td className="px-4 py-3 text-[13px]">
                              <Badge label={currentStatus} bg={statusStyle.bg} color={statusStyle.color} />
                            </td>
                            <td className="px-4 py-3 text-[13px]" style={{ color: Theme.mutedFg }}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <select
                                  value={selected}
                                  onChange={(e) => setPendingStatus(prev => ({ ...prev, [order.id]: e.target.value as RealOrderStatus }))}
                                  className="rounded-lg border px-2 py-1 text-xs outline-none"
                                  style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
                                  disabled={isSaving || currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED'}
                                >
                                  {REAL_ORDER_STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                                <Btn
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    if (selected !== currentStatus) {
                                      updateStatusMutation.mutate({ orderId: order.id, data: { status: selected } });
                                    }
                                  }}
                                  disabled={selected === currentStatus || isSaving || currentStatus === 'DELIVERED' || currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED'}
                                >
                                  {isSaving ? '...' : 'Save'}
                                </Btn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
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
                Product Catalogue
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                {filteredProducts.length} of {products.length} products shown
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Search name or SKU"
                className="w-[200px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg }}
              />
              <select
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value as ProductFilter)}
                className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
              >
                <option value="all">All Stock</option>
                <option value="active">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
              <Btn variant="primary" size="sm" onClick={() => router.push('/dashboard/settings?tab=products')}>
                + Add Product
              </Btn>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  {['Product', 'SKU', 'Price', 'Stock', 'Status', ''].map((h) => (
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
                        No products matched your filters.
                      </td>
                    </tr>
                  )}

                  {filteredProducts.map((p, i) => {
                    const stockStyle = stockStatusStyle(p.status);
                    const stockLabel = p.status === 'out' ? 'Out of Stock' : p.status === 'low' ? 'Low Stock' : 'In Stock';

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
                            Edit
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Total Customers', value: totalCustomers, icon: '👥', accent: '#fdf2f8', numColor: Theme.primary },
              { label: 'Active', value: activeCustomers, icon: '🟢', accent: '#f0fdf4', numColor: '#15803d' },
              { label: 'Returning', value: `${totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : '0.0'}%`, icon: '↩️', accent: '#eff6ff', numColor: '#1d4ed8' },
              { label: 'Avg. LTV', value: formatCurrency(averageLtv), icon: '💎', accent: '#f0f4ff', numColor: Theme.fg },
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
                  Customer Directory
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                  {filteredCustomers.length} of {customers.length} customers shown
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                  placeholder="Search name, email, segment"
                  className="w-[220px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg }}
                />
                <Btn variant="ghost" size="sm" onClick={() => void refetchCustomers()}>
                  Refresh
                </Btn>
              </div>
            </div>

            {customersLoading ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                Loading customers...
              </div>
            ) : customersError ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: Theme.danger }}>
                  {(customersErrorData as { message?: string })?.message || 'Failed to load customers'}
                </p>
                <div className="mt-3">
                  <Btn variant="primary" size="sm" onClick={() => void refetchCustomers()}>
                    Retry
                  </Btn>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse">
                  <thead>
                    <tr>
                      {['Customer', 'Segment', 'Orders', 'Total Spent', 'Loyalty', 'Last Order'].map((h) => (
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
                          No customers matched your search.
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
