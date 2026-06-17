import React, { useMemo, useState } from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Btn, Badge } from '../Primitives';
import { toast } from 'react-hot-toast';
import type { Coupon } from '@/modules/coupons';
import type { Promotion } from '@/modules/promotions';

export interface DiscountsSettingsTabProps {
  showPromotionEditor: boolean;
  setShowPromotionEditor: (val: boolean) => void;
  editingPromotionId: number | null;
  setEditingPromotionId: (id: number | null) => void;
  promotionForm: any;
  setPromotionForm: (form: any) => void;
  isLoadingPromotions: boolean;
  promotions: Promotion[];
  deletePromotionMut: any;
  openPromotionEditor: (promotion?: Promotion) => void;
  handleSavePromotion: () => Promise<void>;
  handleTogglePromotionActive: (id: number) => Promise<void>;
  productsList: any[];
  categories: any[];
  showCouponEditor: boolean;
  setShowCouponEditor: (val: boolean) => void;
  editingCouponId: number | null;
  setEditingCouponId: (id: number | null) => void;
  couponForm: any;
  setCouponForm: (form: any) => void;
  isLoadingCoupons: boolean;
  coupons: Coupon[];
  deleteCouponMut: any;
  openCouponEditor: (coupon?: Coupon) => void;
  handleSaveCoupon: () => Promise<void>;
  handleToggleCouponActive: (id: number) => Promise<void>;
  t: any;
  isMobile: boolean;
}

const inputClass =
  'w-full box-border rounded-lg border border-border bg-white px-[14px] py-2.5 text-[13px] text-foreground outline-none';
const labelClass = 'mb-1.5 block text-xs font-semibold text-foreground';

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

function formatCouponValue(coupon: Coupon) {
  if (coupon.type === 'FIXED') {
    return `৳${Number(coupon.value).toLocaleString('en-BD')} OFF`;
  }
  return `${coupon.value}% OFF`;
}

