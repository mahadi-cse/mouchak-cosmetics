'use client';

import React, { useRef, useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { Card, Btn } from '../Primitives';
import { useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useUpdateCategoryStatus } from '@/modules/categories';
import { useListBranches } from '@/modules/branches';
import { toast } from 'react-hot-toast';
import ImageUploader from '@/shared/components/ImageUploader';
import type { ImageUploaderRef } from '@/shared/components/ImageUploader';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  branchId: z.string().min(1, "Branch is required"),
  desc: z.string(),
  imageUrl: z.string(),
  active: z.boolean(),
});
type CategoryFormData = z.infer<typeof categorySchema>;

const inputClass = 'w-full box-border rounded-lg border border-border bg-white px-[14px] py-2.5 text-[13px] text-foreground outline-none';
const selectClass = `${inputClass} cursor-pointer`;
const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground';
const categoryEmojis: any = { Skincare: '🧴', Lipstick: '💄', Foundation: '🌿', Eyewear: '👁️', Fragrance: '🌸' };

export default function CategoriesView() {
  const { isMobile } = useResponsive();
  const { t } = useDashboardLocale();
  const [filterBranchId, setFilterBranchId] = useState('');
  const categoryImageRef = useRef<ImageUploaderRef>(null);

  const { data: apiCategories = [], isLoading: isLoadingCats } = useListCategories(
    filterBranchId ? { includeInactive: true, branchId: Number(filterBranchId) } : { includeInactive: true },
    { queryKey: ['categories', 'list', 'settings', { branchId: filterBranchId || null, includeInactive: true }] }
  );
  const { data: branches = [] } = useListBranches();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategoryStatus = useUpdateCategoryStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSavingCategory = createCategory.isPending || updateCategory.isPending || isSubmitting;

  const [editCat, setEditCat] = useState<number | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', slug: '', branchId: '', desc: '', imageUrl: '', active: true }
  });

  const watchImageUrl = watch('imageUrl');

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    
    const savePromise = (async () => {
      let finalImageUrl = data.imageUrl;
      if (categoryImageRef.current?.hasPending()) { const uploaded = await categoryImageRef.current.upload(); if (uploaded) finalImageUrl = uploaded; }
      const payload = { name: data.name, slug: data.slug, description: data.desc, isActive: data.active, imageUrl: finalImageUrl, branchId: Number(data.branchId) } as any;
      if (editCat) { await updateCategory.mutateAsync({ id: editCat, data: payload }); }
      else { await createCategory.mutateAsync(payload); }
      setShowAddCat(false); setEditCat(null); reset({ name: '', slug: '', desc: '', active: true, imageUrl: '', branchId: filterBranchId });
    })();

    toast.promise(savePromise, {
      loading: editCat ? 'Updating category...' : 'Creating category...',
      success: editCat ? t.categories.categoryUpdated : t.categories.categoryCreated,
      error: t.categories.failedSaveCategory,
    }).finally(() => {
      setIsSubmitting(false);
    });
  };

  const handleDeleteCategory = async (id: number) => {
    if (await confirmDialog({ title: t.categories.deleteCatConfirmTitle, text: t.categories.deleteCatConfirmText, confirmButtonText: t.products.yesDelete, icon: 'warning' })) {
      try { await deleteCategory.mutateAsync(id); toast.success(t.categories.categoryDeleted); } catch { toast.error(t.products.failedDelete); }
    }
  };

  const handleUpdateCategoryStatus = async (id: number, isActive: boolean) => {
    try { await updateCategoryStatus.mutateAsync({ id, data: { isActive } }); toast.success(isActive ? t.categories.categoryActivated : t.categories.categoryDeactivated); } catch { toast.error(t.products.failedStatusUpdate); }
  };

  const categories = apiCategories;

  return (
    <div className="flex flex-col gap-4">
      <Card className={isMobile ? 'p-[18px]' : 'p-7'}>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[13px]" style={{ color: Theme.mutedFg }}>{isLoadingCats ? t.categories.loadingCategories : `${categories.length} ${t.categories.totalCategories}`}</div>
            <div className="flex items-center gap-2">
              <select className={selectClass} value={filterBranchId} onChange={(e) => setFilterBranchId(e.target.value)} style={{ minWidth: 140 }}>
                <option value="">{t.products.allBranches}</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Btn variant="primary" size="sm" onClick={() => { reset({ name: '', slug: '', desc: '', active: true, imageUrl: '', branchId: filterBranchId }); setShowAddCat(true); }}>＋ {t.categories.newCategory}</Btn>
            </div>
          </div>

          {(showAddCat || editCat !== null) && (
            <form onSubmit={handleSubmit(onSubmit)} className="mb-4 rounded-xl border-[1.5px] p-4" style={{ borderColor: Theme.primary, background: Theme.secondary }}>
              <div className="mb-3 text-sm font-bold" style={{ color: Theme.primary }}>{editCat !== null ? t.categories.editCategory : t.categories.newCategory}</div>
              <div className={`mb-3 grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <label className={labelClass}>{t.categories.name} <span className="text-red-500">*</span></label>
                  <input {...register('name', { onChange: (e: any) => { setValue('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'), { shouldValidate: true }); } })} placeholder="e.g. Skincare" className={`${inputClass} transition-colors ${errors.name ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: errors.name ? undefined : Theme.border }} />
                  {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                </div>
                <div>
                  <label className={labelClass}>{t.categories.slug} <span className="text-red-500">*</span></label>
                  <input {...register('slug')} placeholder="skincare" className={`${inputClass} transition-colors ${errors.slug ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: errors.slug ? undefined : Theme.border }} />
                  {errors.slug && <span className="text-xs text-red-500">{errors.slug.message}</span>}
                </div>
                <div>
                  <label className={labelClass}>{t.categories.branch} <span className="text-red-500">*</span></label>
                  <select {...register('branchId')} className={`${selectClass} transition-colors ${errors.branchId ? 'border-red-400 bg-red-50' : ''}`} style={{ borderColor: errors.branchId ? undefined : Theme.border }}>
                    <option value="">{t.products.selectBranch}</option>
                    {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {errors.branchId && <span className="text-xs text-red-500">{errors.branchId.message}</span>}
                </div>
                <div className={isMobile ? '' : 'col-span-2'}>
                  <label className={labelClass}>{t.categories.shortDescription}</label>
                  <input {...register('desc')} placeholder="..." className={inputClass} style={{ borderColor: Theme.border }} />
                </div>
                <div className={isMobile ? '' : 'col-span-2'}>
                  <label className={labelClass}>{t.categories.categoryImage}</label>
                  <ImageUploader ref={categoryImageRef} value={watchImageUrl} onChange={(url) => setValue('imageUrl', url)} folder="mouchak/categories" aspect={16 / 9} placeholder={t.categories.uploadImage} />
                </div>
              </div>
              <div className="mb-3"><label className="flex cursor-pointer items-center gap-2 text-[13px]"><input type="checkbox" {...register('active')} style={{ accentColor: Theme.primary }} />{t.categories.activeOnStorefront}</label></div>
              <div className="flex gap-2"><Btn type="button" variant="ghost" size="sm" onClick={() => { setShowAddCat(false); setEditCat(null); }} disabled={isSavingCategory}>{t.products.cancel}</Btn><Btn type="submit" variant="primary" size="sm" loading={isSavingCategory}>{editCat !== null ? t.products.saveChanges : t.categories.createCategory}</Btn></div>
            </form>
          )}

        <div className="flex flex-col gap-2.5">
          {isLoadingCats ? <div className="py-4 text-center text-sm">{t.categories.loadingCategories}</div> : categories.length === 0 ? <div className="py-4 text-center text-sm">{t.categories.noCategories}</div> : categories.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-white px-[14px] py-3" style={{ opacity: c.isActive ? 1 : 0.6 }}>
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] text-lg" style={{ background: c.isActive ? Theme.secondary : Theme.muted }}>{c.imageUrl ? <img src={c.imageUrl} alt={c.name} className="h-full w-full object-cover" /> : categoryEmojis[c.name] || '🏷️'}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: Theme.fg }}>{c.name}</span>
                  {!c.isActive && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 uppercase">{t.products.inactive}</span>}
                  <span className="font-mono text-[10px]" style={{ color: Theme.mutedFg }}>/{c.slug}</span>
                  {(c as any).branchId ? <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 border border-blue-100">{branches.find((b: any) => b.id === (c as any).branchId)?.name || t.sales.branch.replace(' *', '')}</span> : <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[9px] font-medium text-gray-400 border border-gray-100">{t.categories.global}</span>}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: Theme.mutedFg }}>{c.description} · {(c as any)._count?.products || 0} {t.products.products}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Btn variant="ghost" size="sm" onClick={() => { reset({ name: c.name, slug: c.slug, desc: c.description || '', active: c.isActive, imageUrl: c.imageUrl || '', branchId: (c as any).branchId?.toString() || '' }); setEditCat(c.id); setShowAddCat(true); }}>{t.inventory.edit}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleUpdateCategoryStatus(c.id, !c.isActive)}>{c.isActive ? t.products.deactivate : t.products.activate}</Btn>
                <Btn variant="ghost" size="sm" onClick={() => handleDeleteCategory(c.id)}>🗑️</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
