'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead, Btn } from '../Primitives';
import { Product, SellLog } from '@/modules/dashboard/data/mockData';
import { useCreateManualSaleMutation, useListManualSales } from '@/modules/manual-sales';
import { useInventorySummary } from '@/modules/inventory';
import { useListBranches } from '@/modules/branches';
import { useListProducts } from '@/modules/products';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

interface SalesViewProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  sellLog: SellLog[];
  setSellLog: (log: SellLog[]) => void;
}

interface SaleLineItem {
  productId: number;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  total: number;
  unitType: 'PIECE' | 'WEIGHT';
  unitLabel: string;
  sizeName: string;
  sizes: Array<{ name: string; imageUrl?: string | null; priceOverride?: number | null }>;
}

const SALES_BRANCH_STORAGE_KEY = 'dashboard.sales.selectedBranchId';

export default function SalesView({
  products,
}: SalesViewProps) {
  const { isMobile } = useResponsive();
  const { data: session } = useSession();
  const { data: branches = [] } = useListBranches();
  const activeBranches = branches.filter((b) => b.active);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [saleBranchId, setSaleBranchId] = useState('');
  const [lineItems, setLineItems] = useState<SaleLineItem[]>([]);
  const [searchLog, setSearchLog] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historySortBy, setHistorySortBy] = useState<'createdAt' | 'totalAmount' | 'totalQty' | 'saleNumber'>('createdAt');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
  const [branchInitialized, setBranchInitialized] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const branchInventoryQuery = useInventorySummary({ page: 1, limit: 500, warehouseId: Number(saleBranchId) });
  const createManualSaleMutation = useCreateManualSaleMutation();
  const manualSalesQuery = useListManualSales({
    page: historyPage,
    limit: historyLimit,
    search: searchLog || undefined,
    sortBy: historySortBy,
    sortOrder: historySortOrder,
  });

  const branchInventoryData = ((branchInventoryQuery as any).data?.data || []) as any[];
  // Fetch products with sizes/unit info
  const { data: productsMetaList = [] } = useListProducts(
    { limit: 500, ...(saleBranchId ? { branchId: Number(saleBranchId) } : {}) } as any,
    { queryKey: ['products', 'list', 'sales-meta', { branchId: saleBranchId }], enabled: !!saleBranchId }
  );
  const getProductMeta = (productId: number) =>
    productsMetaList.find((p: any) => p.id === productId);

  const branchProducts: Product[] = branchInventoryData.map((item: any) => ({
    id: item.productId || item.product?.id,
    name: item.product?.name || 'Unknown Product',
    sku: item.product?.sku || 'N/A',
    category: 'Uncategorized',
    price: Number(item.product?.price ?? 0),
    stock: Number(item.availableQty ?? item.quantity ?? 0),
    warehouse: item.warehouse || 'N/A',
    sold: 0,
    manualSold: 0,
    status: 'active',
  }));
  const searchableProducts = branchProducts;

  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const totalQty = lineItems.reduce((sum, item) => sum + item.qty, 0);
  const totalItems = lineItems.length;
  const hasInvalidLine = lineItems.some((item) => {
    const product = searchableProducts.find((p) => p.id === item.productId);
    return !product || item.qty > product.stock || item.qty < 1 || item.unitPrice < 0;
  });

  const filteredProducts = searchableProducts.filter((p) =>
    p.stock > 0 && (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const historyRows = manualSalesQuery.data?.data || [];
  const historyMeta = manualSalesQuery.data?.pagination;

  useEffect(() => {
    if (branchInitialized || activeBranches.length === 0) return;

    const savedBranchId = window.localStorage.getItem(SALES_BRANCH_STORAGE_KEY) || '';
    const savedBranchStillActive = savedBranchId
      ? activeBranches.some((b) => String(b.id) === savedBranchId)
      : false;

    setSaleBranchId(savedBranchStillActive ? savedBranchId : String(activeBranches[0].id));
    setBranchInitialized(true);
  }, [branchInitialized, activeBranches]);

  useEffect(() => {
    if (!saleBranchId) return;
    window.localStorage.setItem(SALES_BRANCH_STORAGE_KEY, saleBranchId);
  }, [saleBranchId]);

  useEffect(() => {
    if (!saleBranchId || activeBranches.length === 0) return;
    const selectedStillActive = activeBranches.some((b) => String(b.id) === saleBranchId);
    if (!selectedStillActive) {
      const fallbackBranchId = String(activeBranches[0].id);
      setSaleBranchId(fallbackBranchId);
      window.localStorage.setItem(SALES_BRANCH_STORAGE_KEY, fallbackBranchId);
    }
  }, [saleBranchId, activeBranches]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!searchBoxRef.current?.contains(target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setLineItems([]);
    setSearchQuery('');
  }, [saleBranchId]);

  const handleSelectProduct = (product: Product) => {
    const meta = getProductMeta(product.id) as any;
    const unitType = meta?.unitType || 'PIECE';
    const unitLabel = meta?.unitLabel || 'pc';
    const sizes = (meta?.sizes || []).filter((s: any) => s.isActive !== false);
    const defaultSize = sizes.length > 0 ? sizes[0].name : '';
    const defaultQty = unitType === 'WEIGHT' ? 1 : 1;

    setLineItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => {
          if (i.productId !== product.id) return i;
          const maxQty = product.stock;
          const nextQty = Math.min(maxQty, i.qty + 1);
          return { ...i, qty: nextQty, total: nextQty * i.unitPrice };
        });
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          qty: defaultQty,
          unitPrice: Number(product.price ?? 0),
          total: Number(product.price ?? 0) * defaultQty,
          unitType,
          unitLabel,
          sizeName: defaultSize,
          sizes,
        },
      ];
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleConfirm = async () => {
    if (lineItems.length > 0 && !hasInvalidLine) {
      try {
        await createManualSaleMutation.mutateAsync({
          soldBy: session?.user?.name || session?.user?.email || 'Staff',
          note: 'Manual Sale',
          branchId: Number(saleBranchId),
          branchName: activeBranches.find((b) => b.id === Number(saleBranchId))?.name || 'Main',
          items: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            ...(item.sizeName ? { sizeName: item.sizeName } : {}),
          })),
        });
        toast.success(`Recorded ${lineItems.length} product(s), ${totalQty} qty total`);
        setSearchQuery('');
        setLineItems([]);
      } catch {
        toast.error('Failed to record sale. Please try again.');
      }
    }
  };

  const getMaxEditableQty = (productId: number, rowIndex: number) => {
    const product = searchableProducts.find((p) => p.id === productId);
    if (!product) return 1;
    const usedByOthers = lineItems.reduce((sum, item, idx) => {
      if (idx === rowIndex || item.productId !== productId) return sum;
      return sum + item.qty;
    }, 0);
    return Math.max(1, product.stock - usedByOthers);
  };

  const updateLineItem = (index: number, patch: Partial<Pick<SaleLineItem, 'qty' | 'unitPrice'>>) => {
    setLineItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const maxQty = getMaxEditableQty(item.productId, index);
        const minQty = 1;
        const nextQty = patch.qty !== undefined ? Math.max(minQty, Math.min(maxQty, patch.qty)) : item.qty;
        const nextPrice = patch.unitPrice !== undefined ? Math.max(0, patch.unitPrice) : item.unitPrice;
        return { ...item, qty: nextQty, unitPrice: nextPrice, total: nextQty * nextPrice };
      })
    );
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-3.5'}`}>
      {/* Add Sale Form Card */}
      <Card className="border border-pink-100 shadow-sm">
        
        <div className="px-3.5 py-3.5 flex flex-col gap-3">
          {/* Header + Branch selector on same row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>Add New Sale</div>
              <div className="text-[12px]" style={{ color: Theme.mutedFg }}>Record a manual sales transaction</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold whitespace-nowrap" style={{ color: Theme.mutedFg }}>Branch</label>
              <select
                value={saleBranchId}
                onChange={(e) => setSaleBranchId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
              >
                {activeBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Row */}
          <div className="relative" ref={searchBoxRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search product name or SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-100"
                style={{
                  borderColor: Theme.border,
                  color: Theme.fg,
                  background: '#fff',
                }}
              />
              {showDropdown && (
                <div
                  className="absolute top-full left-0 right-0 bg-white border rounded-b-lg max-h-60 overflow-y-auto z-10"
                  style={{
                    borderColor: Theme.border,
                    borderTop: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="w-full px-3 py-2 border-b text-left cursor-pointer text-xs flex justify-between items-center font-medium"
                        style={{
                          background: 'transparent',
                          color: Theme.fg,
                          borderColor: Theme.border,
                        }}
                      >
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs" style={{ color: Theme.mutedFg }}>SKU: {p.sku}</div>
                        </div>
                        <div className="text-xs ml-2" style={{ color: Theme.mutedFg }}>
                          Stock: {p.stock}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-center text-xs" style={{ color: Theme.mutedFg }}>
                      No products found in this branch
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart List */}
          <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: Theme.border }}>
            {!isMobile && (
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide bg-gray-50" style={{ color: Theme.mutedFg }}>
                <div className="col-span-4">Product</div>
                <div className="col-span-3 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Line Total</div>
                <div className="col-span-1 text-right"> </div>
              </div>
            )}

            {lineItems.length > 0 ? (
              lineItems.map((item, idx) => {
                const maxQty = getMaxEditableQty(item.productId, idx);

                if (isMobile) {
                  return (
                    <div key={`${item.productId}-${idx}`} className="px-3 py-3 border-t border-gray-100 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: Theme.fg }}>{item.name}</div>
                          <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                            {item.sku} · {item.unitType === 'WEIGHT' ? '⚖️' : '📦'} {item.unitLabel}
                          </div>
                          {item.sizes.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.sizes.map((s: any) => (
                                <button
                                  key={s.name}
                                  type="button"
                                  onClick={() => {
                                    setLineItems((prev) =>
                                      prev.map((li, i) => {
                                        if (i !== idx) return li;
                                        const newPrice = s.priceOverride ? Number(s.priceOverride) : li.unitPrice;
                                        return { ...li, sizeName: s.name, unitPrice: newPrice, total: li.qty * newPrice };
                                      })
                                    );
                                  }}
                                  className="rounded border px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer"
                                  style={{
                                    borderColor: item.sizeName === s.name ? Theme.primary : Theme.border,
                                    background: item.sizeName === s.name ? Theme.primary : '#fff',
                                    color: item.sizeName === s.name ? '#fff' : Theme.fg,
                                  }}
                                >
                                  {s.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeLineItem(idx)}
                          className="text-sm font-bold px-2 py-1 rounded"
                          style={{ color: '#dc2626' }}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2.5">
                        <div>
                          <div className="text-[10px] mb-1 font-semibold uppercase tracking-wide" style={{ color: Theme.mutedFg }}>
                            Qty
                          </div>
                          <div className="inline-flex items-center rounded-lg border bg-white overflow-hidden" style={{ borderColor: Theme.border }}>
                            <button
                              className="w-10 h-10 text-base font-bold flex items-center justify-center transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ color: Theme.fg }}
                              onClick={() => updateLineItem(idx, { qty: item.qty - 1 })}
                              disabled={item.qty <= 1}
                            >
                              −
                            </button>
                            <span className="w-px h-5 bg-gray-200" />
                            <input
                              type="number"
                              min={1}
                              max={maxQty}
                              value={item.qty}
                              onChange={(e) => updateLineItem(idx, { qty: Number(e.target.value) || 1 })}
                              className="w-14 text-center text-sm font-bold outline-none bg-transparent"
                              style={{ color: Theme.fg }}
                            />
                            <span className="w-px h-5 bg-gray-200" />
                            <button
                              className="w-10 h-10 text-base font-bold flex items-center justify-center transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{ color: Theme.fg }}
                              onClick={() => updateLineItem(idx, { qty: item.qty + 1 })}
                              disabled={item.qty >= maxQty}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] mb-1 font-semibold uppercase tracking-wide text-right" style={{ color: Theme.mutedFg }}>
                            Unit Price
                          </div>
                          <input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                            className="w-full px-2.5 py-2 border rounded text-sm text-right outline-none bg-white"
                            style={{ borderColor: Theme.border }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] font-semibold" style={{ color: Theme.mutedFg }}>Line Total</span>
                        <span className="text-sm font-bold" style={{ color: Theme.primary }}>
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`${item.productId}-${idx}`} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-t border-gray-100 items-center hover:bg-gray-50">
                    <div className="col-span-4 min-w-0">
                      <div className="text-xs font-semibold truncate" style={{ color: Theme.fg }}>{item.name}</div>
                      <div className="text-[10px]" style={{ color: Theme.mutedFg }}>
                        {item.sku} · {item.unitType === 'WEIGHT' ? '⚖️' : '📦'} {item.unitLabel}
                      </div>
                      {item.sizes.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {item.sizes.map((s: any) => (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => {
                                setLineItems((prev) =>
                                  prev.map((li, i) => {
                                    if (i !== idx) return li;
                                    const newPrice = s.priceOverride ? Number(s.priceOverride) : li.unitPrice;
                                    return { ...li, sizeName: s.name, unitPrice: newPrice, total: li.qty * newPrice };
                                  })
                                );
                              }}
                              className="rounded border px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer"
                              style={{
                                borderColor: item.sizeName === s.name ? Theme.primary : Theme.border,
                                background: item.sizeName === s.name ? Theme.primary : '#fff',
                                color: item.sizeName === s.name ? '#fff' : Theme.fg,
                              }}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-span-3 flex justify-center">
                      <div className="inline-flex items-center rounded-lg border bg-white overflow-hidden" style={{ borderColor: Theme.border }}>
                        <button
                          className="w-9 h-9 text-base font-bold flex items-center justify-center transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ color: Theme.fg }}
                          onClick={() => updateLineItem(idx, { qty: item.qty - 1 })}
                          disabled={item.qty <= 1}
                        >
                          −
                        </button>
                        <span className="w-px h-5 bg-gray-200" />
                        <input
                          type="number"
                          min={1}
                          max={maxQty}
                          value={item.qty}
                          onChange={(e) => updateLineItem(idx, { qty: Number(e.target.value) || 1 })}
                          className="w-11 text-center text-sm font-bold outline-none bg-transparent"
                          style={{ color: Theme.fg }}
                        />
                        <span className="w-px h-5 bg-gray-200" />
                        <button
                          className="w-9 h-9 text-base font-bold flex items-center justify-center transition hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ color: Theme.fg }}
                          onClick={() => updateLineItem(idx, { qty: item.qty + 1 })}
                          disabled={item.qty >= maxQty}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-xs text-right outline-none bg-white"
                        style={{ borderColor: Theme.border }}
                      />
                    </div>
                    <div className="col-span-2 text-right text-xs font-bold" style={{ color: Theme.primary }}>
                      {formatCurrency(item.total)}
                    </div>
                    <div className="col-span-1 text-right">
                      <button
                        onClick={() => removeLineItem(idx)}
                        className="text-xs font-bold px-1.5 py-1 rounded"
                        style={{ color: '#dc2626' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-5 text-center text-xs" style={{ color: Theme.mutedFg }}>
                No products added yet — search above to add items.
              </div>
            )}
          </div>

          {/* Footer Row */}
          <div className={`pt-1 ${isMobile ? 'space-y-1.5' : 'flex items-center justify-between'}`}>
            <div className="text-xs" style={{ color: Theme.mutedFg }}>
              <span className="font-semibold">Total items: {totalItems}</span>
              <span className="mx-2">•</span>
              <span className="font-semibold">Total qty: {totalQty}</span>
            </div>
            <div className="text-sm font-black" style={{ color: Theme.primary }}>
              Grand Total: {formatCurrency(grandTotal)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-2 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
            <Btn
              variant="ghost"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
                setLineItems([]);
              }}
              className={isMobile ? 'w-full' : ''}
            >
              Reset
            </Btn>
            <Btn
              variant="primary"
              disabled={lineItems.length === 0 || hasInvalidLine || createManualSaleMutation.isPending}
              onClick={handleConfirm}
              className={isMobile ? 'w-full' : ''}
            >
              {createManualSaleMutation.isPending ? 'Recording...' : `Record Sale · ${formatCurrency(grandTotal)}`}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Sales History */}
      <Card>
        <SecHead 
          title="Sales History" 
          sub={`Total sales: ${historyMeta?.total ?? 0}`}
        />
        
        <div className="p-3.5">
          {/* Controls */}
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <input
              type="text"
              placeholder="Search by product or staff..."
              value={searchLog}
              onChange={(e) => {
                setSearchLog(e.target.value);
                setHistoryPage(1);
              }}
              className="w-full px-3 py-2 border rounded text-xs outline-none"
              style={{
                borderColor: Theme.border,
                color: Theme.fg,
                background: '#fff',
              }}
            />
            <select
              value={historySortBy}
              onChange={(e) => {
                setHistorySortBy(e.target.value as 'createdAt' | 'totalAmount' | 'totalQty' | 'saleNumber');
                setHistoryPage(1);
              }}
              className="w-full px-3 py-2 border rounded text-xs outline-none"
              style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
            >
              <option value="createdAt">Sort: Date</option>
              <option value="saleNumber">Sort: Sale ID</option>
              <option value="totalQty">Sort: Quantity</option>
              <option value="totalAmount">Sort: Amount</option>
            </select>
            <div className="flex gap-2">
              <select
                value={historySortOrder}
                onChange={(e) => {
                  setHistorySortOrder(e.target.value as 'asc' | 'desc');
                  setHistoryPage(1);
                }}
                className="w-1/2 px-3 py-2 border rounded text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              <select
                value={historyLimit}
                onChange={(e) => {
                  setHistoryLimit(Number(e.target.value));
                  setHistoryPage(1);
                }}
                className="w-1/2 px-3 py-2 border rounded text-xs outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2" style={{ borderColor: Theme.border }}>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Sale ID</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Product</th>
                  <th className="px-2 py-2 font-bold text-center" style={{ color: Theme.mutedFg }}>Qty</th>
                  <th className="px-2 py-2 font-bold text-right" style={{ color: Theme.mutedFg }}>Amount</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Date</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>Branch</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>By</th>
                </tr>
              </thead>
              <tbody>
                {manualSalesQuery.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-xs" style={{ color: Theme.mutedFg }}>
                      Loading sales...
                    </td>
                  </tr>
                ) : historyRows.length > 0 ? (
                  historyRows.map((sale) => (
                    <tr 
                      key={sale.saleNumber}
                      className="border-b"
                      style={{ borderColor: Theme.border }}
                    >
                      <td className="px-2 py-2.5 font-semibold" style={{ color: Theme.primary }}>
                        {sale.saleNumber}
                      </td>
                      <td className="px-2 py-2.5" style={{ color: Theme.fg }}>
                        {sale.items?.length > 1
                          ? `${sale.items[0]?.productNameSnapshot || 'Sale Item'} +${sale.items.length - 1} more`
                          : sale.items?.[0]?.productNameSnapshot || 'Sale Item'}
                      </td>
                      <td className="px-2 py-2.5 text-center font-semibold" style={{ color: Theme.fg }}>
                        {sale.totalQty}
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold" style={{ color: Theme.primary }}>
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="px-2 py-2.5 text-xs" style={{ color: Theme.mutedFg }}>
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2.5" style={{ color: Theme.mutedFg }}>
                        {sale.branchName || 'Main'}
                      </td>
                      <td className="px-2 py-2.5" style={{ color: Theme.mutedFg }}>
                        {sale.soldBy || 'Staff'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-xs" style={{ color: Theme.mutedFg }}>
                      {searchLog ? 'No sales found matching your search' : 'No sales recorded yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <Btn
              variant="ghost"
              disabled={historyPage <= 1 || manualSalesQuery.isFetching}
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Btn>
            <span className="text-xs" style={{ color: Theme.mutedFg }}>
              Page {historyMeta?.page || historyPage} / {historyMeta?.pages || 1}
            </span>
            <Btn
              variant="ghost"
              disabled={!!historyMeta && historyPage >= historyMeta.pages || manualSalesQuery.isFetching}
              onClick={() => setHistoryPage((p) => p + 1)}
            >
              Next
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
