'use client';

import React, { useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Card, SecHead, Btn } from '../Primitives';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { useAdjustStockMutation, useInventorySummary } from '@/modules/inventory';
import { useListBranches } from '@/modules/branches';
import toast from 'react-hot-toast';

interface InventoryViewProps {
  products: any[];
  setProducts: (products: any[]) => void;
  sellLog: any[];
  setSellLog: (log: any[]) => void;
}

export default function InventoryView({
  products,
  sellLog,
}: InventoryViewProps) {
  const { isMobile } = useResponsive();
  const { data: branches = [] } = useListBranches();
  const activeBranches = branches.filter((b) => b.active);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formProductId, setFormProductId] = useState(products[0]?.id.toString() || '1');
  const [formBranchId, setFormBranchId] = useState('');
  const [formStockValue, setFormStockValue] = useState('');
  const [formMode, setFormMode] = useState<'set' | 'add'>('set');
  const [batchName, setBatchName] = useState('');
  const [mfgDate, setMfgDate] = useState('');
  const [expDate, setExpDate] = useState('');
  const adjustStockMutation = useAdjustStockMutation();
  const branchInventoryQuery = useInventorySummary({ page: 1, limit: 500, warehouseId: Number(selectedBranch) });

  const branchInventoryData = ((branchInventoryQuery as any).data?.data || []) as any[];
  const branchProducts = branchInventoryData.map((item: any) => ({
    id: item.productId || item.product?.id,
    name: item.product?.name || 'Unknown Product',
    sku: item.product?.sku || 'N/A',
    stock: item.availableQty ?? item.quantity ?? 0,
    warehouse: item.warehouse || 'N/A',
    status: 'active',
  }));
  const viewProducts = branchProducts;
  const selectedProduct = viewProducts.find((p: any) => p.id === parseInt(formProductId));

  React.useEffect(() => {
    if (!selectedBranch && activeBranches.length > 0) {
      setSelectedBranch(String(activeBranches[0].id));
    }
  }, [selectedBranch, activeBranches]);

  const handleFormSubmit = async () => {
    const productId = parseInt(formProductId);
    const enteredValue = parseInt(formStockValue);

    if (isNaN(enteredValue) || enteredValue < 0 || !selectedProduct) {
      return;
    }

    const currentStock = selectedProduct.stock || 0;
    const quantityChange = formMode === 'set' ? enteredValue - currentStock : enteredValue;
    if (quantityChange === 0) {
      setModalOpen(false);
      setFormStockValue('');
      return;
    }

    try {
      await adjustStockMutation.mutateAsync({
        productId,
        quantity: quantityChange,
        type: 'ADJUSTMENT',
        warehouseId: Number(selectedBranch),
        notes: formMode === 'set' ? 'Manual set stock from inventory dashboard' : 'Manual add stock from inventory dashboard',
        ...(formMode === 'add' && quantityChange > 0
          ? {
              batchName: batchName || undefined,
              manufactureDate: mfgDate ? new Date(mfgDate).toISOString() : undefined,
              expiryDate: expDate ? new Date(expDate).toISOString() : undefined,
            }
          : {}),
      });
      toast.success('Stock updated successfully');
      setFormStockValue('');
      setBatchName('');
      setMfgDate('');
      setExpDate('');
      setModalOpen(false);
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const openAddModal = () => {
    if (viewProducts.length === 0) {
      toast.error('No products available in the selected branch');
      return;
    }
    setFormProductId(viewProducts[0]?.id.toString() || '1');
    setFormBranchId(selectedBranch);
    setFormStockValue('');
    setFormMode('set');
    setBatchName('');
    setMfgDate('');
    setExpDate('');
    setModalOpen(true);
  };

  const filteredProducts = viewProducts;

  React.useEffect(() => {
    if (viewProducts.length === 0) {
      setFormProductId('1');
      return;
    }
    const exists = viewProducts.some((p: any) => String(p.id) === formProductId);
    if (!exists) {
      setFormProductId(String(viewProducts[0].id));
    }
  }, [formProductId, viewProducts]);

  React.useEffect(() => {
    setFormBranchId(selectedBranch);
  }, [selectedBranch]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[22px] font-extrabold" style={{ color: Theme.fg }}>
            Inventory Management
          </div>
          <div className="mt-0.5 text-[13px]" style={{ color: Theme.mutedFg }}>
            Track stock levels by branch, add & edit stock
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
            style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
          >
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Btn onClick={openAddModal} disabled={viewProducts.length === 0}>➕ Add Stock</Btn>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-[90%] max-w-[500px] overflow-y-auto"
            onClick={(e: any) => e.stopPropagation()}
          >
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-lg font-extrabold" style={{ color: Theme.fg }}>
                    Add or Edit Stock
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: Theme.mutedFg }}>
                    Update inventory for a product & branch
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer border-none bg-transparent text-2xl leading-none"
                  style={{ color: Theme.mutedFg }}
                >
                  ✕
                </button>
              </div>

              <div className={`mb-4 grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]"
                    style={{ color: Theme.mutedFg }}
                  >
                    Select Product
                  </label>
                  <select
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    className="w-full cursor-pointer rounded-lg bg-white px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                  >
                    {viewProducts.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]"
                    style={{ color: Theme.mutedFg }}
                  >
                    Select Branch
                  </label>
                  <select
                    value={formBranchId}
                    onChange={() => undefined}
                    disabled
                    className="w-full cursor-pointer rounded-lg bg-white px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                  >
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]"
                    style={{ color: Theme.mutedFg }}
                  >
                    Mode
                  </label>
                  <div className="flex gap-1 rounded-lg p-[3px]" style={{ background: Theme.muted }}>
                    {(['set', 'add'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setFormMode(mode)}
                        className="flex-1 cursor-pointer rounded-md border-none px-2 py-2 text-xs font-semibold capitalize"
                        style={{
                          background: formMode === mode ? '#fff' : 'transparent',
                          color: formMode === mode ? Theme.primary : Theme.mutedFg,
                          boxShadow: formMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {mode === 'set' ? '🔢 Set Stock' : '➕ Add to Stock'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]"
                    style={{ color: Theme.mutedFg }}
                  >
                    {formMode === 'set' ? 'New Stock' : 'Add Quantity'}
                  </label>
                  <input
                    type="number"
                    value={formStockValue}
                    onChange={(e) => setFormStockValue(e.target.value)}
                    placeholder={formMode === 'set' ? 'e.g., 50' : 'e.g., 10'}
                    className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                  />
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]"
                    style={{ color: Theme.mutedFg }}
                  >
                    Current Stock
                  </label>
                  <div
                    className="rounded-lg px-3 py-2.5 text-[13px] font-bold"
                    style={{
                      border: `1px solid ${Theme.border}`,
                      color: Theme.primary,
                      background: Theme.muted,
                    }}
                  >
                    {selectedProduct?.stock ?? 0}
                  </div>
                </div>
              </div>

              {formMode === 'add' && (
                <div className={`mt-3 grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <div className={isMobile ? '' : 'col-span-3'}>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]" style={{ color: Theme.mutedFg }}>
                      Batch Name
                    </label>
                    <input
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g., BATCH-APR-01"
                      className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                      style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]" style={{ color: Theme.mutedFg }}>
                      Manufacture Date
                    </label>
                    <input
                      type="date"
                      value={mfgDate}
                      onChange={(e) => setMfgDate(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                      style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]" style={{ color: Theme.mutedFg }}>
                      Expire Date
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none"
                      style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                    />
                  </div>
                </div>
              )}

              <Btn onClick={handleFormSubmit} className="mt-3.5 w-full" disabled={adjustStockMutation.isPending}>
                ✓ {formMode === 'set' ? 'Set Stock' : 'Add to Stock'}
              </Btn>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <SecHead
          title="📦 Stock Levels"
          sub={`Live stock synced from inventory API · Branch: ${branches.find((b) => b.id === Number(selectedBranch))?.name || 'N/A'}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr style={{ background: Theme.muted }}>
                <th
                  className="px-3 py-3 text-left font-semibold"
                  style={{ borderBottom: `1px solid ${Theme.border}` }}
                >
                  Product
                </th>
                <th
                  className="px-3 py-3 text-center font-semibold"
                  style={{ borderBottom: `1px solid ${Theme.border}` }}
                >
                  Stock
                </th>
                <th
                  className="px-3 py-3 text-center font-semibold"
                  style={{ borderBottom: `1px solid ${Theme.border}` }}
                >
                  Status
                </th>
                <th
                  className="px-3 py-3 text-center font-semibold"
                  style={{ borderBottom: `1px solid ${Theme.border}` }}
                >
                  Branch
                </th>
                <th
                  className="px-3 py-3 text-center font-semibold"
                  style={{ borderBottom: `1px solid ${Theme.border}` }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${Theme.border}` }}>
                  <td className="max-w-[150px] px-3 py-3 font-medium">
                    <div>{p.name}</div>
                    <div className="mt-0.5 text-[11px]" style={{ color: Theme.mutedFg }}>
                      {p.sku}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold" style={{ color: Theme.primary }}>
                    {p.stock}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className="rounded border px-2 py-1 text-xs font-semibold"
                      style={{
                        borderColor: Theme.border,
                        background: p.stock > 20 ? '#dcfce7' : p.stock > 0 ? '#fef3c7' : '#fee2e2',
                        color: p.stock > 20 ? '#166534' : p.stock > 0 ? '#92400e' : '#991b1b',
                      }}
                    >
                      {p.stock > 20 ? 'Healthy' : p.stock > 0 ? 'Low' : 'Out'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-xs" style={{ color: Theme.mutedFg }}>
                    {p.warehouse || 'N/A'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => {
                        setFormProductId(p.id.toString());
                        setFormMode('set');
                        setFormStockValue(String(p.stock ?? 0));
                        setModalOpen(true);
                      }}
                      className="cursor-pointer rounded border-none px-2.5 py-1.5 text-sm text-white transition-opacity hover:opacity-90"
                      style={{ background: Theme.primary }}
                    >
                      ✎ Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
                    No inventory found for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SecHead title="📋 Recent Manual Sales" sub="Latest walk-in transactions" />
        {sellLog.slice(0, 5).map((log: any) => (
          <div
            key={log.id}
            className="flex items-center justify-between border-b px-3 py-3"
            style={{ borderBottomColor: Theme.border }}
          >
            <div>
              <div className="font-semibold" style={{ color: Theme.fg }}>
                {log.product}
              </div>
              <div className="text-xs" style={{ color: Theme.mutedFg }}>
                {log.date}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{log.qty} unit(s)</div>
              <div className="text-xs" style={{ color: Theme.mutedFg }}>
                ৳{log.amount}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
