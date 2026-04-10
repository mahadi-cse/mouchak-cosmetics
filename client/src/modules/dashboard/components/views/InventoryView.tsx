'use client';

import React, { useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Card, SecHead, Btn } from '../Primitives';
import { INITIAL_BRANCHES } from '@/modules/dashboard/data/mockData';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';

interface InventoryViewProps {
  products: any[];
  setProducts: (products: any[]) => void;
  sellLog: any[];
  setSellLog: (log: any[]) => void;
}

interface BranchStock {
  [branchId: number]: number;
}

export default function InventoryView({
  products,
  setProducts,
  sellLog,
  setSellLog,
}: InventoryViewProps) {
  const { isMobile } = useResponsive();
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [editingProduct, setEditingProduct] = useState<{ id: number; branchId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [formProductId, setFormProductId] = useState(products[0]?.id.toString() || '1');
  const [formBranchId, setFormBranchId] = useState('1');
  const [formStockValue, setFormStockValue] = useState('');
  const [formMode, setFormMode] = useState<'set' | 'add'>('set');

  const branchStockMap: Record<number, BranchStock> = {
    1: { 1: 48, 2: 12, 3: 30, 4: 0, 5: 67, 6: 24, 7: 45, 8: 19 },
    2: { 1: 20, 2: 8, 3: 25, 4: 0, 5: 40, 6: 15, 7: 22, 8: 12 },
    3: { 1: 10, 2: 5, 3: 12, 4: 0, 5: 27, 6: 8, 7: 15, 8: 8 },
  };

  const getProductBranchStock = (productId: number, branchId: number) => {
    return branchStockMap[productId]?.[branchId] || 0;
  };

  const getTotalProductStock = (productId: number) => {
    return Object.values(branchStockMap[productId] || {}).reduce((sum, stock) => sum + stock, 0);
  };

  const handleEditStock = (productId: number, branchId: string) => {
    const branchNumId = parseInt(branchId);
    const currentStock = getProductBranchStock(productId, branchNumId);
    setEditingProduct({ id: productId, branchId: branchId as any });
    setEditValue(currentStock.toString());
  };

  const handleSaveStock = () => {
    if (editingProduct) {
      const branchNumId = parseInt(editingProduct.branchId);
      branchStockMap[editingProduct.id][branchNumId] = parseInt(editValue) || 0;
      setEditingProduct(null);
      setEditValue('');
    }
  };

  const handleFormSubmit = () => {
    const productId = parseInt(formProductId);
    const branchId = parseInt(formBranchId);
    const newStock = parseInt(formStockValue);

    if (!isNaN(newStock) && newStock >= 0) {
      if (formMode === 'set') {
        branchStockMap[productId][branchId] = newStock;
      } else {
        branchStockMap[productId][branchId] = (branchStockMap[productId][branchId] || 0) + newStock;
      }
      setFormStockValue('');
      setModalOpen(false);
    }
  };

  const openAddModal = () => {
    setFormProductId(products[0]?.id.toString() || '1');
    setFormBranchId('1');
    setFormStockValue('');
    setFormMode('set');
    setModalOpen(true);
  };

  const filteredProducts = products;
  const activeBranches = INITIAL_BRANCHES.filter((b) => b.active);
  const displayBranches =
    selectedBranch === 'all'
      ? activeBranches
      : activeBranches.filter((b) => b.id === parseInt(selectedBranch));

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
            className="cursor-pointer rounded-[9px] bg-white px-3 py-2 text-[13px] outline-none"
            style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
          >
            <option value="all">All Branches</option>
            {INITIAL_BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} {!b.active ? '(Inactive)' : ''}
              </option>
            ))}
          </select>
          <Btn onClick={openAddModal}>➕ Add Stock</Btn>
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
                    {products.map((p: any) => (
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
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full cursor-pointer rounded-lg bg-white px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                  >
                    {INITIAL_BRANCHES.filter((b) => b.active).map((b) => (
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
                    {getProductBranchStock(parseInt(formProductId), parseInt(formBranchId))}
                  </div>
                </div>
              </div>

              <Btn onClick={handleFormSubmit} className="mt-3.5 w-full">
                ✓ {formMode === 'set' ? 'Set Stock' : 'Add to Stock'}
              </Btn>
            </Card>
          </div>
        </div>
      )}

      <Card>
        <SecHead
          title="📦 Stock Levels by Branch"
          sub={
            selectedBranch === 'all'
              ? 'All active branches'
              : `${INITIAL_BRANCHES.find((b) => b.id === parseInt(selectedBranch))?.name}`
          }
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
                {displayBranches.map((b) => (
                  <th
                    key={b.id}
                    className="px-3 py-3 text-center text-xs font-semibold"
                    style={{ borderBottom: `1px solid ${Theme.border}` }}
                  >
                    {b.name.split(' ')[0]}
                  </th>
                ))}
                <th
                  className="px-3 py-3 text-center font-semibold"
                  style={{ borderBottom: `1px solid ${Theme.border}` }}
                >
                  Total
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

                  {displayBranches.map((b) => {
                    const stock = getProductBranchStock(p.id, b.id);
                    const isEditing =
                      editingProduct?.id === p.id && editingProduct?.branchId === b.id.toString();

                    return (
                      <td
                        key={b.id}
                        className="px-3 py-3 text-center"
                        style={{ borderRight: `1px solid ${Theme.border}` }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-[50px] rounded text-xs"
                              style={{
                                padding: '4px',
                                border: `1px solid ${Theme.primary}`,
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveStock}
                              className="cursor-pointer rounded px-2 py-1 text-[11px] text-white"
                              style={{ background: Theme.success }}
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStock(p.id, b.id.toString())}
                            className="cursor-pointer rounded border px-2 py-1 text-xs font-semibold transition-all"
                            style={{
                              borderColor: Theme.border,
                              background: stock > 20 ? '#dcfce7' : stock > 0 ? '#fef3c7' : '#fee2e2',
                              color: stock > 20 ? '#166534' : stock > 0 ? '#92400e' : '#991b1b',
                            }}
                          >
                            {stock}
                          </button>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-3 py-3 text-center font-bold" style={{ color: Theme.primary }}>
                    {selectedBranch === 'all'
                      ? getTotalProductStock(p.id)
                      : getProductBranchStock(p.id, parseInt(selectedBranch))}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => {
                        setFormProductId(p.id.toString());
                        setFormBranchId(selectedBranch === 'all' ? '1' : selectedBranch);
                        setFormMode('set');
                        setFormStockValue('');
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
