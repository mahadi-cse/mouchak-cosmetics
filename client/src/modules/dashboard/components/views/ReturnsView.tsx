'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead, Btn } from '../Primitives';
import { Product } from '@/modules/dashboard/data/mockData';
import { useCreateManualReturnMutation, useListManualReturns } from '@/modules/manual-returns';
import { useInventorySummary } from '@/modules/inventory';
import { useListBranches } from '@/modules/branches';
import { useListProducts } from '@/modules/products';
import { useSession } from 'next-auth/react';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import toast from 'react-hot-toast';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';

interface ReturnLineItem {
  productId: number;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  total: number;
  unitType: 'PIECE' | 'WEIGHT';
  unitLabel: string;
  sizeName: string;
  sizes: Array<{ name: string; priceOverride?: number | null }>;
}

const RETURNS_BRANCH_STORAGE_KEY = 'dashboard.returns.selectedBranchId';

export default function ReturnsView() {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
  const { data: session } = useSession();
  const { data: branches = [] } = useListBranches();
  const activeBranches = branches.filter((b) => b.active);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [returnBranchId, setReturnBranchId] = useState('');
  const [lineItems, setLineItems] = useState<ReturnLineItem[]>([]);
  const [reason, setReason] = useState('');
  const [searchLog, setSearchLog] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historySortBy, setHistorySortBy] = useState<'createdAt' | 'totalAmount' | 'totalQty' | 'returnNumber'>('createdAt');
  const [historySortOrder, setHistorySortOrder] = useState<'asc' | 'desc'>('desc');
  const [branchInitialized, setBranchInitialized] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const branchInventoryQuery = useInventorySummary({ page: 1, limit: 500, warehouseId: Number(returnBranchId) });
  const createReturnMutation = useCreateManualReturnMutation();
  const manualReturnsQuery = useListManualReturns({
    page: historyPage, limit: historyLimit, search: searchLog || undefined,
    sortBy: historySortBy, sortOrder: historySortOrder,
  });

  const { data: productsMetaList = [] } = useListProducts(
    { limit: 500, ...(returnBranchId ? { branchId: Number(returnBranchId) } : {}) } as any,
    { queryKey: ['products', 'list', 'returns-meta', { branchId: returnBranchId }], enabled: !!returnBranchId }
  );
  const getProductMeta = (productId: number) => productsMetaList.find((p: any) => p.id === productId);

  const branchInventoryData = ((branchInventoryQuery as any).data?.data || []) as any[];
  const branchProducts: Product[] = branchInventoryData.map((item: any) => ({
    id: item.productId || item.product?.id,
    name: item.product?.name || 'Unknown Product',
    sku: item.product?.sku || 'N/A',
    category: 'Uncategorized',
    price: Number(item.product?.price ?? 0),
    stock: Number(item.availableQty ?? item.quantity ?? 0),
    warehouse: item.warehouse || 'N/A',
    sold: 0, manualSold: 0, status: 'active',
  }));

  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const totalQty = lineItems.reduce((sum, item) => sum + item.qty, 0);
  const totalItems = lineItems.length;

  const filteredProducts = branchProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const historyRows = manualReturnsQuery.data?.data || [];
  const historyMeta = manualReturnsQuery.data?.pagination;

  useEffect(() => {
    if (branchInitialized || activeBranches.length === 0) return;
    const saved = window.localStorage.getItem(RETURNS_BRANCH_STORAGE_KEY) || '';
    const stillActive = saved ? activeBranches.some((b) => String(b.id) === saved) : false;
    setReturnBranchId(stillActive ? saved : String(activeBranches[0].id));
    setBranchInitialized(true);
  }, [branchInitialized, activeBranches]);

  useEffect(() => {
    if (returnBranchId) window.localStorage.setItem(RETURNS_BRANCH_STORAGE_KEY, returnBranchId);
  }, [returnBranchId]);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!searchBoxRef.current?.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, []);

  useEffect(() => { setLineItems([]); setSearchQuery(''); }, [returnBranchId]);

  const handleSelectProduct = (product: Product) => {
    const meta = getProductMeta(product.id) as any;
    const unitType = meta?.unitType || 'PIECE';
    const unitLabel = meta?.unitLabel || 'pc';
    const sizes = (meta?.sizes || []).filter((s: any) => s.isActive !== false);
    const defaultSize = sizes.length > 0 ? sizes[0].name : '';

    setLineItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => i.productId !== product.id ? i : { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.unitPrice });
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, qty: 1, unitPrice: Number(product.price ?? 0), total: Number(product.price ?? 0), unitType, unitLabel, sizeName: defaultSize, sizes }];
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleConfirmReturn = async () => {
    if (lineItems.length === 0) return;
    const confirmed = await confirmDialog({
      title: t.returns.confirmReturnTitle,
      text: t.returns.confirmReturnText ? t.returns.confirmReturnText.replace('{totalItems}', totalItems.toString()).replace('{totalQty}', totalQty.toString()).replace('{totalAmount}', formatCurrency(grandTotal)) : `Return ${totalItems} product(s), ${totalQty} qty totaling ${formatCurrency(grandTotal)} to warehouse?`,
      confirmButtonText: t.returns.yesRecordReturn,
      icon: 'question',
    });
    if (!confirmed) return;

    try {
      await createReturnMutation.mutateAsync({
        returnedBy: session?.user?.name || session?.user?.email || 'Staff',
        reason: reason || t.returns.manualReturn,
        branchId: Number(returnBranchId),
        branchName: activeBranches.find((b) => b.id === Number(returnBranchId))?.name || 'Main',
        items: lineItems.map((item) => ({
          productId: item.productId, quantity: item.qty, unitPrice: item.unitPrice,
          ...(item.sizeName ? { sizeName: item.sizeName } : {}),
        })),
      });
      toast.success(t.returns.returnSuccess ? t.returns.returnSuccess.replace('{count}', lineItems.length.toString()).replace('{qty}', totalQty.toString()) : `Returned ${lineItems.length} product(s), ${totalQty} qty total`);
      setSearchQuery(''); setLineItems([]); setReason('');
    } catch {
      toast.error(t.returns.returnFailed);
    }
  };

  const updateLineItem = (index: number, patch: Partial<Pick<ReturnLineItem, 'qty' | 'unitPrice'>>) => {
    setLineItems((prev) => prev.map((item, idx) => {
      if (idx !== index) return item;
      const nextQty = patch.qty !== undefined ? Math.max(1, patch.qty) : item.qty;
      const nextPrice = patch.unitPrice !== undefined ? Math.max(0, patch.unitPrice) : item.unitPrice;
      return { ...item, qty: nextQty, unitPrice: nextPrice, total: nextQty * nextPrice };
    }));
  };

  const removeLineItem = (index: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== index));

  return (
    <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-3.5'}`}>
      {/* Return Form */}
      <Card className="border border-emerald-100 shadow-sm">
        <div className="px-3.5 py-3.5 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>{t.returns.recordReturnTitle}</div>
              <div className="text-[12px]" style={{ color: Theme.mutedFg }}>{t.returns.recordReturnDesc}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold whitespace-nowrap" style={{ color: Theme.mutedFg }}>{t.returns.branchLabel}</label>
              <select value={returnBranchId} onChange={(e) => setReturnBranchId(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm font-semibold outline-none"
                style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}>
                {activeBranches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <input type="text" placeholder={t.returns.returnReason} value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />

          {/* Search */}
          <div className="relative" ref={searchBoxRef}>
            <input type="text" placeholder={t.returns.searchProductReturn} value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-100"
              style={{ borderColor: Theme.border, color: Theme.fg }} />
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-b-lg max-h-60 overflow-y-auto z-10"
                style={{ borderColor: Theme.border, borderTop: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                  <button key={p.id} onClick={() => handleSelectProduct(p)}
                    className="w-full px-3 py-2 border-b text-left cursor-pointer text-xs flex justify-between items-center font-medium"
                    style={{ background: 'transparent', color: Theme.fg, borderColor: Theme.border }}>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs" style={{ color: Theme.mutedFg }}>{t.modal.sku}: {p.sku}</div>
                    </div>
                    <div className="text-xs ml-2" style={{ color: Theme.mutedFg }}>{t.returns.stock}: {p.stock}</div>
                  </button>
                )) : (
                  <div className="px-3 py-3 text-center text-xs" style={{ color: Theme.mutedFg }}>{t.products.noProducts}</div>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="rounded-xl border overflow-hidden bg-white" style={{ borderColor: Theme.border }}>
            {!isMobile && (
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide bg-emerald-50" style={{ color: Theme.mutedFg }}>
                <div className="col-span-4">{t.returns.product}</div>
                <div className="col-span-3 text-center">{t.suppliers.qty}</div>
                <div className="col-span-2 text-right">{t.returns.unitPrice}</div>
                <div className="col-span-2 text-right">{t.returns.lineTotal}</div>
                <div className="col-span-1 text-right"> </div>
              </div>
            )}
            {lineItems.length > 0 ? lineItems.map((item, idx) => (
              <div key={`${item.productId}-${idx}`} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-t border-gray-100 items-center hover:bg-gray-50">
                <div className="col-span-4 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: Theme.fg }}>{item.name}</div>
                  <div className="text-[10px]" style={{ color: Theme.mutedFg }}>{item.sku} · {item.unitType === 'WEIGHT' ? '⚖️' : '📦'} {item.unitLabel}</div>
                  {item.sizes.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.sizes.map((s: any) => (
                        <button key={s.name} type="button"
                          onClick={() => setLineItems((prev) => prev.map((li, i) => i !== idx ? li : { ...li, sizeName: s.name, unitPrice: s.priceOverride ? Number(s.priceOverride) : li.unitPrice, total: li.qty * (s.priceOverride ? Number(s.priceOverride) : li.unitPrice) }))}
                          className="rounded border px-1.5 py-0.5 text-[9px] font-semibold cursor-pointer"
                          style={{ borderColor: item.sizeName === s.name ? '#10b981' : Theme.border, background: item.sizeName === s.name ? '#10b981' : '#fff', color: item.sizeName === s.name ? '#fff' : Theme.fg }}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-3 flex justify-center">
                  <div className="inline-flex items-center rounded-lg border bg-white overflow-hidden" style={{ borderColor: Theme.border }}>
                    <button className="w-9 h-9 text-base font-bold flex items-center justify-center hover:bg-gray-100 disabled:opacity-30" style={{ color: Theme.fg }}
                      onClick={() => updateLineItem(idx, { qty: item.qty - 1 })} disabled={item.qty <= 1}>−</button>
                    <span className="w-px h-5 bg-gray-200" />
                    <input type="number" min={1} value={item.qty} onChange={(e) => updateLineItem(idx, { qty: Number(e.target.value) || 1 })}
                      className="w-11 text-center text-sm font-bold outline-none bg-transparent" style={{ color: Theme.fg }} />
                    <span className="w-px h-5 bg-gray-200" />
                    <button className="w-9 h-9 text-base font-bold flex items-center justify-center hover:bg-gray-100" style={{ color: Theme.fg }}
                      onClick={() => updateLineItem(idx, { qty: item.qty + 1 })}>+</button>
                  </div>
                </div>
                <div className="col-span-2">
                  <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateLineItem(idx, { unitPrice: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border rounded text-xs text-right outline-none bg-white" style={{ borderColor: Theme.border }} />
                </div>
                <div className="col-span-2 text-right text-xs font-bold" style={{ color: '#10b981' }}>{formatCurrency(item.total)}</div>
                <div className="col-span-1 text-right">
                  <button onClick={() => removeLineItem(idx)} className="text-xs font-bold px-1.5 py-1 rounded" style={{ color: '#dc2626' }}>✕</button>
                </div>
              </div>
            )) : (
              <div className="px-3 py-5 text-center text-xs" style={{ color: Theme.mutedFg }}>{t.returns.noProductsAddedReturn}</div>
            )}
          </div>

          {/* Footer */}
          <div className={`pt-1 ${isMobile ? 'space-y-1.5' : 'flex items-center justify-between'}`}>
            <div className="text-xs" style={{ color: Theme.mutedFg }}>
              <span className="font-semibold">{t.returns.items}: {totalItems}</span><span className="mx-2">•</span><span className="font-semibold">{t.suppliers.qty}: {totalQty}</span>
            </div>
            <div className="text-sm font-black" style={{ color: '#10b981' }}>{t.returns.returnTotal}: {formatCurrency(grandTotal)}</div>
          </div>

          <div className={`flex gap-2 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
            <Btn variant="ghost" onClick={() => { setSearchQuery(''); setShowDropdown(false); setLineItems([]); setReason(''); }} className={isMobile ? 'w-full' : ''}>{t.suppliers.reset}</Btn>
            <Btn variant="primary" disabled={lineItems.length === 0 || createReturnMutation.isPending} onClick={handleConfirmReturn} className={isMobile ? 'w-full' : ''}>
              {createReturnMutation.isPending ? t.returns.recordingReturn : `${t.returns.recordReturnBtn} · ${formatCurrency(grandTotal)}`}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Return History */}
      <Card>
        <SecHead title={t.returns.returnHistory} sub={`${t.returns.totalReturns}: ${historyMeta?.total ?? 0}`} />
        <div className="p-3.5">
          <div className="mb-3 grid gap-2 md:grid-cols-3">
            <input type="text" placeholder={t.returns.searchReturnHistory} value={searchLog}
              onChange={(e) => { setSearchLog(e.target.value); setHistoryPage(1); }}
              className="w-full px-3 py-2 border rounded text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
            <select value={historySortBy} onChange={(e) => { setHistorySortBy(e.target.value as any); setHistoryPage(1); }}
              className="w-full px-3 py-2 border rounded text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}>
              <option value="createdAt">{t.returns.sortDate}</option>
              <option value="returnNumber">{t.returns.sortReturnId}</option>
              <option value="totalQty">{t.returns.sortQty}</option>
              <option value="totalAmount">{t.returns.sortAmount}</option>
            </select>
            <div className="flex gap-2">
              <select value={historySortOrder} onChange={(e) => { setHistorySortOrder(e.target.value as 'asc' | 'desc'); setHistoryPage(1); }}
                className="w-1/2 px-3 py-2 border rounded text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}>
                <option value="desc">{t.returns.desc}</option><option value="asc">{t.returns.asc}</option>
              </select>
              <select value={historyLimit} onChange={(e) => { setHistoryLimit(Number(e.target.value)); setHistoryPage(1); }}
                className="w-1/2 px-3 py-2 border rounded text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg, background: '#fff' }}>
                <option value={10}>10 {t.returns.perPage}</option><option value={20}>20 {t.returns.perPage}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2" style={{ borderColor: Theme.border }}>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>{t.returns.returnId}</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>{t.returns.product}</th>
                  <th className="px-2 py-2 font-bold text-center" style={{ color: Theme.mutedFg }}>{t.suppliers.qty}</th>
                  <th className="px-2 py-2 font-bold text-right" style={{ color: Theme.mutedFg }}>{t.suppliers.amount}</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>{t.suppliers.date}</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>{t.sales.branch}</th>
                  <th className="px-2 py-2 font-bold text-left" style={{ color: Theme.mutedFg }}>{t.suppliers.by}</th>
                </tr>
              </thead>
              <tbody>
                {manualReturnsQuery.isLoading ? (
                  <tr><td colSpan={7} className="px-2 py-6 text-center text-xs" style={{ color: Theme.mutedFg }}>{t.returns.loadingReturns}</td></tr>
                ) : historyRows.length > 0 ? historyRows.map((ret) => (
                  <tr key={ret.returnNumber} className="border-b" style={{ borderColor: Theme.border }}>
                    <td className="px-2 py-2.5 font-semibold" style={{ color: '#10b981' }}>{ret.returnNumber}</td>
                    <td className="px-2 py-2.5" style={{ color: Theme.fg }}>
                      {ret.items?.length > 1 ? `${ret.items[0]?.productNameSnapshot || 'Item'} +${ret.items.length - 1} more` : ret.items?.[0]?.productNameSnapshot || 'Item'}
                    </td>
                    <td className="px-2 py-2.5 text-center font-semibold" style={{ color: Theme.fg }}>{ret.totalQty}</td>
                    <td className="px-2 py-2.5 text-right font-bold" style={{ color: '#10b981' }}>{formatCurrency(ret.totalAmount)}</td>
                    <td className="px-2 py-2.5 text-xs" style={{ color: Theme.mutedFg }}>{new Date(ret.createdAt).toLocaleDateString()}</td>
                    <td className="px-2 py-2.5" style={{ color: Theme.mutedFg }}>{ret.branchName || 'Main'}</td>
                    <td className="px-2 py-2.5" style={{ color: Theme.mutedFg }}>{ret.returnedBy || 'Staff'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-2 py-6 text-center text-xs" style={{ color: Theme.mutedFg }}>{searchLog ? t.returns.noReturnsFound : t.returns.noReturnsRecorded}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <Btn variant="ghost" disabled={historyPage <= 1 || manualReturnsQuery.isFetching} onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}>{t.returns.prev}</Btn>
            <span className="text-xs" style={{ color: Theme.mutedFg }}>{t.returns.page} {historyMeta?.page || historyPage} / {historyMeta?.pages || 1}</span>
            <Btn variant="ghost" disabled={!!historyMeta && historyPage >= historyMeta.pages || manualReturnsQuery.isFetching} onClick={() => setHistoryPage((p) => p + 1)}>{t.returns.next}</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
