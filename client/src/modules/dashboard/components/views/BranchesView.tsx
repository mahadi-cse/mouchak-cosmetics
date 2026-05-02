'use client';

import React, { useState } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, KpiCard, Btn } from '../Primitives';
import {
  useCreateBranchMutation,
  useListBranches,
  useSetBranchStatusMutation,
  useUpdateBranchMutation,
  type BranchDTO,
} from '@/modules/branches';
import toast from 'react-hot-toast';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';

type BranchFormState = {
  name: string;
  branchCode: string;
  branchType: 'WAREHOUSE' | 'RETAIL' | 'OFFICE' | 'DISTRIBUTION';
  city: string;
  address: string;
  phone: string;
  email: string;
  managerName: string;
  managerPhone: string;
};

const EMPTY_FORM: BranchFormState = {
  name: '',
  branchCode: '',
  branchType: 'WAREHOUSE',
  city: '',
  address: '',
  phone: '',
  email: '',
  managerName: '',
  managerPhone: '',
};

export default function BranchesView() {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
  const { data: dbBranches = [], isLoading } = useListBranches();
  const createBranchMutation = useCreateBranchMutation();
  const updateBranchMutation = useUpdateBranchMutation();
  const statusMutation = useSetBranchStatusMutation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDTO | null>(null);
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);

  const branches = dbBranches.map((b) => ({
    ...b,
    hq: b.branchType === 'OFFICE',
    manager: b.managerName || t.na,
  }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingBranch(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (branch: BranchDTO) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name,
      branchCode: branch.branchCode || '',
      branchType: (branch.branchType as BranchFormState['branchType']) || 'WAREHOUSE',
      city: branch.city || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      managerName: branch.managerName || '',
      managerPhone: branch.managerPhone || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.branchCode.trim()) {
      toast.error(t.branches.branchNameReq);
      return;
    }
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        branchCode: form.branchCode.trim(),
      };
      if (editingBranch) {
        await updateBranchMutation.mutateAsync({ id: editingBranch.id, payload });
        toast.success(t.branches.branchUpdated);
      } else {
        await createBranchMutation.mutateAsync(payload);
        toast.success(t.branches.branchCreated);
      }
      setModalOpen(false);
      resetForm();
    } catch {
      toast.error(t.branches.failedSaveBranch);
    }
  };

  const toggleActive = async (branch: BranchDTO) => {
    try {
      await statusMutation.mutateAsync({ id: branch.id, isActive: !branch.active });
      toast.success(branch.active ? t.branches.branchDeactivated : t.branches.branchActivated);
    } catch {
      toast.error(t.branches.failedBranchStatus);
    }
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div
            className={`font-extrabold ${isMobile ? 'text-[18px]' : 'text-[22px]'}`}
            style={{ color: Theme.fg }}
          >
            {t.branches.branchManagement}
          </div>
          <div className="mt-0.5 text-[13px]" style={{ color: Theme.mutedFg }}>
            {branches.filter((b) => b.active).length} {t.branches.active} · {branches.length} {t.branches.total}
          </div>
        </div>
        <Btn variant="primary" size="sm" onClick={openCreateModal}>
          {t.branches.addBranch}
        </Btn>
      </div>

      <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <KpiCard label={t.branches.totalBranches} value={branches.length} icon="🏪" accent="#fff0f6" />
        <KpiCard
          label={t.branches.activeBranch}
          value={branches.filter((b) => b.active).length}
          icon="✅"
          accent="#dcfce7"
        />
        <KpiCard
          label={t.branches.combinedOrders}
          value={branches.reduce((a, b) => a + b.orders, 0).toLocaleString()}
          icon="📦"
          accent="#dbeafe"
        />
        <KpiCard
          label={t.branches.combinedRevenue}
          value={formatCurrency(branches.reduce((a, b) => a + b.revenue, 0))}
          icon="💰"
          accent="#fef9c3"
        />
      </div>

      {isLoading && (
        <Card>
          <div className="text-sm" style={{ color: Theme.mutedFg }}>{t.branches.loadingBranches}</div>
        </Card>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 2xl:gap-5">
        {branches.map((b) => {
          const revenueShare = Math.round(
            (b.revenue / branches.reduce((a, x) => a + x.revenue, 1)) * 100
          );

          return (
            <Card key={b.id} className={`relative ${b.active ? 'opacity-100' : 'opacity-70'}`}>
              <div className="mb-3 flex gap-1.5">
                {b.hq && (
                  <span className="rounded-full bg-yellow-100 px-2.5 py-[3px] text-[10px] font-bold text-yellow-800">
                    {t.branches.hq}
                  </span>
                )}
                <span
                  className="rounded-full px-2.5 py-[3px] text-[10px] font-bold"
                  style={{
                    background: b.active ? '#dcfce7' : '#fee2e2',
                    color: b.active ? '#166534' : '#991b1b',
                  }}
                >
                  {b.active ? t.branches.activeBranch : t.branches.inactiveBranch}
                </span>
              </div>

              <div className="mb-0.5 text-[17px] font-extrabold" style={{ color: Theme.fg }}>
                {b.name}
              </div>
              <div className="mb-3 text-xs" style={{ color: Theme.mutedFg }}>
                📍 {b.city || t.na} · 👤 {b.manager}
              </div>

              <div className="mb-3.5 grid grid-cols-3 gap-2">
                {[
                  [t.branches.orders, b.orders, '#dbeafe'],
                  [t.branches.stock, `${b.stock}u`, '#dcfce7'],
                  [t.branches.revenue, formatCurrency(b.revenue), '#fff0f6'],
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
                  <span>{t.branches.revenueShare}</span>
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
                <Btn variant="secondary" size="sm" onClick={() => openEditModal(b as BranchDTO)}>
                  {t.inventory.edit}
                </Btn>
                <button
                  onClick={() => toggleActive(b as BranchDTO)}
                  className={`cursor-pointer rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    b.active
                      ? 'border-red-600 text-red-600 hover:bg-red-50'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {b.active ? t.products.deactivate : t.products.activate}
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45" onClick={() => setModalOpen(false)}>
          <div className="w-[92%] max-w-[680px]" onClick={(e) => e.stopPropagation()}>
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-lg font-extrabold" style={{ color: Theme.fg }}>
                  {editingBranch ? t.branches.editBranch : t.branches.newBranch}
                </div>
                <button className="border-0 bg-transparent text-xl" onClick={() => setModalOpen(false)} style={{ color: Theme.mutedFg }}>
                  ✕
                </button>
              </div>

              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder={t.branches.branchNamePlaceholder} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.branchCode} onChange={(e) => setForm((p) => ({ ...p, branchCode: e.target.value }))} placeholder={t.branches.branchCodePlaceholder} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <select value={form.branchType} onChange={(e) => setForm((p) => ({ ...p, branchType: e.target.value as BranchFormState['branchType'] }))} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }}>
                  <option value="WAREHOUSE">{t.branches.warehouse}</option>
                  <option value="RETAIL">{t.branches.retail}</option>
                  <option value="OFFICE">{t.branches.office}</option>
                  <option value="DISTRIBUTION">{t.branches.distribution}</option>
                </select>
                <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder={t.branches.city} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.managerName} onChange={(e) => setForm((p) => ({ ...p, managerName: e.target.value }))} placeholder={t.branches.managerName} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.managerPhone} onChange={(e) => setForm((p) => ({ ...p, managerPhone: e.target.value }))} placeholder={t.branches.managerPhone} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder={t.branches.branchPhone} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder={t.branches.branchEmail} className="rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder={t.branches.address} className="col-span-full rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: Theme.border }} />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Btn variant="secondary" onClick={() => setModalOpen(false)}>{t.products.cancel}</Btn>
                <Btn onClick={handleSubmit} disabled={createBranchMutation.isPending || updateBranchMutation.isPending}>
                  {editingBranch ? t.branches.updateBranch : t.branches.createBranchBtn}
                </Btn>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
