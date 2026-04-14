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

  const overviewPeriod = period === 'daily' ? 'today' : period === 'weekly' ? 'week' : 'month';
  const { data: overview, isLoading } = useOverviewMetrics({
    period: overviewPeriod,
    ...(branch ? { warehouseId: Number(branch) } : {}),
  });

  const trendLabels = useMemo(() => {
    const size = Math.max(overview?.trend.revenue?.length || 0, overview?.trend.cost?.length || 0, 6);
    const prefix = period === 'daily' ? 'H' : period === 'weekly' ? 'D' : 'W';
    return Array.from({ length: size }, (_, i) => `${prefix}${i + 1}`);
  }, [overview?.trend.revenue?.length, overview?.trend.cost?.length, period]);

  const trendData = useMemo(() => {
    return trendLabels.map((label, idx) => ({
      label,
      revenue: overview?.trend.revenue?.[idx] || 0,
      cost: overview?.trend.cost?.[idx] || 0,
      netProfit: (overview?.trend.revenue?.[idx] || 0) - (overview?.trend.cost?.[idx] || 0),
    }));
  }, [trendLabels, overview?.trend.revenue, overview?.trend.cost]);

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
      : 'Latest month performance';

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
            {['daily', 'weekly', 'monthly'].map((p) => (
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
        </div>
      </div>
      
       {/* <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        <Card className="p-[14px]">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>
            💰 Revenue (MTD)
          </div>
          <div className="mt-1.5 text-lg font-bold" style={{ color: Theme.fg }}>৳3,12,000</div>
          <div className="mt-0.5 text-xs font-semibold" style={{ color: Theme.success }}>▲ 33.3%</div>
        </Card>

        <Card className="p-[14px]">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>
            📈 Conversion
          </div>
          <div className="mt-1.5 text-lg font-bold" style={{ color: Theme.fg }}>3.8%</div>
          <div className="mt-0.5 text-xs font-semibold" style={{ color: Theme.success }}>▲ 0.4%</div>
        </Card>

        <Card className="p-[14px]">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>
            🛒 Basket Size
          </div>
          <div className="mt-1.5 text-lg font-bold" style={{ color: Theme.fg }}>৳1,284</div>
          <div className="mt-0.5 text-xs font-semibold" style={{ color: Theme.success }}>▲ 4.1%</div>
        </Card>

        <Card className="p-[14px]">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>
            ↩ Return Rate
          </div>
          <div className="mt-1.5 text-lg font-bold" style={{ color: Theme.fg }}>2.1%</div>
          <div className="mt-0.5 text-xs font-semibold" style={{ color: Theme.mutedFg }}>Avg 4.5%</div>
        </Card>
      </div> */}
      

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
