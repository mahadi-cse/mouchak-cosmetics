'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency, statusStyles } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, SecHead, Btn, Badge } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';

interface EcommerceViewProps {
  products: Product[];
  orders: Order[];
}

export default function EcommerceView({ products, orders }: EcommerceViewProps) {
  const { isMobile } = useResponsive();
  const [tab, setTab] = useState<'orders' | 'products' | 'customers'>('orders');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: Theme.muted,
          borderRadius: 10,
          padding: 4,
          width: isMobile ? '100%' : 'fit-content',
          overflowX: 'auto',
        }}
      >
        {(['orders', 'products', 'customers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'capitalize',
              flex: isMobile ? 1 : undefined,
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? Theme.primary : Theme.mutedFg,
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <KpiCard label="Total Orders" value="1,247" delta={12.3} icon="📦" accent="#dbeafe" />
            <KpiCard label="Pending" value="23" sub="action needed" icon="⏳" accent="#fef9c3" />
            <KpiCard label="Delivered" value="1,089" sub="87.3% rate" icon="✅" accent="#dcfce7" />
            <KpiCard label="Avg. Order Value" value="৳1,284" delta={4.1} icon="💳" accent="#fff0f6" />
          </div>
          <Card pad={0}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${Theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700 }}>All Orders</div>
              <Btn variant="primary" size="sm">
                + New Order
              </Btn>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Time', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '11px 16px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 700,
                          color: Theme.mutedFg,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          background: Theme.muted,
                          whiteSpace: 'nowrap',
                        }}
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
                        <td style={{ padding: '12px 16px', fontSize: 13, color: Theme.primary, fontWeight: 700 }}>
                          {o.id}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: Theme.fg }}>
                          {o.customer}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: Theme.mutedFg }}>
                          {o.items}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: Theme.fg }}>
                          {formatCurrency(o.amount)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>
                          <Badge label={o.status} bg={s.bg} color={s.color} />
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: Theme.mutedFg }}>
                          {o.time}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13 }}>
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
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${Theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>Product Catalogue</div>
            <Btn variant="primary" size="sm">
              + Add Product
            </Btn>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {['Product', 'SKU', 'Price', 'Stock', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '11px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: Theme.mutedFg,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        background: Theme.muted,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.sku} style={{ background: i % 2 === 0 ? '#fff' : Theme.muted }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: Theme.fg }}>
                      {p.name}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: Theme.mutedFg,
                      }}
                    >
                      {p.sku}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: Theme.fg }}>
                      {formatCurrency(p.price)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: Theme.fg }}>
                      {p.stock}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <Badge
                        label={p.status === 'out' ? 'Out of Stock' : p.status === 'low' ? 'Low Stock' : 'In Stock'}
                        bg={p.status === 'out' ? '#fee2e2' : p.status === 'low' ? '#fef9c3' : '#dcfce7'}
                        color={p.status === 'out' ? '#991b1b' : p.status === 'low' ? '#854d0e' : '#166534'}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <KpiCard label="Total Customers" value="1,847" delta={8.2} icon="👥" accent="#fff0f6" />
            <KpiCard label="Returning" value="64%" sub="1,182 customers" icon="↩" accent="#dcfce7" />
          </div>
          <KpiCard label="Avg. LTV" value="৳8,420" delta={5.7} icon="💎" accent="#dbeafe" />
        </div>
      )}
    </div>
  );
}
