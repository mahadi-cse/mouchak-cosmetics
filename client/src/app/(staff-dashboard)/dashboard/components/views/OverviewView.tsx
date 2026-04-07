'use client';

import React from 'react';
import { Theme, formatCurrency } from '../../theme';
import { useResponsive } from '../../page';
import { Card, SecHead, Btn, Badge } from '../Primitives';
import { Product, Order } from '../../data/mockData';
import { statusStyles } from '../../theme';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface OverviewViewProps {
  products: Product[];
  orders: Order[];
  onQuickSale?: () => void;
}

const revenueData = [
  { month: 'Oct', revenue: 182000, orders: 134 },
  { month: 'Nov', revenue: 215000, orders: 167 },
  { month: 'Dec', revenue: 289000, orders: 221 },
  { month: 'Jan', revenue: 198000, orders: 154 },
  { month: 'Feb', revenue: 234000, orders: 178 },
  { month: 'Mar', revenue: 312000, orders: 243 },
];

export default function OverviewView({ products, orders, onQuickSale }: OverviewViewProps) {
  const { isMobile } = useResponsive();
  const categoryData = React.useMemo(() => {
    const total = products.length || 1;
    const counts = products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    const palette = ['#f01172', '#c20d5e', '#f59e0b', '#8b5cf6', '#757575'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: palette[i % palette.length],
      }));
  }, [products]);
  const topCategoryBadges = categoryData.slice(0, 3);
  const bestMonth = revenueData.reduce((max, item) => (item.revenue > max.revenue ? item : max), revenueData[0]);
  const weakestMonth = revenueData.reduce((min, item) => (item.revenue < min.revenue ? item : min), revenueData[0]);
  const latest = revenueData[revenueData.length - 1];
  const previous = revenueData[revenueData.length - 2];
  const momGrowth = ((latest.revenue - previous.revenue) / previous.revenue) * 100;
  const avgOrderValue = latest.revenue / latest.orders;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: Theme.fg, letterSpacing: '-0.01em' }}>
            Overview
          </div>
          <div style={{ fontSize: 13, color: Theme.mutedFg, marginTop: 2 }}>
            Today's snapshot across all channels
          </div>
        </div>

        {/* Quick action button */}
        <Btn variant="secondary" size="md" onClick={onQuickSale} style={{ flexShrink: 0 }}>
          🏪 + New Sale
        </Btn>
      </div>

      {/* FEATURED CHARTS FIRST - LARGE & PROMINENT */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Revenue Trend - Large chart */}
          <Card>
            <SecHead title="Revenue Trend" sub="6-month performance" />
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={Theme.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={Theme.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={Theme.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: Theme.mutedFg }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: Theme.mutedFg }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke={Theme.primary} strokeWidth={2.5} fill="url(#rg)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SecHead title="Revenue Insights" sub="Quick performance summary" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: 10, borderRadius: 8, background: Theme.muted }}>
                <div style={{ fontSize: 11, color: Theme.mutedFg, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Best Month
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg, marginTop: 4 }}>{bestMonth.month}</div>
                <div style={{ fontSize: 12, color: Theme.success, marginTop: 2 }}>{formatCurrency(bestMonth.revenue)}</div>
              </div>

              <div style={{ padding: 10, borderRadius: 8, background: Theme.muted }}>
                <div style={{ fontSize: 11, color: Theme.mutedFg, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Weakest Month
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg, marginTop: 4 }}>{weakestMonth.month}</div>
                <div style={{ fontSize: 12, color: Theme.warning, marginTop: 2 }}>{formatCurrency(weakestMonth.revenue)}</div>
              </div>

              <div style={{ padding: 10, borderRadius: 8, background: Theme.muted }}>
                <div style={{ fontSize: 11, color: Theme.mutedFg, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  MoM (Latest)
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg, marginTop: 4 }}>
                  {momGrowth >= 0 ? '▲' : '▼'} {Math.abs(momGrowth).toFixed(1)}%
                </div>
                <div style={{ fontSize: 12, color: momGrowth >= 0 ? Theme.success : Theme.danger, marginTop: 2 }}>
                  {previous.month} → {latest.month}
                </div>
              </div>

              <div style={{ padding: 10, borderRadius: 8, background: Theme.muted }}>
                <div style={{ fontSize: 11, color: Theme.mutedFg, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Avg / Order
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: Theme.fg, marginTop: 4 }}>{formatCurrency(avgOrderValue)}</div>
                <div style={{ fontSize: 12, color: Theme.mutedFg, marginTop: 2 }}>{latest.orders} orders in {latest.month}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Mix - Pie chart */}
        <Card>
          <SecHead title="Category Mix" sub="Product distribution" />
          <div style={{ position: 'relative', height: 320, marginBottom: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="46%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((c, i) => (
                    <Cell key={i} fill={c.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ background: Theme.card, border: `1px solid ${Theme.border}`, borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>

            {/* Always-visible tooltip-style top 3 labels */}
            <div
              style={{
                position: 'absolute',
                top: 18,
                left: isMobile ? 8 : 16,
                transform: 'translateY(-50%)',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${Theme.border}`,
                background: Theme.card,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: 12,
                fontWeight: 600,
                color: Theme.fg,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: topCategoryBadges[0]?.color, flexShrink: 0 }} />
              <span>{topCategoryBadges[0]?.name}: {topCategoryBadges[0]?.value}%</span>
            </div>

            <div
              style={{
                position: 'absolute',
                top: 44,
                right: isMobile ? 8 : 16,
                transform: 'translateY(-50%)',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${Theme.border}`,
                background: Theme.card,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: 12,
                fontWeight: 600,
                color: Theme.fg,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: topCategoryBadges[1]?.color, flexShrink: 0 }} />
              <span>{topCategoryBadges[1]?.name}: {topCategoryBadges[1]?.value}%</span>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: isMobile ? 6 : 10,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${Theme.border}`,
                background: Theme.card,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: 12,
                fontWeight: 600,
                color: Theme.fg,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: topCategoryBadges[2]?.color, flexShrink: 0 }} />
              <span>{topCategoryBadges[2]?.name}: {topCategoryBadges[2]?.value}%</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
            {categoryData.map((c) => (
              <div
                key={c.name}
                style={{
                  padding: '8px',
                  borderRadius: 8,
                  background: Theme.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: Theme.fg }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: Theme.mutedFg }}>{c.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPI Cards - Secondary (smaller) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💰 Revenue
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>৳3,12,000</div>
          <div style={{ fontSize: 11, color: Theme.success, fontWeight: 600, marginTop: 4 }}>▲ 33.3% vs last month</div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📦 Orders
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>243</div>
          <div style={{ fontSize: 11, color: Theme.success, fontWeight: 600, marginTop: 4 }}>▲ 36.5% growth</div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🧴 Products
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>186</div>
          <div style={{ fontSize: 11, color: Theme.warning, fontWeight: 600, marginTop: 4 }}>
            {products.filter((p) => p.status !== 'active').length} need attention
          </div>
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            👥 Customers
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>1,847</div>
          <div style={{ fontSize: 11, color: Theme.success, fontWeight: 600, marginTop: 4 }}>▲ 8.2% increase</div>
        </Card>
      </div>

      {/* Recent orders + stock alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <Card>
          <SecHead title="Recent Orders" action="View All" />
          {orders.slice(0, 4).map((o) => {
            const s = statusStyles[o.status];
            return (
              <div
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  marginBottom: 12,
                  borderBottom: `1px solid ${Theme.border}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: Theme.primary }}>{o.id}</div>
                  <div style={{ fontSize: 11, color: Theme.mutedFg }}>
                    {o.customer} · {o.time}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(o.amount)}</div>
                  <Badge label={o.status} bg={s.bg} color={s.color} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card>
          <SecHead
            title="Stock Alerts"
            sub={`${products.filter((p) => p.status !== 'active').length} items need attention`}
          />
          {products
            .filter((p) => p.status !== 'active')
            .slice(0, 4)
            .map((p) => {
              const pct = Math.min((p.stock / 20) * 100, 100);
              return (
                <div key={p.sku} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: Theme.mutedFg }}>{p.sku}</div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: p.stock === 0 ? Theme.danger : Theme.warning,
                      }}
                    >
                      {p.stock}
                    </div>
                  </div>
                  <div style={{ height: 5, background: Theme.muted, borderRadius: 99 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pct < 30 ? Theme.danger : Theme.warning,
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </Card>
      </div>
    </div>
  );
}
