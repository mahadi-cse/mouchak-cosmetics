'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency, statusStyles } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, Btn, Badge } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';

interface EcommerceViewProps {
  products: Product[];
  orders: Order[];
}

export default function EcommerceView({ products, orders }: EcommerceViewProps) {
  const { isMobile } = useResponsive();
  const [tab, setTab] = useState<'orders' | 'products' | 'customers'>('orders');

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
            <KpiCard label="Total Orders" value="1,247" delta={12.3} icon="📦" accent="#dbeafe" />
            <KpiCard label="Pending" value="23" sub="action needed" icon="⏳" accent="#fef9c3" />
            <KpiCard label="Delivered" value="1,089" sub="87.3% rate" icon="✅" accent="#dcfce7" />
            <KpiCard label="Avg. Order Value" value="৳1,284" delta={4.1} icon="💳" accent="#fff0f6" />
          </div>

          <Card pad={0}>
            <div
              className="flex items-center justify-between border-b px-[18px] py-[14px]"
              style={{ borderBottomColor: Theme.border }}
            >
              <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>
                All Orders
              </div>
              <Btn variant="primary" size="sm">
                + New Order
              </Btn>
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
                  {orders.map((o, i) => {
                    const s = statusStyles[o.status];

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
                          <Btn variant="ghost" size="sm">
                            View
                          </Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === 'products' && (
        <Card pad={0}>
          <div
            className="flex items-center justify-between border-b px-[18px] py-[14px]"
            style={{ borderBottomColor: Theme.border }}
          >
            <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>
              Product Catalogue
            </div>
            <Btn variant="primary" size="sm">
              + Add Product
            </Btn>
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
                {products.map((p, i) => (
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
                      <Badge
                        label={p.status === 'out' ? 'Out of Stock' : p.status === 'low' ? 'Low Stock' : 'In Stock'}
                        bg={p.status === 'out' ? '#fee2e2' : p.status === 'low' ? '#fef9c3' : '#dcfce7'}
                        color={p.status === 'out' ? '#991b1b' : p.status === 'low' ? '#854d0e' : '#166534'}
                      />
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      <Btn variant="ghost" size="sm">
                        Edit
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'customers' && (
        <div className="flex flex-col gap-[14px]">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Total Customers" value="1,847" delta={8.2} icon="👥" accent="#fff0f6" />
            <KpiCard label="Returning" value="64%" sub="1,182 customers" icon="↩" accent="#dcfce7" />
          </div>
          <KpiCard label="Avg. LTV" value="৳8,420" delta={5.7} icon="💎" accent="#dbeafe" />
        </div>
      )}
    </div>
  );
}
