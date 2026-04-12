'use client';

import React, { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all');
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
    batchName: item.batchName || 'N/A',
    manufactureDate: item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : 'N/A',
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
    rawMfgDate: item.manufactureDate || '',
    rawExpDate: item.expiryDate || '',
  }));
  const viewProducts = branchProducts;

  // Helper functions
  const getStatus = (stock: number) => {
    if (stock === 0) return 'out';
    if (stock <= 10) return 'low';
    return 'ok';
  };

  const getStatusLabel = (stock: number) => {
    if (stock === 0) return 'Out of stock';
    if (stock <= 10) return 'Low';
    return 'Healthy';
  };

  const getStatusColor = (status: string) => {
    if (status === 'out') return '#A32D2D';
    if (status === 'low') return '#854F0B';
    return '#3B6D11';
  };

  const getStatusBg = (status: string) => {
    if (status === 'out') return '#FCEBEB';
    if (status === 'low') return '#FAEEDA';
    return '#EAF3DE';
  };

  // Filter products based on search and filter
  const filteredProducts = useMemo(() => {
    return branchProducts.filter((p: any) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const status = getStatus(p.stock);
      const matchFilter = activeFilter === 'all' || status === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [branchProducts, searchQuery, activeFilter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      totalSkus: branchProducts.length,
      totalUnits: branchProducts.reduce((sum: number, p: any) => sum + p.stock, 0),
      lowStockCount: branchProducts.filter((p: any) => getStatus(p.stock) === 'low').length,
      outOfStockCount: branchProducts.filter((p: any) => getStatus(p.stock) === 'out').length,
    };
  }, [branchProducts]);

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

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Title and Summary Stats Side by Side */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="text-[18px] font-semibold" style={{ color: Theme.fg }}>
            Inventory Management
          </div>
          <div className="mt-1 text-[13px]" style={{ color: Theme.mutedFg }}>
            {branches.find((b) => b.id === Number(selectedBranch))?.name || 'N/A'} · Live stock synced from inventory API
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 w-full lg:w-auto">
          {[
            { label: 'Total SKUs', val: summaryStats.totalSkus, color: '' },
            { label: 'Total units', val: summaryStats.totalUnits, color: '' },
            { label: 'Low stock', val: summaryStats.lowStockCount, color: '#854F0B' },
            { label: 'Out of stock', val: summaryStats.outOfStockCount, color: '#A32D2D' },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-lg px-3 py-2"
              style={{ background: Theme.muted }}
            >
              <div className="text-xs" style={{ color: Theme.mutedFg }}>
                {stat.label}
              </div>
              <div className="mt-1 text-lg font-semibold" style={{ color: stat.color || Theme.fg }}>
                {stat.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search products or SKU…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[180px] rounded-lg border px-3 py-2 text-sm outline-none"
            style={{ borderColor: Theme.border, color: Theme.fg }}
          />

          {(['all', 'ok', 'low', 'out'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                borderColor: Theme.border,
                background: activeFilter === filter ? Theme.primary : 'transparent',
                color: activeFilter === filter ? '#fff' : Theme.mutedFg,
              }}
            >
              {filter === 'all' ? 'All' : filter === 'ok' ? 'Healthy' : filter === 'low' ? 'Low' : 'Out'}
            </button>
          ))}

          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
            style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
          >
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <Btn onClick={openAddModal} disabled={viewProducts.length === 0}>
            + Add Stock
          </Btn>
        </div>

        {/* Table */}
        {filteredProducts.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: Theme.mutedFg }}>
            No products match your filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: Theme.muted }}>
                  <th
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: Theme.mutedFg,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '8px 12px',
                      textAlign: 'left',
                      borderBottom: `1px solid ${Theme.border}`,
                      width: '40%',
                    }}
                  >
                    Product
                  </th>
                  <th
                    className='hidden md:table-cell'
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: Theme.mutedFg,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '8px 12px',
                      textAlign: 'left',
                      borderBottom: `1px solid ${Theme.border}`,
                      width: '12%',
                    }}
                  >
                    Stock
                  </th>
                  <th
                    className='hidden md:table-cell'
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: Theme.mutedFg,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '8px 12px',
                      textAlign: 'left',
                      borderBottom: `1px solid ${Theme.border}`,
                      width: '14%',
                    }}
                  >
                    Status
                  </th>
                  <th
                    className='hidden lg:table-cell'
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: Theme.mutedFg,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '8px 12px',
                      textAlign: 'right',
                      borderBottom: `1px solid ${Theme.border}`,
                      width: '14%',
                    }}
                  >
                    Batch / Exp
                  </th>
                  <th
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: Theme.mutedFg,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '8px 12px',
                      textAlign: 'right',
                      borderBottom: `1px solid ${Theme.border}`,
                      width: '6%',
                    }}
                  />
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p: any) => {
                  const status = getStatus(p.stock);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: `1px solid ${Theme.border}`,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = Theme.muted)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${Theme.border}`,
                          verticalAlign: 'middle',
                          fontSize: '13px',
                          color: Theme.fg,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: Theme.mutedFg, marginTop: '2px', fontFamily: 'monospace' }}>
                            {p.sku}
                          </div>
                        </div>
                      </td>
                      <td
                        className='hidden md:table-cell'
                        style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${Theme.border}`,
                          verticalAlign: 'middle',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: getStatusColor(status),
                        }}
                      >
                        {p.stock}
                      </td>
                      <td
                        className='hidden md:table-cell'
                        style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${Theme.border}`,
                          verticalAlign: 'middle',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: getStatusBg(status),
                            color: getStatusColor(status),
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getStatusLabel(p.stock)}
                        </span>
                      </td>
                      <td
                        className='hidden lg:table-cell'
                        style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${Theme.border}`,
                          verticalAlign: 'middle',
                          fontSize: '12px',
                          color: Theme.mutedFg,
                          fontFamily: 'monospace',
                          textAlign: 'right',
                        }}
                      >
                        {p.batchName} / {p.expiryDate}
                      </td>
                      <td
                        style={{
                          padding: '10px 12px',
                          borderBottom: `1px solid ${Theme.border}`,
                          verticalAlign: 'middle',
                          textAlign: 'right',
                        }}
                      >
                        <button
                          onClick={() => {
                            setFormProductId(p.id.toString());
                            setFormMode('set');
                            setFormStockValue(String(p.stock ?? 0));
                            setBatchName(p.batchName !== 'N/A' ? p.batchName : '');
                            setMfgDate(p.rawMfgDate ? p.rawMfgDate.split('T')[0] : '');
                            setExpDate(p.rawExpDate ? p.rawExpDate.split('T')[0] : '');
                            setModalOpen(true);
                          }}
                          className="cursor-pointer rounded border px-2 py-1 text-xs font-medium transition-all"
                          style={{
                            border: `1px solid ${Theme.border}`,
                            background: '#fff',
                            color: Theme.fg,
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Count */}
        <div style={{ fontSize: '11px', color: Theme.mutedFg, marginTop: '10px' }}>
          {filteredProducts.length} of {branchProducts.length} products
        </div>
      </Card>

      {/* Modal */}
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

      {/* Recent Manual Sales */}
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
