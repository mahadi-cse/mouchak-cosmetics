'use client';

import React from 'react';
import { Theme, formatCurrency, statusStyles } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead, Btn, Badge } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';
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
    <div className={`flex flex-col gap-${isMobile ? 3 : 4}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black text-foreground tracking-tight`}>
            Overview
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            Today's snapshot across all channels
          </div>
        </div>

        {/* Quick action button */}
        <Btn variant="secondary" size="md" onClick={onQuickSale} className="flex-shrink-0">
          🏪 + New Sale
        </Btn>
      </div>

      {/* FEATURED CHARTS FIRST - LARGE & PROMINENT */}
      <div className={`grid grid-cols-1 ${!isMobile && 'md:grid-cols-2'} gap-4`}>
        <div className="flex flex-col gap-3">
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
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Best Month
                </div>
                <div className="text-sm font-bold text-foreground mt-1">{bestMonth.month}</div>
                <div className="text-xs text-green-600 mt-0.5">{formatCurrency(bestMonth.revenue)}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Weakest Month
                </div>
                <div className="text-sm font-bold text-foreground mt-1">{weakestMonth.month}</div>
                <div className="text-xs text-yellow-600 mt-0.5">{formatCurrency(weakestMonth.revenue)}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  MoM (Latest)
                </div>
                <div className="text-sm font-bold text-foreground mt-1">
                  {momGrowth >= 0 ? '▲' : '▼'} {Math.abs(momGrowth).toFixed(1)}%
                </div>
                <div className={`text-xs mt-0.5 ${momGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {previous.month} → {latest.month}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Avg / Order
                </div>
                <div className="text-sm font-bold text-foreground mt-1">{formatCurrency(avgOrderValue)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{latest.orders} orders in {latest.month}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Mix - Pie chart */}
        <Card>
          <SecHead title="Category Mix" sub="Product distribution" />
          <div className="relative h-80 mb-2">
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
            <div className={`absolute top-4 ${isMobile ? 'left-2' : 'left-4'} px-2.5 py-2 rounded-lg border border-border bg-card shadow-sm text-xs font-semibold text-foreground flex items-center gap-1.5`}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: topCategoryBadges[0]?.color }} />
              <span>{topCategoryBadges[0]?.name}: {topCategoryBadges[0]?.value}%</span>
            </div>

            <div className={`absolute top-11 ${isMobile ? 'right-2' : 'right-4'} px-2.5 py-2 rounded-lg border border-border bg-card shadow-sm text-xs font-semibold text-foreground flex items-center gap-1.5`}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: topCategoryBadges[1]?.color }} />
              <span>{topCategoryBadges[1]?.name}: {topCategoryBadges[1]?.value}%</span>
            </div>

            <div className={`absolute bottom-${isMobile ? 1 : 2} left-1/2 -translate-x-1/2 px-2.5 py-2 rounded-lg border border-border bg-card shadow-sm text-xs font-semibold text-foreground flex items-center gap-1.5`}>
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: topCategoryBadges[2]?.color }} />
              <span>{topCategoryBadges[2]?.name}: {topCategoryBadges[2]?.value}%</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {categoryData.map((c) => (
              <div
                key={c.name}
                className="p-2 rounded-lg bg-muted flex items-center gap-1.5"
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPI Cards - Secondary (smaller) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            💰 Revenue
          </div>
          <div className="text-lg font-black text-foreground mt-1.5">৳3,12,000</div>
          <div className="text-xs text-green-600 font-semibold mt-1">▲ 33.3% vs last month</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            📦 Orders
          </div>
          <div className="text-lg font-black text-foreground mt-1.5">243</div>
          <div className="text-xs text-green-600 font-semibold mt-1">▲ 36.5% growth</div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            🧴 Products
          </div>
          <div className="text-lg font-black text-foreground mt-1.5">186</div>
          <div className="text-xs text-yellow-600 font-semibold mt-1">
            {products.filter((p) => p.status !== 'active').length} need attention
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            👥 Customers
          </div>
          <div className="text-lg font-black text-foreground mt-1.5">1,847</div>
          <div className="text-xs text-green-600 font-semibold mt-1">▲ 8.2% increase</div>
        </Card>
      </div>

      {/* Recent orders + stock alerts */}
      <div className={`grid grid-cols-1 ${!isMobile && 'md:grid-cols-2'} gap-4`}>
        <Card>
          <SecHead title="Recent Orders" action="View All" />
          {orders.slice(0, 4).map((o) => {
            const s = statusStyles[o.status];
            return (
              <div
                key={o.id}
                className="flex items-center justify-between pb-3 mb-3 border-b border-border"
              >
                <div>
                  <div className="text-sm font-bold text-primary">{o.id}</div>
                  <div className="text-xs text-muted-foreground">
                    {o.customer} · {o.time}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-sm font-bold">{formatCurrency(o.amount)}</div>
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
                <div key={p.sku} className="mb-3.5">
                  <div className="flex justify-between mb-1.5">
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.sku}</div>
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        p.stock === 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {p.stock}
                    </div>
                  </div>
                  <div className="h-1 bg-muted rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        pct < 30 ? 'bg-red-600' : 'bg-yellow-600'
                      }`}
                      style={{ width: `${pct}%` }}
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
