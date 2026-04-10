'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead } from '../Primitives';
import { revenueData, dailySales, INITIAL_PRODUCTS } from '@/modules/dashboard/data/mockData';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsView() {
  const { isMobile } = useResponsive();
  const [branch, setBranch] = useState('All Branches');
  const [period, setPeriod] = useState('monthly');

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
            Revenue, orders & trends
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="cursor-pointer rounded-[9px] bg-white px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
          >
            {['All Branches', 'Dhaka Main', 'Chittagong', 'Sylhet Outlet'].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>

          <div className="flex gap-1 rounded-lg p-1" style={{ background: Theme.muted }}>
            {['weekly', 'monthly', 'yearly'].map((p) => (
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

      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Card>
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
        </Card>

        <Card>
          <SecHead title="Orders vs Revenue Trend" sub="6-month performance" />
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={Theme.border} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: Theme.mutedFg }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="l"
                tick={{ fontSize: 10, fill: Theme.mutedFg }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <YAxis
                yAxisId="r"
                orientation="right"
                tick={{ fontSize: 10, fill: Theme.mutedFg }}
                axisLine={false}
                tickLine={false}
                width={30}
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
                yAxisId="r"
                type="monotone"
                dataKey="orders"
                name="orders"
                stroke={Theme.warning}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: Theme.warning, r: 3 }}
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
              Orders (#)
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
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
      </div>

      <Card>
        <SecHead title="Top Products by Revenue" sub="March 2026" action="Export CSV" />
        {INITIAL_PRODUCTS.slice(0, 6).map((p, i) => {
          const rev = p.price * (p.sold + p.manualSold);
          const maxRev = INITIAL_PRODUCTS[0].price * (INITIAL_PRODUCTS[0].sold + INITIAL_PRODUCTS[0].manualSold);
          const pct = (rev / maxRev) * 100;

          return (
            <div key={p.sku} className="mb-3.5 flex items-center gap-3">
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
                    {p.name}
                  </span>
                  <span className="shrink-0 text-xs font-bold" style={{ color: Theme.primary }}>
                    {formatCurrency(rev)}
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
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
