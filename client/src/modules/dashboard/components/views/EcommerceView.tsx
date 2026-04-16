'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Theme, formatCurrency, statusStyles, stockStatusStyle } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, Btn, Badge } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';
import { useListCustomers } from '@/modules/customers';
import type { Customer } from '@/shared/types';

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

  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<ProductFilter>('all');

  const [customerSearch, setCustomerSearch] = useState('');
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

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
  const totalOrderAmount = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalOrderAmount / totalOrders : 0;
  const deliveredRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter = orderFilter === 'all' ? true : order.status === orderFilter;
      const matchesSearch = !term
        ? true
        : order.id.toLowerCase().includes(term) || order.customer.toLowerCase().includes(term);

      return matchesFilter && matchesSearch;
    });
  }, [orders, orderSearch, orderFilter]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((order) => order.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

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
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total Orders" value={totalOrders} icon="📦" accent="#dbeafe" />
            <KpiCard label="Pending" value={pendingOrders} sub="action needed" icon="⏳" accent="#fef9c3" />
            <KpiCard
              label="Delivered"
              value={deliveredOrders}
              sub={`${deliveredRate.toFixed(1)}% delivery rate`}
              icon="✅"
              accent="#dcfce7"
            />
            <KpiCard label="Avg. Order Value" value={formatCurrency(averageOrderValue)} icon="💳" accent="#fff0f6" />
          </div>

          <Card pad={0}>
            <div
              className="flex items-center justify-between border-b px-[18px] py-[14px]"
              style={{ borderBottomColor: Theme.border }}
            >
              <div>
                <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>
                  All Orders
                </div>
                <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                  {filteredOrders.length} of {orders.length} orders shown
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="Search order or customer"
                  className="w-[200px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg }}
                />
                <select
                  value={orderFilter}
                  onChange={(event) => setOrderFilter(event.target.value as OrderFilter)}
                  className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                  style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
                <Btn variant="primary" size="sm" onClick={() => router.push('/products')}>
                  + New Order
                </Btn>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time', ''].map((h) => (
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
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                        No orders matched your filters.
                      </td>
                    </tr>
                  )}
                  {filteredOrders.map((o, i) => {
                    const s = statusStyles[o.status] || statusStyles.pending;

                    return (
                      <tr key={o.id} style={{ background: i % 2 === 0 ? '#fff' : Theme.muted }}>
                        <td className="px-4 py-3 text-[13px] font-bold" style={{ color: Theme.primary }}>
                          {o.id}
                        </td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: Theme.fg }}>
                          {o.customer}
                        </td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: Theme.mutedFg }}>
                          {o.items}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-bold" style={{ color: Theme.fg }}>
                          {formatCurrency(o.amount)}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          <Badge label={o.status} bg={s.bg} color={s.color} />
                        </td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: Theme.mutedFg }}>
                          {o.time}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          <Btn variant="ghost" size="sm" onClick={() => setSelectedOrderId(o.id)}>
                            View
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selectedOrder && (
              <div className="border-t px-[18px] py-4" style={{ borderTopColor: Theme.border, background: '#fff' }}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: Theme.fg }}>
                      Selected Order: {selectedOrder.id}
                    </p>
                    <p className="text-xs" style={{ color: Theme.mutedFg }}>
                      {selectedOrder.customer} · {selectedOrder.items} items · {selectedOrder.time}
                    </p>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={() => setSelectedOrderId(null)}>
                    Clear
                  </Btn>
                </div>
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
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total Customers" value={totalCustomers} icon="👥" accent="#fff0f6" />
            <KpiCard
              label="Returning"
              value={`${totalCustomers > 0 ? ((returningCustomers / totalCustomers) * 100).toFixed(1) : '0.0'}%`}
              sub={`${returningCustomers} customers`}
              icon="↩"
              accent="#dcfce7"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Avg. LTV" value={formatCurrency(averageLtv)} icon="💎" accent="#dbeafe" />
            <KpiCard label="Active Customers" value={activeCustomers} icon="🟢" accent="#ecfdf5" />
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
