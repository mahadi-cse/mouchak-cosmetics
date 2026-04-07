'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '../../theme';
import { useResponsive } from '../../page';
import { Card, KpiCard, SecHead, Btn, Badge } from '../Primitives';
import { INITIAL_BRANCHES } from '../../data/mockData';

export default function BranchesView() {
  const { isMobile } = useResponsive();
  const [branches, setBranches] = useState(INITIAL_BRANCHES);

  const toggleActive = (id: number) => {
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: Theme.fg }}>
            Branch Management
          </div>
          <div style={{ fontSize: 13, color: Theme.mutedFg, marginTop: 2 }}>
            {branches.filter((b) => b.active).length} active · {branches.length} total
          </div>
        </div>
        <Btn variant="primary" size="sm">
          ＋ Add Branch
        </Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: 16,
        }}
      >
        {branches.map((b) => (
          <Card
            key={b.id}
            style={{
              position: 'relative',
              opacity: b.active ? 1 : 0.7,
            }}
          >
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {b.hq && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: '#fef9c3',
                    color: '#854d0e',
                    padding: '3px 10px',
                    borderRadius: 20,
                  }}
                >
                  HQ
                </span>
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  background: b.active ? '#dcfce7' : '#fee2e2',
                  color: b.active ? '#166534' : '#991b1b',
                  padding: '3px 10px',
                  borderRadius: 20,
                }}
              >
                {b.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: Theme.fg, marginBottom: 2 }}>
              {b.name}
            </div>
            <div style={{ fontSize: 12, color: Theme.mutedFg, marginBottom: 12 }}>
              📍 {b.city} · 👤 {b.manager}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              {[
                ['Orders', b.orders, '#dbeafe'],
                ['Stock', b.stock + 'u', '#dcfce7'],
                ['Revenue', formatCurrency(b.revenue), '#fff0f6'],
              ].map(([l, v, bg]) => (
                <div
                  key={l as string}
                  style={{
                    background: bg as string,
                    borderRadius: 10,
                    padding: '8px 10px',
                    border: `1px solid ${Theme.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: Theme.mutedFg,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {l}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: Theme.fg, marginTop: 2 }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: Theme.mutedFg,
                  marginBottom: 4,
                }}
              >
                <span>Revenue share</span>
                <span>
                  {Math.round(
                    (b.revenue / branches.reduce((a, x) => a + x.revenue, 1)) * 100
                  )}
                  %
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  background: Theme.muted,
                  borderRadius: 99,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 99,
                    background: `linear-gradient(90deg,${Theme.primaryDark},${Theme.primary})`,
                    width: `${Math.round(
                      (b.revenue / branches.reduce((a, x) => a + x.revenue, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn variant="secondary" size="sm">
                Edit
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => toggleActive(b.id)}
                style={{
                  color: b.active ? Theme.danger : Theme.success,
                  borderColor: b.active ? Theme.danger : Theme.success,
                }}
              >
                {b.active ? 'Deactivate' : 'Activate'}
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
