'use client';

import React from 'react';
import { formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { useOverviewMetrics } from '@/modules/analytics';
import type { OverviewMetrics } from '@/modules/analytics';
import { useListBranches } from '@/modules/branches';
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

function DonutChart({ segments, size = 160, thickness = 28, onHover }: { segments: { value: number; color: string; label?: string }[]; size?: number; thickness?: number; onHover?: (index: number | null) => void }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size - 12) / 2; // leave room for slice-out
  const innerR = outerR - thickness;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  const [hovered, setHovered] = React.useState<number | null>(null);
  const sliceOut = 8; // how far the hovered slice pops out

  // Build arc paths
  let cumAngle = -Math.PI / 2; // start at top
  const arcs = segments.map((seg, i) => {
    const rawAngle = (seg.value / total) * Math.PI * 2;
    // Clamp to just under 2π so a single-segment arc still renders
    const angle = rawAngle >= Math.PI * 2 ? Math.PI * 2 - 0.001 : rawAngle;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    const midAngle = startAngle + angle / 2;
    cumAngle = endAngle;

    const largeArc = angle > Math.PI ? 1 : 0;

    const ox1 = cx + outerR * Math.cos(startAngle);
    const oy1 = cy + outerR * Math.sin(startAngle);
    const ox2 = cx + outerR * Math.cos(endAngle);
    const oy2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);

    const d = [
      `M ${ox1} ${oy1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    // translate direction for slice-out
    const tx = Math.cos(midAngle) * sliceOut;
    const ty = Math.sin(midAngle) * sliceOut;

    return { d, color: seg.color, idx: i, tx, ty };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((arc) => {
        const isHovered = hovered === arc.idx;
        const isDimmed = hovered !== null && !isHovered;
        return (
          <path
            key={arc.idx}
            d={arc.d}
            fill={arc.color}
            style={{
              transform: isHovered ? `translate(${arc.tx}px, ${arc.ty}px)` : 'translate(0,0)',
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease, filter 0.2s ease',
              opacity: isDimmed ? 0.4 : 1,
              filter: isHovered ? `drop-shadow(0 4px 12px ${arc.color}66)` : 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={() => { setHovered(arc.idx); onHover?.(arc.idx); }}
            onMouseLeave={() => { setHovered(null); onHover?.(null); }}
          />
        );
      })}
      {/* Center hole - intentionally blank */}
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
          {badge && <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
        </div>
        {sub && <p className="text-[12px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

export default function OverviewView({ products, orders, onQuickSale }: OverviewViewProps) {
  const { isMobile } = useResponsive();
  const { data: branches = [] } = useListBranches();
  const activeBranches = branches.filter((b: any) => b.active);
  const [tab, setTab] = React.useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [branch, setBranch] = React.useState('');
  const [customStart, setCustomStart] = React.useState('');
  const [customEnd, setCustomEnd] = React.useState('');
  const [hoveredCategory, setHoveredCategory] = React.useState<number | null>(null);

  const isCustom = tab === 'custom';
  const queryParams = React.useMemo(() => {
    const base: any = {};
    if (branch) base.warehouseId = Number(branch);
    if (isCustom && customStart && customEnd) {
      base.startDate = customStart;
      base.endDate = customEnd;
    } else if (!isCustom) {
      base.period = tab;
    }
    return base;
  }, [branch, tab, isCustom, customStart, customEnd]);

  const overviewQuery = useOverviewMetrics(queryParams, {
    enabled: isCustom ? !!(customStart && customEnd) : true,
  });
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
    ? categoryData.map((c) => ({ value: Math.max(1, c.value), color: c.color, label: c.label }))
    : [{ value: 1, color: '#e5e7eb', label: 'No data' }];

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
      label: tab === 'today' ? "Today's Sales" : tab === 'week' ? 'This Week' : tab === 'month' ? 'This Month' : 'Period Sales',
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
      <div className="bg-card rounded-2xl border border-pink-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <SectionHeading
            icon="🛒"
            title="Manual Sales"
            sub={isCustom ? `${customStart || '…'} → ${customEnd || '…'}` : `In-store transactions ${tab === 'today' ? 'today' : `this ${tab}`}`}
            badge="Primary Channel"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold outline-none border"
              style={{ borderColor: '#e5e7eb', color: '#374151' }}
            >
              <option value="">All Branches</option>
              {activeBranches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <div className="flex bg-muted rounded-xl p-0.5 text-xs font-semibold">
              {(['today', 'week', 'month', 'custom'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded-lg capitalize transition-colors ${tab === t ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isCustom && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
              style={{ borderColor: '#e5e7eb', color: '#374151' }}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
              style={{ borderColor: '#e5e7eb', color: '#374151' }}
            />
            {customStart && customEnd && (
              <span className="text-[10px] font-semibold text-primary">
                {Math.max(1, Math.ceil((new Date(customEnd).getTime() - new Date(customStart).getTime()) / 86400000))} days
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-5 gap-3 2xl:gap-4 mb-4">
          {manualKpis.map((k) => (
            <div
              key={k.label}
              className="bg-muted rounded-xl p-3 flex flex-col gap-1 cursor-default"
              style={{ transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.25s ease', border: '1.5px solid transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 8px 24px ${k.color}22`; e.currentTarget.style.borderColor = `${k.color}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wide">{k.label}</p>
                <Sparkline data={k.spark} color={k.color} />
              </div>
              <p className="text-lg font-black text-foreground">{k.value}</p>
              {k.up !== null ? (
                <p className={`text-[12px] font-semibold ${k.up ? 'text-green-600' : 'text-red-500'}`}>{k.up ? '▲' : '▼'} {k.delta}</p>
              ) : (
                <p className="text-[12px] text-muted-foreground">{k.delta}</p>
              )}
            </div>
          ))}

          <div
            className="bg-indigo-50 rounded-xl p-3 flex flex-col gap-1 border border-indigo-100 cursor-default"
            style={{ transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.25s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)'; e.currentTarget.style.borderColor = '#818cf8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#c7d2fe'; }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-wide">{invProductsSnapshot.label}</p>
              <Sparkline data={invProductsSnapshot.spark} color="#6366f1" />
            </div>
            <p className="text-lg font-black text-indigo-700">{invProductsSnapshot.value}</p>
            <div className="space-y-1 mt-0.5">
              {invProductsSnapshot.detail.slice(0, 3).map((d) => (
                <div key={`${d.cat}-${d.idx}`} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-[10px] text-muted-foreground flex-1">{d.cat}</span>
                  <span className="text-[10px] font-bold text-foreground">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="bg-red-50 rounded-xl p-3 flex flex-col gap-1 border border-red-100 cursor-default"
            style={{ transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.25s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#fecaca'; }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-red-400 uppercase tracking-wide">{invAlertsSnapshot.label}</p>
              <Sparkline data={invAlertsSnapshot.spark} color="#ef4444" />
            </div>
            <div className="flex items-end gap-2 mt-0.5">
              <div>
                <p className="text-[10px] text-red-400 font-semibold">Low Stock</p>
                <p className="text-xl font-black text-red-600">{invAlertsSnapshot.low}</p>
              </div>
              <div className="mb-0.5 text-gray-300 text-lg font-thin">/</div>
              <div>
                <p className="text-[10px] text-green-500 font-semibold">Out of Stock</p>
                <p className="text-xl font-black text-green-600">{invAlertsSnapshot.out}</p>
              </div>
            </div>
            <p className="text-[10px] text-red-400 font-semibold mt-auto">⚠ {invAlertsSnapshot.low} items need reorder</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 2xl:gap-5">
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs font-bold text-muted-foreground mb-3">🍩 Sales by Category</p>
            <div className={`flex ${isMobile ? 'flex-col' : ''} items-center gap-5`}>
              <div className="shrink-0">
                <DonutChart segments={donutSegments} size={160} thickness={30} onHover={setHoveredCategory} />
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {categoryData.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No category sales in this period</div>
                ) : categoryData.map((c, i) => {
                  const isActive = hoveredCategory === i;
                  const isDimmed = hoveredCategory !== null && !isActive;
                  return (
                    <div
                      key={c.label}
                      className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-all cursor-pointer"
                      style={{
                        background: isActive ? `${c.color}18` : 'transparent',
                        border: isActive ? `1.5px solid ${c.color}40` : '1.5px solid transparent',
                        opacity: isDimmed ? 0.4 : 1,
                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                      }}
                      onMouseEnter={() => setHoveredCategory(i)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color, boxShadow: isActive ? `0 0 8px ${c.color}88` : 'none' }} />
                        <div className="min-w-0">
                          <span className={`text-xs font-bold text-foreground truncate block ${isActive ? 'text-sm' : ''}`} style={isActive ? { color: c.color } : {}}>{c.label}</span>
                          {isActive && <span className="text-[10px] text-muted-foreground">{c.value}% of total</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-black ${isActive ? 'text-sm' : 'text-xs'}`} style={{ color: isActive ? c.color : '#1f2937' }}>{c.rev}</span>
                        {!isActive && <span className="text-[10px] text-muted-foreground ml-1">{c.value}%</span>}
                      </div>
                    </div>
                  );
                })}
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
                      <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs font-black text-primary shrink-0 ml-2">{p.rev}</p>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[12px] text-muted-foreground shrink-0 w-10 text-right">{p.sold} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {stockAlertItems.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <p className="text-sm font-black text-foreground mb-3">⚠ Stock Alerts</p>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-3">
            {stockAlertItems.slice(0, 4).map((p) => {
              const pct = Math.min((p.qty / Math.max(1, p.threshold)) * 100, 100);
              return (
                <div key={p.sku} className="mb-3 rounded-xl p-3 bg-muted">
                  <div className="flex justify-between mb-1">
                    <div>
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[12px] text-muted-foreground">{p.sku}</div>
                    </div>
                    <div
                      className={`text-md font-black ${
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