function formatMoney(value: number) {
  return `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

function formatPromoScope(promo: Promotion) {
  if (promo.applyTo === 'ALL') return 'All Products';
  if (promo.applyTo === 'CATEGORY' && promo.category) return `Category: ${promo.category.name}`;
  if (promo.applyTo === 'PRODUCT' && promo.productIds?.length) return `${promo.productIds.length} product(s)`;
  return promo.applyTo;
}

export default function DiscountsSettingsTab({
  showPromotionEditor,
  setShowPromotionEditor,
  editingPromotionId,
  setEditingPromotionId,
  promotionForm,
  setPromotionForm,
  isLoadingPromotions,
  promotions,
  deletePromotionMut,
  openPromotionEditor,
  handleSavePromotion,
  handleTogglePromotionActive,
  productsList,
  categories,
  showCouponEditor,
  setShowCouponEditor,
  editingCouponId,
  setEditingCouponId,
  couponForm,
  setCouponForm,
  isLoadingCoupons,
  coupons,
  deleteCouponMut,
  openCouponEditor,
  handleSaveCoupon,
  handleToggleCouponActive,
  t,
  isMobile,
}: DiscountsSettingsTabProps) {
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productsList.slice(0, 50);
    const q = productSearch.toLowerCase();
    return productsList.filter((p: any) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)).slice(0, 50);
  }, [productsList, productSearch]);

  return (
    <div>
      {/* ─── Promotion Editor Modal ─── */}
      {showPromotionEditor && (
        <div
          className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${isMobile ? 'items-end p-0' : 'items-center p-4'}`}
          onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[92vh] w-full max-w-[600px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${isMobile ? 'rounded-t-[20px]' : 'rounded-2xl'}`}
          >
            <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-border bg-white px-6 py-5">
              <div className="text-[17px] font-bold" style={{ color: Theme.fg }}>
                {editingPromotionId !== null ? t.settings.editPromotion : t.settings.createPromotion}
              </div>
              <button
                onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}
                className="cursor-pointer border-none bg-transparent text-xl leading-none outline-none"
                style={{ color: Theme.mutedFg }}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6">
              <div>
                <label className={labelClass}>{t.settings.promotionName} *</label>
                <input
                  className={inputClass}
                  value={promotionForm.label}
                  onChange={(e) => setPromotionForm((prev: any) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Eid Flash Sale"
                />
              </div>
              <div>
                <label className={labelClass}>{t.settings.discountPct} *</label>
                <input
                  type="number"
                  className={inputClass}
                  min={1}
                  max={95}
                  value={promotionForm.pct}
                  onChange={(e) => setPromotionForm((prev: any) => ({ ...prev, pct: e.target.value }))}
                  placeholder="e.g. 20"
                />
              </div>
              <div>
                <label className={labelClass}>{t.settings.bannerText} *</label>
                <textarea
                  className={`${inputClass} h-20 resize-y`}
                  value={promotionForm.banner}
                  onChange={(e) => setPromotionForm((prev: any) => ({ ...prev, banner: e.target.value }))}
                  placeholder="e.g. Eid Special - 20% off sitewide!"
                />
              </div>
              <div>
                <label className={labelClass}>{t.settings.offerEndDate}</label>
                <input
                  className={inputClass}
                  value={promotionForm.ends}
                  onChange={(e) => setPromotionForm((prev: any) => ({ ...prev, ends: e.target.value }))}
                  placeholder="e.g. Apr 30"
                />
              </div>

              {/* ── Scope: Apply To ── */}
              <div>
                <label className={labelClass}>Apply Discount To *</label>
                <select
                  className={inputClass}
                  value={promotionForm.applyTo}
                  onChange={(e) => setPromotionForm((prev: any) => ({
                    ...prev,
                    applyTo: e.target.value,
                    productIds: e.target.value !== 'PRODUCT' ? [] : prev.productIds,
                    categoryId: e.target.value !== 'CATEGORY' ? '' : prev.categoryId,
                  }))}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="ALL">All Products</option>
                  <option value="CATEGORY">Specific Category</option>
                  <option value="PRODUCT">Specific Products</option>
                </select>
              </div>

              {/* Category selector */}
              {promotionForm.applyTo === 'CATEGORY' && (
                <div>
                  <label className={labelClass}>Select Category *</label>
                  <select
                    className={inputClass}
                    value={promotionForm.categoryId}
                    onChange={(e) => setPromotionForm((prev: any) => ({ ...prev, categoryId: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">— Choose category —</option>
                    {categories.filter((c: any) => c.isActive !== false).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Product multi-selector */}
              {promotionForm.applyTo === 'PRODUCT' && (
                <div>
                  <label className={labelClass}>Select Products * ({promotionForm.productIds?.length || 0} selected)</label>
                  <input
                    className={inputClass}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name or SKU..."
                    style={{ marginBottom: 8 }}
                  />
                  <div
                    className="max-h-[200px] overflow-y-auto rounded-lg border border-border"
                    style={{ background: '#f9fafb' }}
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-xs" style={{ color: Theme.mutedFg }}>No products found</div>
                    ) : filteredProducts.map((p: any) => {
                      const isSelected = promotionForm.productIds?.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-2 border-b border-border px-3 py-2 last:border-0 hover:bg-white"
                          style={{ fontSize: 13 }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              setPromotionForm((prev: any) => {
                                const ids = prev.productIds || [];
                                const next = isSelected ? ids.filter((id: number) => id !== p.id) : [...ids, p.id];
                                return { ...prev, productIds: next };
                              });
                            }}
                            style={{ accentColor: Theme.primary }}
                          />
                          <span className="flex-1 truncate" style={{ color: Theme.fg }}>{p.name}</span>
                          <span className="text-[11px]" style={{ color: Theme.mutedFg }}>৳{Math.round(p.price).toLocaleString()}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2 text-[13px] outline-none">
                <input
                  type="checkbox"
                  checked={promotionForm.active}
                  onChange={(e) =>
                    setPromotionForm((prev: any) => ({ ...prev, active: e.target.checked }))
                  }
                  style={{ accentColor: Theme.primary }}
                />
                {t.settings.markActive}
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="ghost" onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}>
                  {t.settings.cancel}
                </Btn>
                <Btn variant="primary" onClick={handleSavePromotion}>
                  {t.settings.savePromotion}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Coupon Editor Modal ─── */}
      {showCouponEditor && (
        <div
          className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${isMobile ? 'items-end p-0' : 'items-center p-4'}`}
          onClick={() => { setShowCouponEditor(false); setEditingCouponId(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[92vh] w-full max-w-[560px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${isMobile ? 'rounded-t-[20px]' : 'rounded-2xl'}`}
          >
            <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-border bg-white px-6 py-5">
              <div className="text-[17px] font-bold" style={{ color: Theme.fg }}>
                {editingCouponId !== null ? 'Edit Coupon' : 'Create Coupon'}
              </div>
              <button
                onClick={() => { setShowCouponEditor(false); setEditingCouponId(null); }}
                className="cursor-pointer border-none bg-transparent text-xl leading-none outline-none"
                style={{ color: Theme.mutedFg }}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6">
              <div>
                <label className={labelClass}>Coupon Code *</label>
                <input
                  className={inputClass}
                  value={couponForm.code}
                  onChange={(e) => setCouponForm((prev: any) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. EID2025"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <input
                  className={inputClass}
                  value={couponForm.description}
                  onChange={(e) => setCouponForm((prev: any) => ({ ...prev, description: e.target.value }))}
                  placeholder="Admin note (internal only)"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className={labelClass}>Discount Type *</label>
                  <select
                    className={inputClass}
                    value={couponForm.type}
                    onChange={(e) => setCouponForm((prev: any) => ({ ...prev, type: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="FIXED">Fixed Amount (৳)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    {couponForm.type === 'FIXED' ? 'Amount (৳) *' : 'Percentage (%) *'}
                  </label>
                  <input
                    type="number"
                    className={inputClass}
                    min={1}
                    max={couponForm.type === 'PERCENTAGE' ? 100 : undefined}
                    value={couponForm.value}
                    onChange={(e) => setCouponForm((prev: any) => ({ ...prev, value: e.target.value }))}
                    placeholder={couponForm.type === 'FIXED' ? 'e.g. 200' : 'e.g. 15'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className={labelClass}>Minimum Order Amount</label>
                  <input
                    type="number"
                    className={inputClass}
                    min={0}
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm((prev: any) => ({ ...prev, minOrderAmount: e.target.value }))}
                    placeholder="No minimum"
                  />
                </div>
                {couponForm.type === 'PERCENTAGE' && (
                  <div>
                    <label className={labelClass}>Max Discount Cap</label>
                    <input
                      type="number"
                      className={inputClass}
                      min={0}
                      value={couponForm.maxDiscountAmount}
                      onChange={(e) => setCouponForm((prev: any) => ({ ...prev, maxDiscountAmount: e.target.value }))}
                      placeholder="No cap"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Usage Limit</label>
                <input
                  type="number"
                  className={inputClass}
                  min={1}
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm((prev: any) => ({ ...prev, usageLimit: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className={labelClass}>Valid From</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={couponForm.startsAt}
                    onChange={(e) => setCouponForm((prev: any) => ({ ...prev, startsAt: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expires On</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={couponForm.expiresAt}
                    onChange={(e) => setCouponForm((prev: any) => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[13px] outline-none">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) =>
                    setCouponForm((prev: any) => ({ ...prev, isActive: e.target.checked }))
                  }
                  style={{ accentColor: Theme.primary }}
                />
                Active (customers can use this coupon)
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Btn variant="ghost" onClick={() => { setShowCouponEditor(false); setEditingCouponId(null); }}>
                  {t.settings.cancel}
                </Btn>
                <Btn variant="primary" onClick={handleSaveCoupon}>
                  Save Coupon
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Promotions Section ─── */}
      <FormSection title={t.settings.activePromotions}>
        <div className="flex flex-col gap-3">
          {isLoadingPromotions ? (
            <div className="text-xs" style={{ color: Theme.mutedFg }}>{t.settings.loadingPromotions}</div>
          ) : promotions.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border-[1.5px] p-4"
              style={{
                borderColor: d.isActive ? Theme.primary : Theme.border,
                background: d.isActive ? Theme.secondary : '#fff',
              }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-bold" style={{ color: Theme.fg }}>
                  {d.label}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge label={`${d.pct}% ${t.settings.off}`} bg={Theme.primary} color="#fff" />
                  <Badge
                    label={formatPromoScope(d)}
                    bg="#ede9fe"
                    color="#6d28d9"
                  />
                  <Badge
                    label={d.isActive ? t.settings.live : t.settings.paused}
                    bg={d.isActive ? '#dcfce7' : '#f5f5f5'}
                    color={d.isActive ? '#166534' : Theme.mutedFg}
                  />
                </div>
              </div>
              <div className="mb-2 text-xs" style={{ color: Theme.mutedFg }}>
                {d.banner}
                {d.endsAt ? ` · ${t.settings.ends} ${d.endsAt}` : ''}
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => handleTogglePromotionActive(d.id)}>
                  {d.isActive ? t.settings.pause : t.settings.activate}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={() => openPromotionEditor(d)}>
                  {t.settings.edit}
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await deletePromotionMut.mutateAsync(d.id);
                      toast.success('Promotion removed');
                    } catch {
                      toast.error('Failed to remove promotion');
                    }
                  }}
                >
                  {t.settings.remove}
                </Btn>
              </div>
            </div>
          ))}
          <Btn variant="secondary" size="sm" onClick={() => openPromotionEditor()}>
            {t.settings.createNewPromotion}
          </Btn>
        </div>
      </FormSection>

      {/* ─── Coupons Section ─── */}
      <FormSection title="Coupon Codes">
        <div className="flex flex-col gap-3">
          {isLoadingCoupons ? (
            <div className="text-xs" style={{ color: Theme.mutedFg }}>Loading coupons…</div>
          ) : coupons.length === 0 ? (
            <div className="text-xs" style={{ color: Theme.mutedFg }}>No coupons created yet.</div>
          ) : coupons.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border-[1.5px] p-4"
              style={{
                borderColor: c.isActive ? Theme.primary : Theme.border,
                background: c.isActive ? Theme.secondary : '#fff',
              }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold" style={{ color: Theme.fg, letterSpacing: '0.08em' }}>
                    {c.code}
                  </div>
                  <Badge
                    label={formatCouponValue(c)}
                    bg={Theme.primary}
                    color="#fff"
                  />
                  <Badge
                    label={c.isActive ? t.settings.live : t.settings.paused}
                    bg={c.isActive ? '#dcfce7' : '#f5f5f5'}
                    color={c.isActive ? '#166534' : Theme.mutedFg}
                  />
                </div>
              </div>
              <div className="mb-2 text-xs" style={{ color: Theme.mutedFg }}>
                {c.description && <span>{c.description} · </span>}
                {c.minOrderAmount && <span>Min order: {formatMoney(c.minOrderAmount)} · </span>}
                {c.usageLimit ? (
                  <span>Used {c.usedCount}/{c.usageLimit} times</span>
                ) : (
                  <span>Used {c.usedCount} times (unlimited)</span>
                )}
                {c.expiresAt && <span> · Expires {new Date(c.expiresAt).toLocaleDateString()}</span>}
              </div>
              <div className="flex gap-2">
                <Btn variant="ghost" size="sm" onClick={() => handleToggleCouponActive(c.id)}>
                  {c.isActive ? t.settings.pause : t.settings.activate}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={() => openCouponEditor(c)}>
                  {t.settings.edit}
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await deleteCouponMut.mutateAsync(c.id);
                      toast.success('Coupon removed');
                    } catch {
                      toast.error('Failed to remove coupon');
                    }
                  }}
                >
                  {t.settings.remove}
                </Btn>
              </div>
            </div>
          ))}
          <Btn variant="secondary" size="sm" onClick={() => openCouponEditor()}>
            + Create New Coupon
          </Btn>
        </div>
      </FormSection>
    </div>
  );
}
