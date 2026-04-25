'use client';

import React, { useRef, useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, Btn } from '../Primitives';
import {
  useListCategories,
} from '@/modules/categories/queries';
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUpdateProductStatus,
} from '@/modules/products/queries';
import { useListBranches } from '@/modules/branches/queries';
import { toast } from 'react-hot-toast';
import ImageUploader from '@/shared/components/ImageUploader';
import type { ImageUploaderRef } from '@/shared/components/ImageUploader';
import { confirmDialog } from '@/shared/lib/confirmDialog';

const inputClass = 'w-full box-border rounded-lg border border-border bg-white px-[14px] py-2.5 text-[13px] text-foreground outline-none';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground';

export default function ProductsView() {
  const { isMobile } = useResponsive();
  const [filterBranchId, setFilterBranchId] = useState('');
  const [productCategoryBranchId, setProductCategoryBranchId] = useState('');
  const productImageRef = useRef<ImageUploaderRef>(null);

  const { data: productCategories = [], isLoading: isLoadingProductCategories } = useListCategories(
    productCategoryBranchId ? { includeInactive: true, branchId: Number(productCategoryBranchId) } : undefined,
    { enabled: !!productCategoryBranchId, queryKey: ['categories', 'list', 'product-form', { branchId: productCategoryBranchId, includeInactive: true }] }
  );
  const { data: apiProducts = [], isLoading: isLoadingProducts } = useListProducts(
    { limit: 100, includeInactive: true, ...(filterBranchId ? { branchId: Number(filterBranchId) } : {}) } as any,
    { queryKey: ['products', 'list', { branchId: filterBranchId, includeInactive: true }] }
  );
  const { data: branches = [] } = useListBranches();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProductStatus = useUpdateProductStatus();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', sku: '', categoryId: '', branchId: '', price: '', costPrice: '', stock: '', description: '', image: '',
    unitType: 'PIECE' as 'PIECE' | 'WEIGHT', unitLabel: 'pc',
    sizes: [] as Array<{ name: string; imageUrl: string; priceOverride: string }>,
  });

  React.useEffect(() => {
    if (!productForm.branchId && productForm.categoryId) setProductForm(prev => ({ ...prev, categoryId: '' }));
  }, [productForm.branchId, productForm.categoryId]);

  React.useEffect(() => {
    if (!productForm.categoryId || productCategories.length === 0) return;
    if (!productCategories.some((c: any) => String(c.id) === productForm.categoryId)) setProductForm(prev => ({ ...prev, categoryId: '' }));
  }, [productCategories, productForm.categoryId]);

  const resetForm = () => {
    setProductForm({ name: '', sku: '', categoryId: '', branchId: '', price: '', costPrice: '', stock: '', description: '', image: '', unitType: 'PIECE', unitLabel: 'pc', sizes: [] });
    setShowAddProduct(false); setEditProduct(null); setProductCategoryBranchId('');
  };

  const openProductEditor = (product: any) => {
    const editBranchId = product.inventories?.[0]?.warehouseId?.toString() || '';
    setProductCategoryBranchId(editBranchId);
    setProductForm({
      name: product.name, sku: product.sku, categoryId: product.categoryId?.toString() || '', branchId: editBranchId,
      price: product.price?.toString() || '', costPrice: product.costPrice?.toString() || '', stock: '', description: product.description || '',
      image: product.images?.[0] || '', unitType: product.unitType || 'PIECE', unitLabel: product.unitLabel || 'pc',
      sizes: (product.sizes || []).map((s: any) => ({ name: s.name, imageUrl: s.imageUrl || '', priceOverride: s.priceOverride?.toString() || '' })),
    });
    setEditProduct(product.id); setShowAddProduct(true);
  };

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.categoryId || !productForm.branchId) return toast.error('Please fill all required fields');
    try {
      let imageUrl = productForm.image;
      if (productImageRef.current?.hasPending()) { const uploaded = await productImageRef.current.upload(); if (uploaded) imageUrl = uploaded; }
      const defaultImage = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop';
      const images = imageUrl ? [imageUrl] : [defaultImage];
      const sizesPayload = productForm.sizes.filter(s => s.name.trim()).map((s, i) => ({ name: s.name.trim(), sortOrder: i, imageUrl: s.imageUrl || null, priceOverride: s.priceOverride ? Number(s.priceOverride) : null }));
      const payload = { name: productForm.name, sku: productForm.sku, price: Number(productForm.price), costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined, categoryId: Number(productForm.categoryId), branchId: Number(productForm.branchId), description: productForm.description, images, unitType: productForm.unitType, unitLabel: productForm.unitLabel, sizes: sizesPayload } as any;
      if (editProduct) { await updateProduct.mutateAsync({ id: editProduct, data: payload }); toast.success('Product updated'); }
      else { await createProduct.mutateAsync(payload); toast.success('Product created'); }
      resetForm();
    } catch (error: any) { toast.error(error?.message || 'Failed to save product'); }
  };

  const handleDeleteProduct = async (id: number) => {
    if (await confirmDialog({ title: 'Delete Product?', text: 'This cannot be undone.', confirmButtonText: 'Yes, delete', icon: 'warning' })) {
      try { await deleteProduct.mutateAsync(id); toast.success('Product deleted'); } catch { toast.error('Failed to delete'); }
    }
  };

  const handleUpdateProductStatus = async (id: number, isActive: boolean) => {
    try { await updateProductStatus.mutateAsync({ id, data: { isActive } }); toast.success(`Product ${isActive ? 'activated' : 'deactivated'}`); } catch { toast.error('Failed to update status'); }
  };

  const productsList = apiProducts;

  return (
    <div className="flex flex-col gap-4">
      <Card className={isMobile ? 'p-[18px]' : 'p-7'}>
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2">
          <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
            {isLoadingProducts ? 'Loading...' : `${productsList.length} product${productsList.length !== 1 ? 's' : ''}${filterBranchId ? ` in ${branches.find((b: any) => b.id === Number(filterBranchId))?.name ?? 'branch'}` : ' across all branches'}`}
          </div>
          <div className="flex items-center gap-2">
            <select className={selectClass} value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} style={{ minWidth: 140 }}>
              <option value="">All Branches</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <Btn variant="primary" size="sm" onClick={() => { setProductCategoryBranchId(filterBranchId); setProductForm({ ...productForm, branchId: filterBranchId, categoryId: '', name: '', sku: '', price: '', costPrice: '', stock: '', description: '', image: '', unitType: 'PIECE', unitLabel: 'pc', sizes: [] }); setShowAddProduct(true); }}>＋ Add Product</Btn>
          </div>
        </div>

        {(showAddProduct || editProduct !== null) && (
          <div className="mb-4 rounded-xl border-[1.5px] p-4" style={{ borderColor: Theme.primary, background: Theme.secondary }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold" style={{ color: Theme.primary }}>{editProduct !== null ? 'Edit Product' : 'New Product'}</div>
              <button type="button" onClick={resetForm} className="cursor-pointer border-none bg-transparent text-lg leading-none" style={{ color: Theme.mutedFg }}>✕</button>
            </div>
            <div className={`grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div><label className={labelClass}>Product Name *</label><input placeholder="e.g. Rose Glow Serum" className={inputClass} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
              <div><label className={labelClass}>SKU *</label><input placeholder="e.g. SKU-019" className={inputClass} value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} /></div>
              <div><label className={labelClass}>Branch *</label><select className={selectClass} value={productForm.branchId} onChange={(e) => { setProductCategoryBranchId(e.target.value); setProductForm({ ...productForm, branchId: e.target.value, categoryId: '' }); }}><option value="">Select Branch</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className={labelClass}>Category *</label><select className={selectClass} value={productForm.categoryId} disabled={!productForm.branchId || isLoadingProductCategories} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}><option value="">{!productForm.branchId ? 'Select Branch First' : isLoadingProductCategories ? 'Loading...' : 'Select Category'}</option>{productCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className={labelClass}>Selling Price (৳) *</label><input type="number" placeholder="0" className={inputClass} value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
              <div><label className={labelClass}>Cost Price (৳)</label><input type="number" placeholder="0" className={inputClass} value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })} /></div>
              <div className={isMobile ? '' : 'col-span-2'}><label className={labelClass}>Description</label><textarea placeholder="Product description..." className={`${inputClass} h-16 resize-y`} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
              <div><label className={labelClass}>Product Image</label><ImageUploader ref={productImageRef} value={productForm.image} onChange={(url) => setProductForm({ ...productForm, image: url })} folder="mouchak/products" aspect={1} /></div>
            </div>
            <div className={`mt-3 grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div><label className={labelClass}>Unit Type *</label><select className={selectClass} value={productForm.unitType} onChange={(e) => { const ut = e.target.value as 'PIECE' | 'WEIGHT'; setProductForm({ ...productForm, unitType: ut, unitLabel: ut === 'PIECE' ? 'pc' : 'kg' }); }}><option value="PIECE">Piece</option><option value="WEIGHT">Weight</option></select></div>
              <div><label className={labelClass}>Unit Label *</label><input className={inputClass} value={productForm.unitLabel} onChange={(e) => setProductForm({ ...productForm, unitLabel: e.target.value })} placeholder="e.g. pc, kg, ml" /></div>
            </div>
            <div className="mt-3"><div className="mb-2 flex items-center justify-between"><label className={labelClass} style={{ marginBottom: 0 }}>Sizes (optional)</label><Btn variant="ghost" size="sm" onClick={() => setProductForm({ ...productForm, sizes: [...productForm.sizes, { name: '', imageUrl: '', priceOverride: '' }] })}>＋ Add Size</Btn></div>
              {productForm.sizes.length > 0 && <div className="flex flex-col gap-2">{productForm.sizes.map((size, idx) => (<div key={idx} className={`grid items-end gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}><div><label className="mb-1 block text-[10px] font-semibold text-foreground">Size Name *</label><input className={inputClass} value={size.name} onChange={(e) => { const n = [...productForm.sizes]; n[idx] = { ...n[idx], name: e.target.value }; setProductForm({ ...productForm, sizes: n }); }} placeholder="e.g. S, M, L" /></div><div><label className="mb-1 block text-[10px] font-semibold text-foreground">Price Override (৳)</label><input type="number" className={inputClass} value={size.priceOverride} onChange={(e) => { const n = [...productForm.sizes]; n[idx] = { ...n[idx], priceOverride: e.target.value }; setProductForm({ ...productForm, sizes: n }); }} placeholder="Leave empty for default" /></div><div><Btn variant="ghost" size="sm" onClick={() => setProductForm({ ...productForm, sizes: productForm.sizes.filter((_, i) => i !== idx) })}>🗑️ Remove</Btn></div></div>))}</div>}
            </div>
            <div className="mt-3 flex gap-2"><Btn variant="ghost" size="sm" onClick={resetForm}>Cancel</Btn><Btn variant="primary" size="sm" onClick={handleAddProduct}>{editProduct !== null ? 'Save Changes' : 'Create Product'}</Btn></div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {isLoadingProducts ? <div className="py-4 text-center text-sm">Loading products...</div> : productsList.length === 0 ? <div className="py-4 text-center text-sm">No products found</div> : productsList.map((p: any) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3" style={{ opacity: p.isActive ? 1 : 0.6 }}>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded text-lg" style={{ background: Theme.muted }}>{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : '📦'}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>{p.name}</span>{!p.isActive && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase">Inactive</span>}<span className="text-[11px]" style={{ color: Theme.mutedFg }}>· ৳{p.price}</span></div>
                <div className="text-[11px]" style={{ color: Theme.mutedFg }}>{p.category?.name} · Branch: {branches.find((b: any) => b.id === p.inventories?.[0]?.warehouseId)?.name || 'Default'} · SKU: {p.sku} · {p.unitType === 'WEIGHT' ? `⚖️ ${p.unitLabel}` : `📦 ${p.unitLabel}`}{p.sizes?.length > 0 ? ` · ${p.sizes.length} size(s)` : ''}</div>
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => openProductEditor(p)}>Edit</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleUpdateProductStatus(p.id, !p.isActive)}>{p.isActive ? 'Deactivate' : 'Activate'}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)}>🗑️</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
