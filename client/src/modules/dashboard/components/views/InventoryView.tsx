'use client';

import React, { useState, useMemo } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Card, SecHead, Btn } from '../Primitives';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { useAdjustStockMutation, useInventorySummary } from '@/modules/inventory';
import { useListBranches } from '@/modules/branches';
import { useListProducts } from '@/modules/products';
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
  const [formSizeName, setFormSizeName] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all');
  const productSearchRef = React.useRef<HTMLDivElement | null>(null);
  const adjustStockMutation = useAdjustStockMutation();
  const allInventoryQuery = useInventorySummary({ page: 1, limit: 500 });
  const branchInventoryQuery = useInventorySummary({
    page: 1,
    limit: 500,
    ...(selectedBranch ? { warehouseId: Number(selectedBranch) } : {}),
  });
  // Fetch products with sizes/unit info for the modal
  const { data: productsWithSizes = [] } = useListProducts({ limit: 500 } as any, {
    queryKey: ['products', 'list', 'inventory-sizes', { limit: 500 }],
  });
  const getProductMeta = (productId: number) =>
    productsWithSizes.find((p: any) => p.id === productId);

  const branchInventoryData = ((branchInventoryQuery as any).data?.data || []) as any[];
  const allInventoryData = ((allInventoryQuery as any).data?.data || []) as any[];
  const resolveBranchId = (item: any) => {
    if (item.warehouseId) return item.warehouseId;
    const byName = activeBranches.find((b: any) => b.name === item.warehouse);
    return byName?.id;
  };
  const normalizeInventoryRows = (rows: any[]) =>
    rows.map((item: any) => ({
      id: item.productId || item.product?.id,
      name: item.product?.name || 'Unknown Product',
      sku: item.product?.sku || 'N/A',
      stock: item.availableQty ?? item.quantity ?? 0,
      branchId: resolveBranchId(item),
      warehouse: item.warehouse || 'N/A',
      status: 'active',
      batchName: item.batchName || 'N/A',
      manufactureDate: item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : 'N/A',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
      rawMfgDate: item.manufactureDate || '',
      rawExpDate: item.expiryDate || '',
    }));

  const allProducts = normalizeInventoryRows(allInventoryData);
  const branchProducts = branchInventoryData.map((item: any) => ({
    id: item.productId || item.product?.id,
    name: item.product?.name || 'Unknown Product',
    sku: item.product?.sku || 'N/A',
    stock: item.availableQty ?? item.quantity ?? 0,
    branchId: resolveBranchId(item),
    warehouse: item.warehouse || 'N/A',
    status: 'active',
    batchName: item.batchName || 'N/A',
    manufactureDate: item.manufactureDate ? new Date(item.manufactureDate).toLocaleDateString() : 'N/A',
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A',
    rawMfgDate: item.manufactureDate || '',
    rawExpDate: item.expiryDate || '',
  }));
  const viewProducts = branchProducts;
  const modalProducts = useMemo(() => {
    if (!formBranchId) return [];
    return allProducts.filter((p: any) => String(p.branchId || '') === formBranchId);
  }, [allProducts, formBranchId]);
  const searchableModalProducts = useMemo(() => {
    if (!formBranchId) return [];
    const q = productQuery.trim().toLowerCase();
    if (!q) return modalProducts.slice(0, 50);
    return modalProducts
      .filter((p: any) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [formBranchId, modalProducts, productQuery]);

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

  const selectedProduct = modalProducts.find((p: any) => p.id === parseInt(formProductId));

  const handleFormSubmit = async () => {
    if (!formBranchId) {
      toast.error('Please select a branch first');
      return;
    }
    if (!formProductId) {
      toast.error('Please search and select a product first');
      return;
    }

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
        warehouseId: Number(formBranchId),
        notes: formMode === 'set' ? 'Manual set stock from inventory dashboard' : 'Manual add stock from inventory dashboard',
        ...(formSizeName ? { sizeName: formSizeName } : {}),
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
      setFormSizeName('');
      setModalOpen(false);
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const openAddModal = () => {
    setFormBranchId(selectedBranch || '');
    setFormProductId('');
    setProductQuery('');
    setShowProductDropdown(false);
    setFormStockValue('');
    setFormMode('set');
    setBatchName('');
    setMfgDate('');
    setExpDate('');
    setFormSizeName('');
    setModalOpen(true);
  };

  React.useEffect(() => {
    if (!formBranchId) {
      setFormProductId('');
      return;
    }
    if (modalProducts.length === 0) {
      setFormProductId('');
      return;
    }
    if (!formProductId) {
      return;
    }
    const exists = modalProducts.some((p: any) => String(p.id) === formProductId);
    if (!exists) {
      setFormProductId('');
      setProductQuery('');
    }
  }, [formBranchId, formProductId, modalProducts]);

  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!productSearchRef.current?.contains(target)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Title and Summary Stats Side by Side */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="text-[18px] font-semibold" style={{ color: Theme.fg }}>
            Inventory Management
          </div>
          <div className="mt-1 text-[13px]" style={{ color: Theme.mutedFg }}>
            {(selectedBranch
              ? branches.find((b) => b.id === Number(selectedBranch))?.name
              : 'All Branches') || 'N/A'}{' '}
            · Live stock synced from inventory API
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 2xl:gap-3 w-full lg:w-auto">
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
            <option value="">All Branches</option>
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <Btn onClick={openAddModal}>
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
                            setFormBranchId(selectedBranch || String(p.branchId || ''));
                            setProductQuery(`${p.name} (${p.sku})`);
                            setShowProductDropdown(false);
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
            className="max-h-[92vh] w-[94%] max-w-[720px] overflow-y-auto"
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
                    Search Product
                  </label>
                  <div className="relative" ref={productSearchRef}>
                    <input
                      value={productQuery}
                      onChange={(e) => {
                        setProductQuery(e.target.value);
                        setFormProductId('');
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => {
                        if (formBranchId) setShowProductDropdown(true);
                      }}
                      disabled={!formBranchId}
                      placeholder={formBranchId ? 'Search by product name or SKU...' : 'Select branch first'}
                      className="w-full rounded-lg bg-white px-3 py-2.5 text-[13px] outline-none"
                      style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                    />

                    {showProductDropdown && formBranchId && (
                      <div
                        className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border bg-white"
                        style={{ borderColor: Theme.border, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
                      >
                        {searchableModalProducts.length === 0 ? (
                          <div className="px-3 py-2 text-xs" style={{ color: Theme.mutedFg }}>
                            No products found for this branch.
                          </div>
                        ) : (
                          searchableModalProducts.map((p: any) => (
                            <button
                              key={`${p.id}-${p.branchId || 'na'}`}
                              type="button"
                              onClick={() => {
                                setFormProductId(String(p.id));
                                setProductQuery(`${p.name} (${p.sku})`);
                                setShowProductDropdown(false);
                              }}
                              className="w-full cursor-pointer border-0 px-3 py-2 text-left text-[13px]"
                              style={{ background: '#fff', color: Theme.fg }}
                            >
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-[11px]" style={{ color: Theme.mutedFg }}>SKU: {p.sku}</div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
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
                    onChange={(e) => {
                      const nextBranchId = e.target.value;
                      setFormBranchId(nextBranchId);
                      setFormProductId('');
                      setProductQuery('');
                      setShowProductDropdown(false);
                    }}
                    className="w-full cursor-pointer rounded-lg bg-white px-3 py-2.5 text-[13px] outline-none"
                    style={{ border: `1px solid ${Theme.border}`, color: Theme.fg }}
                  >
                    <option value="">Select Branch</option>
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

              {/* Size selector — shown when product has sizes */}
              {(() => {
                const meta = formProductId ? getProductMeta(parseInt(formProductId)) : null;
                const sizes = (meta as any)?.sizes || [];
                if (sizes.length === 0) return null;
                return (
                  <div className="mt-3">
                    <label
                      className="mb-1.5 block text-xs font-bold uppercase tracking-[0.05em]"
                      style={{ color: Theme.mutedFg }}
                    >
                      Size *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s: any) => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setFormSizeName(s.name)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                          style={{
                            borderColor: formSizeName === s.name ? Theme.primary : Theme.border,
                            background: formSizeName === s.name ? Theme.primary : '#fff',
                            color: formSizeName === s.name ? '#fff' : Theme.fg,
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Unit info display */}
              {(() => {
                const meta = formProductId ? getProductMeta(parseInt(formProductId)) : null;
                if (!meta) return null;
                return (
                  <div className="mt-2 text-xs" style={{ color: Theme.mutedFg }}>
                    Unit: <span className="font-semibold">{(meta as any).unitType === 'WEIGHT' ? '⚖️' : '📦'} {(meta as any).unitLabel}</span>
                  </div>
                );
              })()}

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
