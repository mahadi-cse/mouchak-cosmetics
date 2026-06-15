import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Btn, Badge } from '../Primitives';
import { toast } from 'react-hot-toast';

export interface DiscountsSettingsTabProps {
  showPromotionEditor: boolean;
  setShowPromotionEditor: (val: boolean) => void;
  editingPromotionId: number | null;
  setEditingPromotionId: (id: number | null) => void;
  promotionForm: any;
  setPromotionForm: (form: any) => void;
  isLoadingPromotions: boolean;
  promotions: any[];
  deletePromotionMut: any;
  openPromotionEditor: (promotion?: any) => void;
  handleSavePromotion: () => Promise<void>;
  handleTogglePromotionActive: (id: number) => Promise<void>;
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
  t,
  isMobile,
}: DiscountsSettingsTabProps) {
  return (
    <div>
      {showPromotionEditor && (
        <div
          className={`fixed inset-0 z-[9999] flex justify-center bg-black/50 ${isMobile ? 'items-end p-0' : 'items-center p-4'}`}
          onClick={() => { setShowPromotionEditor(false); setEditingPromotionId(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[92vh] w-full max-w-[560px] overflow-y-auto bg-white shadow-[0_24px_60px_rgba(0,0,0,0.2)] ${isMobile ? 'rounded-t-[20px]' : 'rounded-2xl'}`}
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
                <label className={labelClass}>{t.settings.promotionName}</label>
                <input
                  className={inputClass}
                  value={promotionForm.label}
                  onChange={(e) => setPromotionForm((prev: any) => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Eid Flash Sale"
                />
              </div>
              <div>
                <label className={labelClass}>{t.settings.discountPct}</label>
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
                <label className={labelClass}>{t.settings.bannerText}</label>
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
    </div>
  );
}
