'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, Btn } from '../Primitives';
import {
  useListCategories,
} from '@/modules/categories';
import {
  useListProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct
} from '@/modules/products';
import { useListBranches } from '@/modules/branches';
import { toast } from 'react-hot-toast';
import ImageUploader from '@/shared/components/ImageUploader';
import type { ImageUploaderRef } from '@/shared/components/ImageUploader';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const inputClass = 'w-full box-border rounded-lg border border-border bg-white px-[14px] py-2.5 text-[13px] text-foreground outline-none';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground';

const productSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  sku: z.string().min(1, "SKU is required"),
  branchId: z.string().min(1, "Branch is required"),
  categoryId: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  costPrice: z.string(),
  description: z.string(),
  image: z.string(),
  unitType: z.enum(['PIECE', 'WEIGHT']),
  unitLabel: z.string(),
  sizes: z.array(z.object({
    name: z.string().min(1, "Size Name is required"),
    priceOverride: z.string(),
    imageUrl: z.string(),
  })),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsView() {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSavingProduct = createProduct.isPending || updateProduct.isPending || isSubmitting;

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<number | null>(null);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', sku: '', categoryId: '', branchId: '', price: '', costPrice: '', description: '', image: '',
      unitType: 'PIECE', unitLabel: 'pc', sizes: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sizes'
  });

  const watchBranchId = watch('branchId');
  const watchCategoryId = watch('categoryId');
  const watchImage = watch('image');
  const watchUnitType = watch('unitType');

  useEffect(() => {
    if (!watchBranchId && watchCategoryId) {
      setValue('categoryId', '');
    }
    setProductCategoryBranchId(watchBranchId || '');
  }, [watchBranchId, watchCategoryId, setValue]);

  useEffect(() => {
    if (!watchCategoryId || productCategories.length === 0) return;
    if (!productCategories.some((c: any) => String(c.id) === watchCategoryId)) {
      setValue('categoryId', '');
    }
  }, [productCategories, watchCategoryId, setValue]);

  const resetForm = () => {
    reset({
      name: '', sku: '', categoryId: '', branchId: '', price: '', costPrice: '', description: '', image: '',
      unitType: 'PIECE', unitLabel: 'pc', sizes: []
    });
    setShowAddProduct(false); setEditProduct(null); setProductCategoryBranchId('');
  };

  const openProductEditor = (product: any) => {
    const editBranchId = product.inventories?.[0]?.warehouseId?.toString() || '';
    setProductCategoryBranchId(editBranchId);
    reset({
      name: product.name, sku: product.sku, categoryId: product.categoryId?.toString() || '', branchId: editBranchId,
      price: product.price?.toString() || '', costPrice: product.costPrice?.toString() || '', description: product.description || '',
      image: product.images?.[0] || '', unitType: product.unitType || 'PIECE', unitLabel: product.unitLabel || 'pc',
      sizes: (product.sizes || []).map((s: any) => ({ name: s.name, imageUrl: s.imageUrl || '', priceOverride: s.priceOverride?.toString() || '' })),
    });
    setEditProduct(product.id); setShowAddProduct(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    
    const savePromise = (async () => {
      let imageUrl = data.image;
      if (productImageRef.current?.hasPending()) { const uploaded = await productImageRef.current.upload(); if (uploaded) imageUrl = uploaded; }
      const defaultImage = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=800&auto=format&fit=crop';
      const images = imageUrl ? [imageUrl] : [defaultImage];
      const sizesPayload = data.sizes.filter(s => s.name.trim()).map((s, i) => ({ name: s.name.trim(), sortOrder: i, imageUrl: s.imageUrl || null, priceOverride: s.priceOverride ? Number(s.priceOverride) : null }));
      const payload = { name: data.name, sku: data.sku, price: Number(data.price), costPrice: data.costPrice ? Number(data.costPrice) : undefined, categoryId: Number(data.categoryId), branchId: Number(data.branchId), description: data.description, images, unitType: data.unitType, unitLabel: data.unitLabel, sizes: sizesPayload } as any;
      if (editProduct) { await updateProduct.mutateAsync({ id: editProduct, ...payload }); }
      else { await createProduct.mutateAsync(payload); }
      resetForm();
    })();

    toast.promise(savePromise, {
      loading: editProduct ? 'Updating product...' : 'Creating product...',
      success: editProduct ? t.products.productUpdated : t.products.productCreated,
      error: (err: any) => err?.message || t.products.failedSave,
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  const handleDeleteProduct = async (id: number) => {
    if (await confirmDialog({ title: t.products.deleteConfirmTitle, text: t.products.deleteConfirmText, confirmButtonText: t.products.yesDelete, icon: 'warning' })) {
      try { await deleteProduct.mutateAsync(id); toast.success(t.products.productDeleted); } catch { toast.error(t.products.failedDelete); }
    }
  };

  const handleUpdateProductStatus = async (id: number, isActive: boolean) => {
    try { await updateProduct.mutateAsync({ id, isActive } as any); toast.success(isActive ? t.products.productActivated : t.products.productDeactivated); } catch { toast.error(t.products.failedStatusUpdate); }
  };

  const productsList = apiProducts;

  return (
    <div className="flex flex-col gap-4">
      <Card className={isMobile ? 'p-[18px]' : 'p-7'}>
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2">
          <div className="text-[13px]" style={{ color: Theme.mutedFg }}>
            {isLoadingProducts ? t.products.loadingProducts : `${productsList.length} ${t.products.product}${productsList.length !== 1 ? 's' : ''}${filterBranchId ? ` ${t.products.inBranch} ${branches.find((b: any) => b.id === Number(filterBranchId))?.name ?? t.sales.branch.replace(' *', '')}` : ` ${t.products.acrossBranches}`}`}
          </div>
          <div className="flex items-center gap-2">
            <select className={selectClass} value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} style={{ minWidth: 140 }}>
              <option value="">{t.products.allBranches}</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <Btn variant="primary" size="sm" onClick={() => { setProductCategoryBranchId(filterBranchId); reset({ branchId: filterBranchId, categoryId: '', name: '', sku: '', price: '', costPrice: '', description: '', image: '', unitType: 'PIECE', unitLabel: 'pc', sizes: [] }); setShowAddProduct(true); }}>{t.products.addProduct}</Btn>
          </div>
        </div>

        {(showAddProduct || editProduct !== null) && (
          <form onSubmit={handleSubmit(onSubmit)} className="mb-4 rounded-xl border-[1.5px] p-4" style={{ borderColor: Theme.primary, background: Theme.secondary }}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold" style={{ color: Theme.primary }}>{editProduct !== null ? t.products.editProduct : t.products.newProduct}</div>
              <button type="button" onClick={resetForm} className="cursor-pointer border-none bg-transparent text-lg leading-none" style={{ color: Theme.mutedFg }}>✕</button>
            </div>
            <div className={`grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div>
                <label className={labelClass}>{t.products.productName} <span className="text-red-500">*</span></label>
                <input {...register('name')} placeholder="e.g. Rose Glow Serum" className={`${inputClass} transition-colors ${errors.name ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: !errors.name ? Theme.border : undefined }} />
                {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
              </div>
              <div>
                <label className={labelClass}>{t.products.sku} <span className="text-red-500">*</span></label>
                <input {...register('sku')} placeholder="e.g. SKU-019" className={`${inputClass} transition-colors ${errors.sku ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: !errors.sku ? Theme.border : undefined }} />
                {errors.sku && <span className="text-xs text-red-500 mt-1 block">{errors.sku.message}</span>}
              </div>
              <div>
                <label className={labelClass}>{t.products.branch} <span className="text-red-500">*</span></label>
                <select {...register('branchId')} className={`${selectClass} transition-colors ${errors.branchId ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: !errors.branchId ? Theme.border : undefined }}>
                  <option value="">{t.products.selectBranch}</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branchId && <span className="text-xs text-red-500 mt-1 block">{errors.branchId.message}</span>}
              </div>
              <div>
                <label className={labelClass}>{t.products.category} <span className="text-red-500">*</span></label>
                <select {...register('categoryId')} className={`${selectClass} transition-colors ${errors.categoryId ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: !errors.categoryId ? Theme.border : undefined }} disabled={!watchBranchId || isLoadingProductCategories}>
                  <option value="">{!watchBranchId ? t.products.selectBranchFirst : isLoadingProductCategories ? t.products.loading : t.products.selectCategory}</option>
                  {productCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.categoryId && <span className="text-xs text-red-500 mt-1 block">{errors.categoryId.message}</span>}
              </div>
              <div>
                <label className={labelClass}>{t.products.sellingPrice} <span className="text-red-500">*</span></label>
                <input {...register('price')} type="number" placeholder="0" className={`${inputClass} transition-colors ${errors.price ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: !errors.price ? Theme.border : undefined }} />
                {errors.price && <span className="text-xs text-red-500 mt-1 block">{errors.price.message}</span>}
              </div>
              <div>
                <label className={labelClass}>{t.products.costPrice}</label>
                <input {...register('costPrice')} type="number" placeholder="0" className={inputClass} style={{ borderColor: Theme.border }} />
              </div>
              <div className={isMobile ? '' : 'col-span-2'}>
                <label className={labelClass}>{t.products.description}</label>
                <textarea {...register('description')} placeholder="..." className={`${inputClass} h-16 resize-y`} style={{ borderColor: Theme.border }} />
              </div>
              <div>
                <label className={labelClass}>{t.products.productImage}</label>
                <ImageUploader ref={productImageRef} value={watchImage} onChange={(url) => setValue('image', url)} folder="mouchak/products" aspect={1} />
              </div>
            </div>
            <div className={`mt-3 grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div>
                <label className={labelClass}>{t.products.unitType}</label>
                <select {...register('unitType', { onChange: (e: any) => setValue('unitLabel', e.target.value === 'PIECE' ? 'pc' : 'kg') })} className={selectClass}>
                  <option value="PIECE">{t.products.piece}</option>
                  <option value="WEIGHT">{t.products.weight}</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>{t.products.unitLabel}</label>
                <input {...register('unitLabel')} placeholder="e.g. pc, kg, ml" className={inputClass} />
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass} style={{ marginBottom: 0 }}>{t.products.sizesOptional}</label>
                <Btn type="button" variant="ghost" size="sm" onClick={() => append({ name: '', imageUrl: '', priceOverride: '' })}>{t.products.addSize}</Btn>
              </div>
              {fields.length > 0 && (
                <div className="flex flex-col gap-2">
                  {fields.map((field: any, idx: number) => (
                    <div key={field.id} className={`grid items-end gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-foreground">{t.products.sizeName}</label>
                        <input {...register(`sizes.${idx}.name` as const)} className={inputClass} placeholder="e.g. S, M, L" />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-foreground">{t.products.priceOverride}</label>
                        <input {...register(`sizes.${idx}.priceOverride` as const)} type="number" className={inputClass} placeholder={t.products.leaveEmpty} />
                      </div>
                      <div>
                        <Btn type="button" variant="ghost" size="sm" onClick={() => remove(idx)}>{t.products.remove}</Btn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Btn type="button" variant="ghost" size="sm" onClick={resetForm} disabled={isSavingProduct}>{t.products.cancel}</Btn>
              <Btn type="submit" variant="primary" size="sm" loading={isSavingProduct}>{editProduct !== null ? t.products.saveChanges : t.products.createProduct}</Btn>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-2.5">
          {isLoadingProducts ? <div className="py-4 text-center text-sm">{t.products.loadingProducts}</div> : productsList.length === 0 ? <div className="py-4 text-center text-sm">{t.products.noProducts}</div> : productsList.map((p: any) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3" style={{ opacity: p.isActive ? 1 : 0.6 }}>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded text-lg" style={{ background: Theme.muted }}>{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" /> : '📦'}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>{p.name}</span>{!p.isActive && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase">{t.products.inactive}</span>}<span className="text-[11px]" style={{ color: Theme.mutedFg }}>· ৳{p.price}</span></div>
                <div className="text-[11px]" style={{ color: Theme.mutedFg }}>{p.category?.name || t.uncategorized} · {t.sales.branch}: {branches.find((b: any) => b.id === p.inventories?.[0]?.warehouseId)?.name || 'Default'} · {t.modal.sku}: {p.sku} · {p.unitType === 'WEIGHT' ? `⚖️ ${p.unitLabel}` : `📦 ${p.unitLabel}`}{p.sizes?.length > 0 ? ` · ${p.sizes.length} ${t.products.sizeS}` : ''}</div>
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => openProductEditor(p)}>{t.inventory.edit}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleUpdateProductStatus(p.id, !p.isActive)}>{p.isActive ? t.products.deactivate : t.products.activate}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleDeleteProduct(p.id)}>🗑️</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
