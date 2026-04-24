'use client';

import React, { useMemo, useState } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead } from '../Primitives';
import { useOverviewMetrics } from '@/modules/analytics';
import { useListBranches } from '@/modules/branches';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsView() {
  const { isMobile } = useResponsive();
  const { data: branches = [] } = useListBranches();
  const activeBranches = branches.filter((b: any) => b.active);
  const [branch, setBranch] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const isCustom = period === 'custom';
  const overviewPeriod = period === 'daily' ? 'today' : period === 'weekly' ? 'week' : 'month';

  const queryParams = useMemo(() => {
    const base: any = {};
    if (branch) base.warehouseId = Number(branch);
    if (isCustom && customStart && customEnd) {
      base.startDate = customStart;
      base.endDate = customEnd;
    } else {
      base.period = overviewPeriod;
    }
    return base;
  }, [branch, isCustom, customStart, customEnd, overviewPeriod]);

  const { data: overview, isLoading } = useOverviewMetrics(queryParams, {
    enabled: isCustom ? !!(customStart && customEnd) : true,
  });

  const formatTrendLabel = (isoDate: string, idx: number) => {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return `P${idx + 1}`;

    if (period === 'daily') {
      return d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (period === 'weekly') {
      return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short' });
    }
    if (period === 'monthly') {
      const bucketSize = overview?.trend.labels?.length || 6;
      const totalDays = 30;
      const daysPerBucket = Math.ceil(totalDays / bucketSize);
      const endDay = new Date(d);
      endDay.setDate(endDay.getDate() + daysPerBucket - 1);
      return `${d.getDate()}-${endDay.getDate()} ${d.toLocaleDateString('en-BD', { month: 'short' })}`;
    }
    // custom: show date
    return d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short' });
  };

  const trendData = useMemo(() => {
    const labels = overview?.trend.labels || [];
    const size = Math.max(labels.length, overview?.trend.revenue?.length || 0, 6);
    return Array.from({ length: size }, (_, idx) => ({
      label: labels[idx] ? formatTrendLabel(labels[idx], idx) : `P${idx + 1}`,
      revenue: overview?.trend.revenue?.[idx] || 0,
      cost: overview?.trend.cost?.[idx] || 0,
      netProfit: (overview?.trend.revenue?.[idx] || 0) - (overview?.trend.cost?.[idx] || 0),
    }));
  }, [overview?.trend, period]);

  const trendTotals = useMemo(() => {
    return trendData.reduce(
      (acc, point) => ({
        revenue: acc.revenue + point.revenue,
        cost: acc.cost + point.cost,
        netProfit: acc.netProfit + point.netProfit,
      }),
      { revenue: 0, cost: 0, netProfit: 0 }
    );
  }, [trendData]);

  const topProducts = overview?.topProducts || [];

  const trendSubText = period === 'daily'
    ? 'Today performance'
    : period === 'weekly'
      ? 'Latest week performance'
      : period === 'custom'
        ? `${customStart} to ${customEnd}`
        : 'Latest month performance';

  const comparisonLabel = overview?.range?.comparisonLabel || 'previous period';
  const totalSales = overview?.manualSales?.totalSales || 0;
  const transactions = overview?.manualSales?.transactions || 0;
  const avgTicket = overview?.manualSales?.avgTicket || 0;
  const salesDeltaPercent = overview?.manualSales?.salesDeltaPercent || 0;
  const transactionDelta = overview?.manualSales?.transactionDelta || 0;
  const avgTicketDelta = overview?.manualSales?.avgTicketDelta || 0;
  const revenueTrend = overview?.trend?.revenue?.length ? overview.trend.revenue : [0, 0, 0, 0, 0, 0];
  const transactionTrend = overview?.trend?.transactions?.length ? overview.trend.transactions : [0, 0, 0, 0, 0, 0];
  const avgTicketTrend = overview?.trend?.avgTicket?.length ? overview.trend.avgTicket : [0, 0, 0, 0, 0, 0];

  const categoryPalette = ['#e91e8c', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e'];
  const categoryData = useMemo(() =>
    (overview?.salesByCategory || []).map((item: any, i: number) => ({
      label: item.categoryName,
      value: Math.max(1, Math.round(item.sharePercent)),
      color: categoryPalette[i % categoryPalette.length],
      rev: formatCurrency(item.totalRevenue),
    })),
    [overview?.salesByCategory]
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <div
        className={`flex justify-between gap-3 ${isMobile ? 'flex-col items-start' : 'flex-row items-center'}`}
      >
        <div>
          <div
            className={`font-extrabold ${isMobile ? 'text-[18px]' : 'text-[22px]'}`}
            style={{ color: Theme.fg }}
          >
            Analytics
          </div>
          <div className="mt-0.5 text-[13px]" style={{ color: Theme.mutedFg }}>
            Revenue, cost & trends
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="cursor-pointer rounded-[9px] bg-white px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
          >
            <option value="">All Branches</option>
            {activeBranches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div className="flex gap-1 rounded-lg p-1" style={{ background: Theme.muted }}>
            {['daily', 'weekly', 'monthly', 'custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="cursor-pointer rounded-md border-none px-2.5 py-1.5 text-xs font-semibold uppercase"
                style={{
                  background: period === p ? '#fff' : 'transparent',
                  color: period === p ? Theme.primary : Theme.mutedFg,
                  boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg }}
              />
              <span className="text-xs" style={{ color: Theme.mutedFg }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border px-2 py-1.5 text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg }}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* KPI Cards + Category Donut */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
        {[
          { label: 'Revenue', value: formatCurrency(totalSales), delta: `${salesDeltaPercent >= 0 ? '+' : ''}${salesDeltaPercent.toFixed(1)}%`, up: salesDeltaPercent >= 0, spark: revenueTrend, color: '#e91e8c', icon: '💰' },
          { label: 'Transactions', value: `${transactions}`, delta: `${transactionDelta >= 0 ? '+' : ''}${transactionDelta}`, up: transactionDelta >= 0, spark: transactionTrend, color: '#8b5cf6', icon: '🧾' },
          { label: 'Avg Ticket', value: formatCurrency(avgTicket), delta: `${avgTicketDelta >= 0 ? '+' : ''}${formatCurrency(Math.abs(avgTicketDelta))}`, up: avgTicketDelta >= 0, spark: avgTicketTrend, color: '#0ea5e9', icon: '🎫' },
          { label: 'Products', value: `${overview?.inventory?.totalProducts ?? 0}`, delta: `${overview?.inventory?.lowStockCount ?? 0} low stock`, up: null as boolean | null, spark: transactionTrend, color: '#6366f1', icon: '📦' },
          { label: 'Stock Alerts', value: `${(overview?.inventory?.lowStockCount ?? 0) + (overview?.inventory?.outOfStockCount ?? 0)}`, delta: `${overview?.inventory?.outOfStockCount ?? 0} out of stock`, up: null as boolean | null, spark: revenueTrend, color: '#ef4444', icon: '⚠️' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border p-3" style={{ borderColor: Theme.border, background: '#fff' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: Theme.mutedFg }}>{k.icon} {k.label}</span>
              <svg width={48} height={18} viewBox="0 0 48 18">
                {(() => {
                  const d = k.spark;
                  const max = Math.max(...d);
                  const min = Math.min(...d);
                  const pts = d.map((v, i) => `${(i / (d.length - 1)) * 48},${18 - ((v - min) / (max - min || 1)) * 14 - 2}`).join(' ');
                  return <polyline points={pts} fill="none" stroke={k.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
                })()}
              </svg>
            </div>
            <div className="text-lg font-black" style={{ color: Theme.fg }}>{k.value}</div>
            {k.up !== null ? (
              <div className="text-[10px] font-semibold" style={{ color: k.up ? '#16a34a' : '#dc2626' }}>
                {k.up ? '▲' : '▼'} {k.delta} vs {comparisonLabel}
              </div>
            ) : (
              <div className="text-[10px] font-semibold" style={{ color: Theme.mutedFg }}>{k.delta}</div>
            )}
          </div>
        ))}
      </div>

      {/* Category Donut + Quick Stats */}
      {categoryData.length > 0 && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <Card className="p-4">
            <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: Theme.mutedFg }}>🍩 Sales by Category</div>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  {(() => {
                    const r = 36;
                    const circ = 2 * Math.PI * r;
                    const total = categoryData.reduce((s: number, c: any) => s + c.value, 0) || 1;
                    let offset = 0;
                    return categoryData.map((c: any, i: number) => {
                      const dash = (c.value / total) * circ;
                      const gap = circ - dash;
                      const el = <circle key={i} cx={50} cy={50} r={r} fill="none" stroke={c.color} strokeWidth={18} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} />;
                      offset += dash;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px]" style={{ color: Theme.mutedFg }}>Total</span>
                  <span className="text-xs font-black" style={{ color: Theme.fg }}>{formatCurrency(totalSales)}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                {categoryData.map((c: any) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-[11px] font-semibold" style={{ color: Theme.fg }}>{c.label}</span>
                    </div>
                    <span className="text-[11px] font-bold" style={{ color: Theme.fg }}>{c.value}% <span style={{ color: Theme.mutedFg }}>{c.rev}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-4 col-span-2">
            <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: Theme.mutedFg }}>📊 Period Summary</div>
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div className="rounded-lg p-3" style={{ background: Theme.muted }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>Total Revenue</div>
                <div className="text-xl font-black mt-1" style={{ color: Theme.primary }}>{formatCurrency(totalSales)}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: Theme.muted }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>Total Cost</div>
                <div className="text-xl font-black mt-1" style={{ color: Theme.warning }}>{formatCurrency(trendTotals.cost)}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: Theme.muted }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>Net Profit</div>
                <div className="text-xl font-black mt-1" style={{ color: trendTotals.netProfit >= 0 ? Theme.success : '#dc2626' }}>{formatCurrency(trendTotals.netProfit)}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: Theme.muted }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>Qty Sold</div>
                <div className="text-xl font-black mt-1" style={{ color: Theme.fg }}>{overview?.manualSales?.totalQty ?? 0}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: Theme.muted }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>Low Stock</div>
                <div className="text-xl font-black mt-1" style={{ color: '#f59e0b' }}>{overview?.inventory?.lowStockCount ?? 0}</div>
              </div>
              <div className="rounded-lg p-3" style={{ background: Theme.muted }}>
                <div className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>Out of Stock</div>
                <div className="text-xl font-black mt-1" style={{ color: '#ef4444' }}>{overview?.inventory?.outOfStockCount ?? 0}</div>
              </div>
            </div>
          </Card>
        </div>
      )}
      

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Card>
          <SecHead title="Cost vs Revenue Trend" sub={trendSubText} />
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={Theme.border} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: Theme.mutedFg }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="l"
                tick={{ fontSize: 10, fill: Theme.mutedFg }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip />
              <Line
                yAxisId="l"
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke={Theme.primary}
                strokeWidth={2.5}
                dot={{ fill: Theme.primary, r: 3 }}
              />
              <Line
                yAxisId="l"
                type="monotone"
                dataKey="cost"
                name="cost"
                stroke={Theme.warning}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: Theme.warning, r: 3 }}
              />
              <Line
                yAxisId="l"
                type="monotone"
                dataKey="netProfit"
                name="net profit"
                stroke={Theme.success}
                strokeWidth={2.25}
                strokeDasharray="2 2"
                dot={{ fill: Theme.success, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
              <div className="h-3 w-3 rounded-sm" style={{ background: Theme.primary }} />
              Revenue (৳)
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
              <div className="h-1 w-3" style={{ background: Theme.warning }} />
              Cost (৳)
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
              <div className="h-1 w-3" style={{ background: Theme.success }} />
              Net Profit (৳)
            </div>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
            <div className="rounded-md px-2 py-1.5" style={{ background: Theme.muted }}>
              <span style={{ color: Theme.mutedFg }}>Revenue:</span>{' '}
              <span className="font-bold" style={{ color: Theme.primary }}>{formatCurrency(trendTotals.revenue)}</span>
            </div>
            <div className="rounded-md px-2 py-1.5" style={{ background: Theme.muted }}>
              <span style={{ color: Theme.mutedFg }}>Cost:</span>{' '}
              <span className="font-bold" style={{ color: Theme.warning }}>{formatCurrency(trendTotals.cost)}</span>
            </div>
            <div className="rounded-md px-2 py-1.5" style={{ background: Theme.muted }}>
              <span style={{ color: Theme.mutedFg }}>Net Profit:</span>{' '}
              <span
                className="font-bold"
                style={{ color: trendTotals.netProfit >= 0 ? Theme.success : '#dc2626' }}
              >
                {formatCurrency(trendTotals.netProfit)}
              </span>
            </div>
          </div>
          {isLoading && (
            <div className="mt-2 text-center text-xs" style={{ color: Theme.mutedFg }}>
              Loading trend...
            </div>
          )}
        </Card>

        <Card>
          <SecHead title="Top Products by Revenue" sub="From current analytics range" action="Export CSV" />
          {isLoading ? (
            <div className="py-6 text-center text-sm" style={{ color: Theme.mutedFg }}>Loading top products...</div>
          ) : topProducts.length === 0 ? (
            <div className="py-6 text-center text-sm" style={{ color: Theme.mutedFg }}>No sales data found for this range.</div>
          ) : (
            topProducts.slice(0, 6).map((p: any, i: number) => {
              const maxRev = topProducts[0]?.revenue || 1;
              const pct = (p.revenue / maxRev) * 100;

              return (
                <div key={p.sku || p.productId} className="mb-3.5 flex items-center gap-3">
                  <div
                    className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: i === 0 ? Theme.primary : Theme.muted,
                      color: i === 0 ? '#fff' : Theme.mutedFg,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between">
                      <span
                        className="max-w-[60%] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold"
                        style={{ color: Theme.fg }}
                      >
                        {p.productName}
                      </span>
                      <span className="shrink-0 text-xs font-bold" style={{ color: Theme.primary }}>
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: Theme.muted }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg,${Theme.primaryDark},${Theme.primary})`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[10px]" style={{ color: Theme.mutedFg }}>
                      {p.unitsSold} sold · SKU {p.sku}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      {/* <Card>
        <SecHead title="Daily Sales by Channel" sub="Online vs Manual · This week" />
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
          <BarChart data={dailySales} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke={Theme.border} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: Theme.mutedFg }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: Theme.mutedFg }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip />
            <Bar dataKey="online" name="online" stackId="a" fill="#bfdbfe" />
            <Bar dataKey="manual" name="manual" stackId="a" fill={Theme.primary} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 flex flex-wrap justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
            <div className="h-3 w-3 rounded-sm" style={{ background: '#bfdbfe' }} />
            Online
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
            <div className="h-3 w-3 rounded-sm" style={{ background: Theme.primary }} />
            Manual
          </div>
        </div>
      </Card> */}
    </div>
  );
}
