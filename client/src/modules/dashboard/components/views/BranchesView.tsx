'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, Btn } from '../Primitives';
import { INITIAL_BRANCHES } from '@/modules/dashboard/data/mockData';

export default function BranchesView() {
  const { isMobile } = useResponsive();
  const [branches, setBranches] = useState(INITIAL_BRANCHES);

  const toggleActive = (id: number) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={`font-extrabold ${isMobile ? 'text-[18px]' : 'text-[22px]'}`}
            style={{ color: Theme.fg }}
          >
            Branch Management
          </div>
          <div className="mt-0.5 text-[13px]" style={{ color: Theme.mutedFg }}>
            {branches.filter((b) => b.active).length} active · {branches.length} total
          </div>
        </div>
        <Btn variant="primary" size="sm">
          ＋ Add Branch
        </Btn>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total Branches" value={branches.length} icon="🏪" accent="#fff0f6" />
        <KpiCard
          label="Active"
          value={branches.filter((b) => b.active).length}
          icon="✅"
          accent="#dcfce7"
        />
        <KpiCard
          label="Combined Orders"
          value={branches.reduce((a, b) => a + b.orders, 0).toLocaleString()}
          icon="📦"
          accent="#dbeafe"
        />
        <KpiCard
          label="Combined Revenue"
          value={formatCurrency(branches.reduce((a, b) => a + b.revenue, 0))}
          icon="💰"
          accent="#fef9c3"
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        {branches.map((b) => {
          const revenueShare = Math.round(
            (b.revenue / branches.reduce((a, x) => a + x.revenue, 1)) * 100
          );

          return (
            <Card key={b.id} className={`relative ${b.active ? 'opacity-100' : 'opacity-70'}`}>
              <div className="mb-3 flex gap-1.5">
                {b.hq && (
                  <span className="rounded-full bg-yellow-100 px-2.5 py-[3px] text-[10px] font-bold text-yellow-800">
                    HQ
                  </span>
                )}
                <span
                  className="rounded-full px-2.5 py-[3px] text-[10px] font-bold"
                  style={{
                    background: b.active ? '#dcfce7' : '#fee2e2',
                    color: b.active ? '#166534' : '#991b1b',
                  }}
                >
                  {b.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-0.5 text-[17px] font-extrabold" style={{ color: Theme.fg }}>
                {b.name}
              </div>
              <div className="mb-3 text-xs" style={{ color: Theme.mutedFg }}>
                📍 {b.city} · 👤 {b.manager}
              </div>

              <div className="mb-3.5 grid grid-cols-3 gap-2">
                {[
                  ['Orders', b.orders, '#dbeafe'],
                  ['Stock', `${b.stock}u`, '#dcfce7'],
                  ['Revenue', formatCurrency(b.revenue), '#fff0f6'],
                ].map(([label, value, bg]) => (
                  <div
                    key={label as string}
                    className="rounded-[10px] border px-2.5 py-2"
                    style={{ background: bg as string, borderColor: Theme.border }}
                  >
                    <div
                      className="text-[10px] font-bold uppercase tracking-[0.05em]"
                      style={{ color: Theme.mutedFg }}
                    >
                      {label}
                    </div>
                    <div className="mt-0.5 text-[13px] font-extrabold" style={{ color: Theme.fg }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3.5">
                <div
                  className="mb-1 flex justify-between text-[11px]"
                  style={{ color: Theme.mutedFg }}
                >
                  <span>Revenue share</span>
                  <span>{revenueShare}%</span>
                </div>
                <div className="h-[5px] rounded-full" style={{ background: Theme.muted }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${revenueShare}%`,
                      background: `linear-gradient(90deg,${Theme.primaryDark},${Theme.primary})`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Btn variant="secondary" size="sm">
                  Edit
                </Btn>
                <button
                  onClick={() => toggleActive(b.id)}
                  className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    b.active
                      ? 'border-red-600 text-red-600 hover:bg-red-50'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {b.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
