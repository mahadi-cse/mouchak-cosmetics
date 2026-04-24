'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Theme, formatCurrency } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, SecHead, Btn } from '../Primitives';
import { useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useSupplierTransactions, useCreateSupplierTransaction } from '@/modules/suppliers';
import type { Supplier } from '@/modules/suppliers';
import { useInventorySummary } from '@/modules/inventory';
import { useListBranches } from '@/modules/branches';
import { useSession } from 'next-auth/react';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import toast from 'react-hot-toast';

interface TxnLineItem { productId: number; name: string; sku: string; qty: number; unitPrice: number; total: number; }

export default function SuppliersView() {
  const { isMobile } = useResponsive();
  const { data: session } = useSession();
  const { data: branches = [] } = useListBranches();
  const activeBranches = branches.filter((b: any) => b.active);

  // Supplier list
  const [supplierSearch, setSupplierSearch] = useState('');
  const suppliersQuery = useListSuppliers({ search: supplierSearch || undefined, includeInactive: true });
  const suppliers = suppliersQuery.data?.data || [];
  const createSupplierMut = useCreateSupplier();
  const updateSupplierMut = useUpdateSupplier();
  const deleteSupplierMut = useDeleteSupplier();

  // Supplier form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', rotationDays: '' });

  // Transaction form
  const [txnOpen, setTxnOpen] = useState(false);
  const [txnSupplierId, setTxnSupplierId] = useState('');
  const [txnBranchId, setTxnBranchId] = useState('');
  const [txnDirection, setTxnDirection] = useState<'DUE_TO_SUPPLIER' | 'DUE_TO_US'>('DUE_TO_SUPPLIER');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDate, setTxnDate] = useState('');
  const [txnNote, setTxnNote] = useState('');
  const [txnItems, setTxnItems] = useState<TxnLineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef<HTMLDivElement | null>(null);
  const createTxnMut = useCreateSupplierTransaction();

  // Transaction history
  const [histSearch, setHistSearch] = useState('');
  const [histPage, setHistPage] = useState(1);
  const txnQuery = useSupplierTransactions({ page: histPage, limit: 15, search: histSearch || undefined });
  const txnRows = txnQuery.data?.data || [];
  const txnMeta = txnQuery.data?.pagination;

  // Product search for transaction items
  const branchInventoryQuery = useInventorySummary({ page: 1, limit: 500, ...(txnBranchId ? { warehouseId: Number(txnBranchId) } : {}) });
  const branchProducts = ((branchInventoryQuery as any).data?.data || []).map((item: any) => ({
    id: item.productId || item.product?.id, name: item.product?.name || 'Unknown', sku: item.product?.sku || 'N/A', price: Number(item.product?.price ?? 0),
  }));
  const filteredProducts = branchProducts.filter((p: any) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()));

  useEffect(() => { const h = (e: MouseEvent | TouchEvent) => { if (!productSearchRef.current?.contains(e.target as Node)) setShowProductDropdown(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);

  const handleSaveSupplier = async () => {
    if (!form.name.trim()) return toast.error('Supplier name is required');
    try {
      if (editId) { await updateSupplierMut.mutateAsync({ id: editId, data: { name: form.name, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, rotationDays: form.rotationDays ? Number(form.rotationDays) : undefined } }); toast.success('Supplier updated'); }
      else { await createSupplierMut.mutateAsync({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, rotationDays: form.rotationDays ? Number(form.rotationDays) : undefined }); toast.success('Supplier created'); }
      setShowForm(false); setEditId(null); setForm({ name: '', email: '', phone: '', address: '', rotationDays: '' });
    } catch { toast.error('Failed to save supplier'); }
  };

  const handleDeleteSupplier = async (id: number) => {
    const ok = await confirmDialog({ title: 'Delete Supplier?', text: 'This will delete the supplier and all their transactions.', confirmButtonText: 'Yes, delete', icon: 'warning' });
    if (!ok) return;
    try { await deleteSupplierMut.mutateAsync(id); toast.success('Supplier deleted'); } catch { toast.error('Failed to delete'); }
  };

  const handleRecordTransaction = async () => {
    if (!txnSupplierId) return toast.error('Select a supplier');
    const amount = txnItems.length > 0 ? txnItems.reduce((s, i) => s + i.total, 0) : Number(txnAmount);
    if (amount <= 0 && txnItems.length === 0) return toast.error('Enter amount or add items');
    const ok = await confirmDialog({ title: 'Record Transaction?', text: `${txnDirection === 'DUE_TO_SUPPLIER' ? 'Due to supplier' : 'Supplier owes us'}: ${formatCurrency(amount)}`, confirmButtonText: 'Yes, record', icon: 'question' });
    if (!ok) return;
    try {
      await createTxnMut.mutateAsync({
        supplierId: Number(txnSupplierId), branchId: txnBranchId ? Number(txnBranchId) : undefined,
        branchName: activeBranches.find((b: any) => b.id === Number(txnBranchId))?.name, direction: txnDirection, totalAmount: amount,
        transactionDate: txnDate || undefined, note: txnNote || undefined, recordedBy: session?.user?.name || session?.user?.email || 'Staff',
        items: txnItems.length > 0 ? txnItems.map(i => ({ productId: i.productId, quantity: i.qty, unitPrice: i.unitPrice })) : undefined,
      });
      toast.success('Transaction recorded'); setTxnOpen(false); setTxnItems([]); setTxnAmount(''); setTxnNote(''); setProductSearch('');
    } catch { toast.error('Failed to record transaction'); }
  };

  const addProductToTxn = (p: any) => {
    setTxnItems(prev => { const ex = prev.find(i => i.productId === p.id); if (ex) return prev.map(i => i.productId !== p.id ? i : { ...i, qty: i.qty + 1, total: (i.qty + 1) * i.unitPrice }); return [...prev, { productId: p.id, name: p.name, sku: p.sku, qty: 1, unitPrice: p.price, total: p.price }]; });
    setProductSearch(''); setShowProductDropdown(false);
  };

  const txnGrandTotal = txnItems.reduce((s, i) => s + i.total, 0);
  const [activeTab, setActiveTab] = useState<'transaction' | 'suppliers'>('transaction');

  return (
    <div className="flex flex-col gap-3.5">
      {/* Tab bar — Material style */}
      <div className="flex border-b" style={{ borderColor: Theme.border }}>
        {([
          { id: 'transaction' as const, label: '📝 Record Transaction' },
          { id: 'suppliers' as const, label: '🏭 Suppliers' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="relative cursor-pointer border-none bg-transparent px-4 py-2.5 text-sm font-semibold transition-colors"
            style={{ color: activeTab === t.id ? Theme.primary : Theme.mutedFg }}
          >
            {t.label}
            {activeTab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full" style={{ background: Theme.primary }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab: Record Transaction */}
      {activeTab === 'transaction' && (
        <Card className="border border-blue-100">
          <div className="px-3.5 py-3.5 flex flex-col gap-3">
            <div>
              <div className="text-[15px] font-bold" style={{ color: Theme.fg }}>📝 Record Transaction</div>
              <div className="text-[12px]" style={{ color: Theme.mutedFg }}>Log supplier payments and item deliveries</div>
            </div>
            <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
              <select value={txnSupplierId} onChange={(e) => setTxnSupplierId(e.target.value)} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }}>
                <option value="">Select Supplier *</option>
                {suppliers.filter((s: Supplier) => s.isActive).map((s: Supplier) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={txnBranchId} onChange={(e) => setTxnBranchId(e.target.value)} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }}>
                <option value="">Branch (optional)</option>
                {activeBranches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={txnDirection} onChange={(e) => setTxnDirection(e.target.value as any)} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }}>
                <option value="DUE_TO_SUPPLIER">Due to Supplier</option>
                <option value="DUE_TO_US">Supplier Owes Us</option>
              </select>
              <input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
            </div>
            <input value={txnNote} onChange={(e) => setTxnNote(e.target.value)} placeholder="Note (optional)" className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
            <div className="relative" ref={productSearchRef}>
              <input type="text" placeholder="Search product to add items..." value={productSearch}
                onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }} onFocus={() => setShowProductDropdown(true)}
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
              {showProductDropdown && productSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-b-lg max-h-48 overflow-y-auto z-10" style={{ borderColor: Theme.border, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {filteredProducts.length > 0 ? filteredProducts.slice(0, 20).map((p: any) => (
                    <button key={p.id} onClick={() => addProductToTxn(p)} className="w-full px-3 py-2 border-b text-left cursor-pointer text-xs flex justify-between" style={{ color: Theme.fg, borderColor: Theme.border }}>
                      <div><div className="font-semibold">{p.name}</div><div className="text-[10px]" style={{ color: Theme.mutedFg }}>SKU: {p.sku}</div></div>
                      <div className="text-[10px]" style={{ color: Theme.mutedFg }}>৳{p.price}</div>
                    </button>
                  )) : <div className="px-3 py-2 text-xs" style={{ color: Theme.mutedFg }}>No products found</div>}
                </div>
              )}
            </div>
            {txnItems.length > 0 && (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: Theme.border }}>
                <div className="grid grid-cols-12 gap-1 px-3 py-1.5 text-[9px] font-bold uppercase bg-blue-50" style={{ color: Theme.mutedFg }}>
                  <div className="col-span-4">Product</div><div className="col-span-2 text-center">Qty</div><div className="col-span-2 text-right">Price</div><div className="col-span-3 text-right">Total</div><div className="col-span-1" />
                </div>
                {txnItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1 px-3 py-2 border-t items-center text-xs" style={{ borderColor: Theme.border }}>
                    <div className="col-span-4 truncate font-semibold" style={{ color: Theme.fg }}>{item.name}<div className="text-[9px]" style={{ color: Theme.mutedFg }}>{item.sku}</div></div>
                    <div className="col-span-2 flex justify-center">
                      <input type="number" min={1} value={item.qty} onChange={(e) => setTxnItems(prev => prev.map((it, i) => i !== idx ? it : { ...it, qty: Math.max(1, Number(e.target.value) || 1), total: Math.max(1, Number(e.target.value) || 1) * it.unitPrice }))}
                        className="w-12 text-center border rounded py-0.5 text-xs outline-none" style={{ borderColor: Theme.border }} />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min={0} value={item.unitPrice} onChange={(e) => setTxnItems(prev => prev.map((it, i) => i !== idx ? it : { ...it, unitPrice: Number(e.target.value) || 0, total: it.qty * (Number(e.target.value) || 0) }))}
                        className="w-full text-right border rounded py-0.5 text-xs outline-none" style={{ borderColor: Theme.border }} />
                    </div>
                    <div className="col-span-3 text-right font-bold" style={{ color: '#2563eb' }}>{formatCurrency(item.total)}</div>
                    <div className="col-span-1 text-right"><button onClick={() => setTxnItems(prev => prev.filter((_, i) => i !== idx))} className="text-xs" style={{ color: '#dc2626' }}>✕</button></div>
                  </div>
                ))}
                <div className="px-3 py-1.5 text-right text-xs font-black border-t" style={{ borderColor: Theme.border, color: '#2563eb' }}>Total: {formatCurrency(txnGrandTotal)}</div>
              </div>
            )}
            {txnItems.length === 0 && (
              <input type="number" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} placeholder="Amount (৳) — or add items above" className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
            )}
            <div className="flex gap-2 justify-end">
              <Btn variant="ghost" onClick={() => { setTxnItems([]); setTxnAmount(''); setTxnNote(''); setProductSearch(''); }}>Reset</Btn>
              <Btn variant="primary" disabled={createTxnMut.isPending} onClick={handleRecordTransaction}>
                {createTxnMut.isPending ? 'Recording...' : `Record · ${formatCurrency(txnItems.length > 0 ? txnGrandTotal : Number(txnAmount) || 0)}`}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {/* Tab: Suppliers */}
      {activeTab === 'suppliers' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <SecHead title="Suppliers" sub={`${suppliers.length} supplier(s)`} />
            <div className="flex items-center gap-2">
              <input value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} placeholder="Search suppliers..." className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
              <Btn variant="primary" size="sm" onClick={() => { setEditId(null); setForm({ name: '', email: '', phone: '', address: '', rotationDays: '' }); setShowForm(true); }}>＋ Add Supplier</Btn>
            </div>
          </div>
          {showForm && (
            <div className="mb-3 rounded-xl border-[1.5px] p-3" style={{ borderColor: Theme.primary, background: '#fdf2f8' }}>
              <div className="text-sm font-bold mb-2" style={{ color: Theme.primary }}>{editId ? 'Edit Supplier' : 'New Supplier'}</div>
              <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name *" className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border }} />
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="rounded-lg border px-3 py-2 text-xs outline-none col-span-2" style={{ borderColor: Theme.border }} />
                <input type="number" value={form.rotationDays} onChange={(e) => setForm({ ...form, rotationDays: e.target.value })} placeholder="Rotation (days)" className="rounded-lg border px-3 py-2 text-xs outline-none" style={{ borderColor: Theme.border }} />
              </div>
              <div className="flex gap-2 mt-2">
                <Btn variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Btn>
                <Btn variant="primary" size="sm" onClick={handleSaveSupplier}>{editId ? 'Save' : 'Create'}</Btn>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {suppliers.map((s: Supplier) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderColor: Theme.border, opacity: s.isActive ? 1 : 0.5 }}>
                <div>
                  <div className="text-xs font-bold" style={{ color: Theme.fg }}>{s.name} {!s.isActive && <span className="text-[9px] text-gray-400 ml-1">Inactive</span>}</div>
                  <div className="text-[10px]" style={{ color: Theme.mutedFg }}>{[s.email, s.phone, s.address, s.rotationDays ? `${s.rotationDays}d rotation` : ''].filter(Boolean).join(' · ') || 'No details'}</div>
                </div>
                <div className="flex gap-1.5">
                  <Btn variant="ghost" size="sm" onClick={() => { setEditId(s.id); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', rotationDays: s.rotationDays?.toString() || '' }); setShowForm(true); }}>Edit</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => handleDeleteSupplier(s.id)}>🗑️</Btn>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && <div className="text-center text-xs py-4" style={{ color: Theme.mutedFg }}>No suppliers found</div>}
          </div>
        </Card>
      )}

      {/* Transaction History — always visible */}
      <Card>
        <SecHead title="Transaction History" sub={`${txnMeta?.total ?? 0} transactions`} />
        <div className="p-3.5">
          <input value={histSearch} onChange={(e) => { setHistSearch(e.target.value); setHistPage(1); }} placeholder="Search transactions..." className="w-full mb-3 px-3 py-2 border rounded text-xs outline-none" style={{ borderColor: Theme.border, color: Theme.fg }} />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead><tr className="border-b-2" style={{ borderColor: Theme.border }}>
                <th className="px-2 py-2 text-left font-bold" style={{ color: Theme.mutedFg }}>Supplier</th>
                <th className="px-2 py-2 text-left font-bold" style={{ color: Theme.mutedFg }}>Type</th>
                <th className="px-2 py-2 text-left font-bold" style={{ color: Theme.mutedFg }}>Items</th>
                <th className="px-2 py-2 text-right font-bold" style={{ color: Theme.mutedFg }}>Amount</th>
                <th className="px-2 py-2 text-left font-bold" style={{ color: Theme.mutedFg }}>Date</th>
                <th className="px-2 py-2 text-left font-bold" style={{ color: Theme.mutedFg }}>Branch</th>
                <th className="px-2 py-2 text-left font-bold" style={{ color: Theme.mutedFg }}>By</th>
              </tr></thead>
              <tbody>
                {txnQuery.isLoading ? (
                  <tr><td colSpan={7} className="px-2 py-6 text-center" style={{ color: Theme.mutedFg }}>Loading...</td></tr>
                ) : txnRows.length > 0 ? txnRows.map((t: any) => (
                  <tr key={t.id} className="border-b" style={{ borderColor: Theme.border }}>
                    <td className="px-2 py-2 font-semibold" style={{ color: Theme.fg }}>{t.supplier?.name || 'N/A'}</td>
                    <td className="px-2 py-2">
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ background: t.direction === 'DUE_TO_SUPPLIER' ? '#fef2f2' : '#f0fdf4', color: t.direction === 'DUE_TO_SUPPLIER' ? '#dc2626' : '#16a34a' }}>
                        {t.direction === 'DUE_TO_SUPPLIER' ? '↑ Due' : '↓ Owed'}
                      </span>
                    </td>
                    <td className="px-2 py-2" style={{ color: Theme.mutedFg }}>
                      {t.items?.length > 0 ? (t.items.length === 1 ? t.items[0].productNameSnapshot : `${t.items[0].productNameSnapshot} +${t.items.length - 1}`) : '—'}
                    </td>
                    <td className="px-2 py-2 text-right font-bold" style={{ color: t.direction === 'DUE_TO_SUPPLIER' ? '#dc2626' : '#16a34a' }}>{formatCurrency(t.totalAmount)}</td>
                    <td className="px-2 py-2" style={{ color: Theme.mutedFg }}>{new Date(t.transactionDate || t.createdAt).toLocaleDateString()}</td>
                    <td className="px-2 py-2" style={{ color: Theme.mutedFg }}>{t.branchName || '—'}</td>
                    <td className="px-2 py-2" style={{ color: Theme.mutedFg }}>{t.recordedBy || 'Staff'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="px-2 py-6 text-center" style={{ color: Theme.mutedFg }}>No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Btn variant="ghost" disabled={histPage <= 1} onClick={() => setHistPage(p => Math.max(1, p - 1))}>Prev</Btn>
            <span className="text-xs" style={{ color: Theme.mutedFg }}>Page {txnMeta?.page || histPage} / {txnMeta?.pages || 1}</span>
            <Btn variant="ghost" disabled={!!txnMeta && histPage >= txnMeta.pages} onClick={() => setHistPage(p => p + 1)}>Next</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}
