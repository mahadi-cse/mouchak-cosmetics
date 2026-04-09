'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, SecHead } from '../Primitives';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header + filters */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: Theme.fg }}>
            Analytics
          </div>
          <div style={{ fontSize: 13, color: Theme.mutedFg, marginTop: 2 }}>
            Revenue, orders & trends
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${Theme.border}`,
              borderRadius: 9,
              fontSize: 13,
              color: Theme.fg,
              background: '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {['All Branches', 'Dhaka Main', 'Chittagong', 'Sylhet Outlet'].map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
          <div
            style={{
              display: 'flex',
              gap: 3,
              background: Theme.muted,
              borderRadius: 8,
              padding: 3,
            }}
          >
            {['weekly', 'monthly', 'yearly'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  background: period === p ? '#fff' : 'transparent',
                  color: period === p ? Theme.primary : Theme.mutedFg,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  boxShadow: period === p ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PRIMARY CHARTS - LARGE GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        {/* Daily Sales - Full width on mobile, half on desktop */}
        <Card style={{ gridColumn: isMobile ? '1' : 'span 1' }}>
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
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: Theme.mutedFg }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#bfdbfe' }} /> Online
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: Theme.mutedFg }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: Theme.primary }} /> Manual
            </div>
          </div>
        </Card>

        {/* Orders vs Revenue - Dual axis */}
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
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: Theme.mutedFg }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: Theme.primary }} /> Revenue (৳)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: Theme.mutedFg }}>
              <div style={{ width: 12, height: 2, background: Theme.warning }} /> Orders (#)
            </div>
          </div>
        </Card>
      </div>

      {/* KPI Cards - Secondary Reference (smaller) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💰 Revenue (MTD)
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>৳3,12,000</div>
          <div style={{ fontSize: 10, color: Theme.success, fontWeight: 600, marginTop: 3 }}>▲ 33.3%</div>
        </Card>

        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📈 Conversion
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>3.8%</div>
          <div style={{ fontSize: 10, color: Theme.success, fontWeight: 600, marginTop: 3 }}>▲ 0.4%</div>
        </Card>

        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🛒 Basket Size
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>৳1,284</div>
          <div style={{ fontSize: 10, color: Theme.success, fontWeight: 600, marginTop: 3 }}>▲ 4.1%</div>
        </Card>

        <Card style={{ padding: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: Theme.mutedFg, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ↩ Return Rate
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: Theme.fg, marginTop: 6 }}>2.1%</div>
          <div style={{ fontSize: 10, color: Theme.mutedFg, fontWeight: 600, marginTop: 3 }}>Avg 4.5%</div>
        </Card>
      </div>

      {/* Top Products - Bottom section */}
      <Card>
        <SecHead title="Top Products by Revenue" sub="March 2026" action="Export CSV" />
        {INITIAL_PRODUCTS.slice(0, 6).map((p, i) => {
          const rev = p.price * (p.sold + p.manualSold);
          const maxRev = INITIAL_PRODUCTS[0].price * (INITIAL_PRODUCTS[0].sold + INITIAL_PRODUCTS[0].manualSold);
          const pct = (rev / maxRev) * 100;
          return (
            <div key={p.sku} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: i === 0 ? Theme.primary : Theme.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: i === 0 ? '#fff' : Theme.mutedFg,
                }}
              >
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '60%',
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: Theme.primary,
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(rev)}
                  </span>
                </div>
                <div style={{ height: 6, background: Theme.muted, borderRadius: 99 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: `linear-gradient(90deg,${Theme.primaryDark},${Theme.primary})`,
                      borderRadius: 99,
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
