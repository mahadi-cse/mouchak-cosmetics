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
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';

export default function AnalyticsView() {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
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
    ? t.analytics.todayPerformance
    : period === 'weekly'
      ? t.analytics.latestWeekPerformance
      : period === 'custom'
        ? `${customStart} to ${customEnd}`
        : t.analytics.latestMonthPerformance;

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
    <div className="flex flex-col gap-3">
      <div className={`flex items-center justify-between gap-3 ${isMobile ? 'flex-wrap' : ''}`}>
        <div className="text-[20px] font-extrabold shrink-0" style={{ color: Theme.fg }}>{t.analytics.analyticsTitle}</div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="cursor-pointer rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold outline-none"
            style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
          >
            <option value="">{t.analytics.allBranches}</option>
            {activeBranches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: Theme.muted }}>
            {['daily', 'weekly', 'monthly', 'custom'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="cursor-pointer rounded-md border-none px-2 py-1 text-[11px] font-semibold uppercase"
                style={{
                  background: period === p ? '#fff' : 'transparent',
                  color: period === p ? Theme.primary : Theme.mutedFg,
                  boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {p === 'daily' ? t.analytics.daily : p === 'weekly' ? t.analytics.weekly : p === 'monthly' ? t.analytics.monthly : t.analytics.custom}
              </button>
            ))}
          </div>
          {isCustom && (
            <>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg border px-2 py-1 text-[11px] outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
              <span className="text-[11px]" style={{ color: Theme.mutedFg }}>→</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg border px-2 py-1 text-[11px] outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
            </>
          )}
        </div>
      </div>


      {/* Period Summary — single line */}
 
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Card>
          <SecHead title={t.analytics.costVsRevenue} sub={trendSubText} />
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
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
              {t.analytics.revenue} (৳)
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
              <div className="h-1 w-3" style={{ background: Theme.warning }} />
              {t.analytics.cost} (৳)
            </div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: Theme.mutedFg }}>
              <div className="h-1 w-3" style={{ background: Theme.success }} />
              {t.analytics.netProfit} (৳)
            </div>
          </div>

          {isLoading && (
            <div className="mt-2 text-center text-xs" style={{ color: Theme.mutedFg }}>
              {t.analytics.loadingTrend}
            </div>
          )}
        </Card>

        <Card>
          <SecHead title={t.analytics.topProductsByRevenue} sub={t.analytics.fromCurrentAnalyticsRange} action={t.analytics.exportCSV} />
          {isLoading ? (
            <div className="py-6 text-center text-sm" style={{ color: Theme.mutedFg }}>{t.analytics.loadingTopProducts}</div>
          ) : topProducts.length === 0 ? (
            <div className="py-6 text-center text-sm" style={{ color: Theme.mutedFg }}>{t.analytics.noSalesData}</div>
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
                      {p.unitsSold} {t.analytics.sold} · {t.modal.sku} {p.sku}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      <Card className="px-3 py-2">
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
          <div className="text-[9px] font-bold uppercase tracking-wide shrink-0" style={{ color: Theme.mutedFg }}>📊</div>
          {[
            { label: t.analytics.revenue, value: formatCurrency(totalSales), color: Theme.primary },
            { label: t.analytics.cost, value: formatCurrency(trendTotals.cost), color: Theme.warning },
            { label: t.analytics.netProfit, value: formatCurrency(trendTotals.netProfit), color: trendTotals.netProfit >= 0 ? Theme.success : '#dc2626' },
            { label: t.analytics.qtySold, value: `${overview?.manualSales?.totalQty ?? 0}`, color: Theme.fg },
            { label: t.analytics.transactions, value: `${transactions}`, color: Theme.fg },
            { label: t.analytics.avgTicket, value: formatCurrency(avgTicket), color: Theme.fg },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 rounded px-2.5 py-1" style={{ background: Theme.muted }}>
              <span className="text-[10px] font-bold uppercase" style={{ color: Theme.mutedFg }}>{s.label}</span>
              <span className="text-sm font-black" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </Card>
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
