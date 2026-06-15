import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { toast } from 'react-hot-toast';

export interface TrendingSettingsTabProps {
  trendingSearch: string;
  setTrendingSearch: (val: string) => void;
  trendingBranchId: string;
  setTrendingBranchId: (val: string) => void;
  isLoadingProducts: boolean;
  productsList: any[];
  updateProduct: any;
  branches: any[];
  triggerSavedIndicator: () => void;
  t: any;
}

const inputClass =
  'w-full box-border rounded-lg border border-border bg-white px-[14px] py-2.5 text-[13px] text-foreground outline-none';
const selectClass = `${inputClass} cursor-pointer`;

const FormSection = ({ title, children }: any) => (
  <div className="mb-6">
    <div
      className="mb-3 border-b-2 pb-2 text-sm font-bold"
      style={{ color: Theme.fg, borderBottomColor: Theme.secondary }}
    >
      {title}
    </div>
    {children}
  </div>
);

export default function TrendingSettingsTab({
  trendingSearch,
  setTrendingSearch,
  trendingBranchId,
  setTrendingBranchId,
  isLoadingProducts,
  productsList,
  updateProduct,
  branches,
  triggerSavedIndicator,
  t,
}: TrendingSettingsTabProps) {
  const q = trendingSearch.trim().toLowerCase();
  const filtered = productsList.filter((p: any) => {
    if (trendingBranchId && String(p.inventories?.[0]?.warehouseId) !== trendingBranchId) return false;
    if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !(p.category?.name || '').toLowerCase().includes(q)) return false;
    return true;
  });

  // Show featured first, then the rest
  const sorted = [...filtered].sort((a: any, b: any) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  return (
    <div>
      <FormSection title={t.settings.trendingProducts}>
        <div className="mb-[14px] text-[13px]" style={{ color: Theme.mutedFg }}>
          {t.settings.trendingDesc}
          <span className="ml-1 font-semibold" style={{ color: Theme.primary }}>
            {productsList.filter((p: any) => p.isFeatured).length} {t.settings.featured}
          </span>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={trendingSearch}
            onChange={(e) => setTrendingSearch(e.target.value)}
            placeholder={t.settings.searchProducts}
            className={inputClass}
            style={{ maxWidth: 240 }}
          />
          <select
            className={selectClass}
            value={trendingBranchId}
            onChange={(e) => setTrendingBranchId(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="">{t.settings.allBranches}</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2.5">
          {isLoadingProducts ? (
            <div className="py-4 text-center text-sm">{t.settings.loadingProducts}</div>
          ) : filtered.length === 0 ? (
            <div className="py-4 text-center text-sm">{t.settings.noProductsFound}</div>
          ) : (
            sorted.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-[10px] border bg-white px-[14px] py-3"
                style={{ borderColor: p.isFeatured ? Theme.primary : Theme.border }}
              >
                <input
                  type="checkbox"
                  checked={p.isFeatured}
                  onChange={async (e) => {
                    try {
                      await updateProduct.mutateAsync({
                        id: p.id,
                        isFeatured: e.target.checked,
                      } as any);
                      triggerSavedIndicator();
                      toast.success(e.target.checked ? 'Added to featured' : 'Removed from featured');
                    } catch {
                      toast.error('Failed to update product');
                    }
                  }}
                  className="h-4 w-4 shrink-0 cursor-pointer"
                  style={{ accentColor: Theme.primary }}
                />
                <div
                  className="h-9 w-9 shrink-0 overflow-hidden rounded"
                  style={{ background: Theme.muted }}
                >
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm">📦</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                      {p.name}
                    </span>
                    {p.isFeatured && (
                      <span className="rounded bg-pink-50 px-1.5 py-0.5 text-[9px] font-bold text-pink-600 border border-pink-100">
                        {t.settings.featured}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px]" style={{ color: Theme.mutedFg }}>
                    {p.category?.name} · ৳{p.price} · {branches.find((b: any) => b.id === p.inventories?.[0]?.warehouseId)?.name || 'Default'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </FormSection>
    </div>
  );
}
