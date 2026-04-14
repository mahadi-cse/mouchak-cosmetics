'use client';

import React from 'react';
import { formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { useOverviewMetrics } from '@/modules/analytics';
import type { OverviewMetrics } from '@/modules/analytics';
import { Btn } from '../Primitives';
import { Product, Order } from '@/modules/dashboard/data/mockData';

interface OverviewViewProps {
  products: Product[];
  orders: Order[];
  onQuickSale?: () => void;
}

function Sparkline({ data, color = '#e91e8c' }: { data: number[]; color?: string }) {
  const w = 72;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const poly = pts.join(' ');
  const area = `0,${h} ${poly} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={area} fill={color} fillOpacity="0.15" />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ segments, size = 110, thickness = 22 }: { segments: { value: number; color: string }[]; size?: number; thickness?: number }) {
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  let offset = 0;
  const slices = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const gap = circ - dash;
    const slice = { ...seg, dash, gap, offset };
    offset += dash;
    return slice;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={thickness}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

function SectionHeading({ icon, title, sub, badge, badgeColor = 'bg-pink-100 text-pink-600' }: { icon: string; title: string; sub?: string; badge?: string; badgeColor?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black text-foreground">{title}</p>
          {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
        </div>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function OverviewView({ products, orders, onQuickSale }: OverviewViewProps) {
  const { isMobile } = useResponsive();
  const [tab, setTab] = React.useState<'today' | 'week' | 'month'>('today');
  const overviewQuery = useOverviewMetrics({ period: tab });
  const overview = overviewQuery.data as OverviewMetrics | undefined;
  const isOverviewLoading = overviewQuery.isLoading;

  const comparisonLabel = overview?.range.comparisonLabel || (tab === 'today' ? 'yesterday' : tab === 'week' ? 'last week' : 'last month');
  const totalSales = overview?.manualSales.totalSales || 0;
  const transactions = overview?.manualSales.transactions || 0;
  const avgTicket = overview?.manualSales.avgTicket || 0;
  const salesDeltaPercent = overview?.manualSales.salesDeltaPercent || 0;
  const transactionDelta = overview?.manualSales.transactionDelta || 0;
  const avgTicketDelta = overview?.manualSales.avgTicketDelta || 0;

  const revenueTrend = overview?.trend.revenue?.length ? overview.trend.revenue : [0, 0, 0, 0, 0, 0];
  const transactionTrend = overview?.trend.transactions?.length ? overview.trend.transactions : [0, 0, 0, 0, 0, 0];
  const avgTicketTrend = overview?.trend.avgTicket?.length ? overview.trend.avgTicket : [0, 0, 0, 0, 0, 0];

  const categoryPalette = ['#e91e8c', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e'];
  const categoryData = (overview?.salesByCategory || []).map((item, i) => ({
    label: item.categoryName,
    value: Math.round(item.sharePercent),
    color: categoryPalette[i % categoryPalette.length],
    rev: formatCurrency(item.totalRevenue),
  }));

  const donutSegments = categoryData.length > 0
    ? categoryData.map((c) => ({ value: Math.max(1, c.value), color: c.color }))
    : [{ value: 1, color: '#e5e7eb' }];

  const invProductsSnapshot = {
    label: 'Total Products',
    value: `${overview?.inventory.totalProducts ?? products.length}`,
    spark: transactionTrend,
    detail: (overview?.inventory.categoryDistribution || []).map((d, i) => ({
      cat: d.categoryName,
      count: d.count,
      color: categoryPalette[i % categoryPalette.length],
      idx: i,
    })),
  };

  const invAlertsSnapshot = {
    label: 'Stock Alerts',
    low: overview?.inventory.lowStockCount ?? products.filter((p) => p.status === 'low').length,
    out: overview?.inventory.outOfStockCount ?? products.filter((p) => p.status === 'out').length,
    spark: revenueTrend,
  };

  const topProducts = React.useMemo(() => {
    const rows = overview?.topProducts || [];
    if (rows.length === 0) {
      return products.slice(0, 4).map((p, i) => ({
        name: p.name,
        sold: Math.max(1, p.manualSold || p.sold || 0),
        rev: formatCurrency((p.manualSold || p.sold || 0) * p.price),
        pct: Math.max(12, 92 - i * 20),
      }));
    }

    const maxRevenue = Math.max(...rows.map((row) => row.revenue), 1);
    return rows.slice(0, 4).map((row) => ({
      name: row.productName,
      sold: row.unitsSold,
      rev: formatCurrency(row.revenue),
      pct: Math.max(10, Math.round((row.revenue / maxRevenue) * 100)),
    }));
  }, [overview?.topProducts, products]);

  const stockAlertItems = React.useMemo(() => {
    if (overview?.inventory.alertItems?.length) {
      return overview.inventory.alertItems.map((item) => ({
        name: item.productName,
        sku: item.sku,
        qty: item.quantity,
        threshold: item.threshold,
        status: item.status,
      }));
    }

    return products
      .filter((p) => p.status !== 'active')
      .slice(0, 8)
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        qty: p.stock,
        threshold: 10,
        status: p.status === 'out' ? 'out' : 'low',
      }));
  }, [overview?.inventory.alertItems, products]);

  const manualKpis = [
    {
      label: "Today's Sales",
      value: formatCurrency(totalSales),
      delta: `${salesDeltaPercent >= 0 ? '+' : ''}${salesDeltaPercent.toFixed(1)}% vs ${comparisonLabel}`,
      up: salesDeltaPercent >= 0,
      spark: revenueTrend,
      color: '#e91e8c',
    },
    {
      label: 'Transactions',
      value: `${transactions}`,
      delta: `${transactionDelta >= 0 ? '+' : ''}${transactionDelta} vs ${comparisonLabel}`,
      up: transactionDelta >= 0,
      spark: transactionTrend,
      color: '#8b5cf6',
    },
    {
      label: 'Avg Ticket',
      value: formatCurrency(avgTicket),
      delta: `${avgTicketDelta >= 0 ? '+' : '-'}${formatCurrency(Math.abs(avgTicketDelta))} vs ${comparisonLabel}`,
      up: avgTicketDelta >= 0,
      spark: avgTicketTrend,
      color: '#0ea5e9',
    },
  ];

  return (
    <div className={`flex flex-col gap-${isMobile ? 3 : 4}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-black text-foreground tracking-tight`}>
            Overview
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {isOverviewLoading ? 'Loading latest dashboard data...' : `${tab[0].toUpperCase()}${tab.slice(1)} snapshot across all channels`}
          </div>
        </div>

        {/* Quick action button */}
        <Btn variant="secondary" size="md" onClick={onQuickSale} className="flex-shrink-0">
          🏪 + New Sale
        </Btn>
      </div>

      <div className="bg-card rounded-2xl border border-pink-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionHeading
            icon="🛒"
            title="Manual Sales"
            sub={`In-store transactions ${tab === 'today' ? 'today' : `this ${tab}`}`}
            badge="Primary Channel"
          />
          <div className="flex bg-muted rounded-xl p-0.5 text-[11px] font-semibold">
            {(['today', 'week', 'month'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-lg capitalize transition-colors ${tab === t ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
          {manualKpis.map((k) => (
            <div key={k.label} className="bg-muted rounded-xl p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <Sparkline data={k.spark} color={k.color} />
              </div>
              <p className="text-lg font-black text-foreground">{k.value}</p>
              {k.up !== null ? (
                <p className={`text-[10px] font-semibold ${k.up ? 'text-green-600' : 'text-red-500'}`}>{k.up ? '▲' : '▼'} {k.delta}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">{k.delta}</p>
              )}
            </div>
          ))}

          <div className="bg-indigo-50 rounded-xl p-3 flex flex-col gap-1 border border-indigo-100">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">{invProductsSnapshot.label}</p>
              <Sparkline data={invProductsSnapshot.spark} color="#6366f1" />
            </div>
            <p className="text-lg font-black text-indigo-700">{invProductsSnapshot.value}</p>
            <div className="space-y-1 mt-0.5">
              {invProductsSnapshot.detail.slice(0, 4).map((d) => (
                <div key={`${d.cat}-${d.idx}`} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-[9px] text-muted-foreground flex-1">{d.cat}</span>
                  <span className="text-[9px] font-bold text-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-3 flex flex-col gap-1 border border-red-100">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{invAlertsSnapshot.label}</p>
              <Sparkline data={invAlertsSnapshot.spark} color="#ef4444" />
            </div>
            <div className="flex items-end gap-2 mt-0.5">
              <div>
                <p className="text-[9px] text-red-400 font-semibold">Low Stock</p>
                <p className="text-xl font-black text-red-600">{invAlertsSnapshot.low}</p>
              </div>
              <div className="mb-0.5 text-gray-300 text-lg font-thin">/</div>
              <div>
                <p className="text-[9px] text-green-500 font-semibold">Out of Stock</p>
                <p className="text-xl font-black text-green-600">{invAlertsSnapshot.out}</p>
              </div>
            </div>
            <p className="text-[9px] text-red-400 font-semibold mt-auto">⚠ {invAlertsSnapshot.low} items need reorder</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs font-bold text-muted-foreground mb-3">🍩 Sales by Category</p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <DonutChart segments={donutSegments} size={110} thickness={22} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-muted-foreground font-semibold leading-none">Total</p>
                  <p className="text-sm font-black text-foreground leading-tight">{formatCurrency(totalSales)}</p>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {categoryData.length === 0 ? (
                  <div className="text-[11px] text-muted-foreground">No category sales in this period</div>
                ) : categoryData.map((c) => (
                  <div key={c.label} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-[11px] font-semibold text-foreground truncate">{c.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-black text-foreground">{c.value}%</span>
                      <span className="text-[10px] text-muted-foreground ml-1">{c.rev}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs font-bold text-muted-foreground mb-3">🔥 Top Products — Manual</p>
            <div className="space-y-2.5">
              {topProducts.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] font-black text-primary shrink-0 ml-2">{p.rev}</p>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 w-10 text-right">{p.sold} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {stockAlertItems.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-sm font-black text-foreground mb-3">⚠ Stock Alerts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stockAlertItems.slice(0, 4).map((p) => {
              const pct = Math.min((p.qty / Math.max(1, p.threshold)) * 100, 100);
              return (
                <div key={p.sku} className="mb-3 rounded-xl p-3 bg-muted">
                  <div className="flex justify-between mb-1">
                    <div>
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.sku}</div>
                    </div>
                    <div
                      className={`text-sm font-black ${
                        p.qty === 0 ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {p.qty}
                    </div>
                  </div>
                  <div className="h-1 bg-background rounded-full">
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
          </div>
        </div>
      )}
    </div>
  );
}
