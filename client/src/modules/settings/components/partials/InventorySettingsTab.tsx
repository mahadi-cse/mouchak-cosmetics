import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

export interface InventorySettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
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

const Toggle = ({ val, onToggle, label }: any) => (
  <div className="flex items-center justify-between border-b border-border py-3">
    <span className="text-[13px]" style={{ color: Theme.fg }}>
      {label}
    </span>
    <button
      onClick={onToggle}
      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-none transition-colors outline-none"
      style={{ background: val ? Theme.primary : Theme.border }}
    >
      <div
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)] transition-all"
        style={{ left: val ? 22 : 3 }}
      />
    </button>
  </div>
);

export default function InventorySettingsTab({
  settings,
  setSettings,
  t,
  isMobile,
}: InventorySettingsTabProps) {
  return (
    <div>
      <FormSection title={t.settings.stockThresholds}>
        <div className={`grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className={labelClass}>{t.settings.lowStockAlert}</label>
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) =>
                setSettings({ ...settings, lowStockThreshold: Number(e.target.value) })
              }
              className={inputClass}
            />
          </div>
        </div>
      </FormSection>
      <FormSection title={t.settings.inventoryBehaviour}>
        <Toggle
          val={settings.autoReserve}
          onToggle={() => setSettings({ ...settings, autoReserve: !settings.autoReserve })}
          label={t.settings.autoReserve}
        />
        <Toggle
          val={settings.barcodeEnabled}
          onToggle={() =>
            setSettings({ ...settings, barcodeEnabled: !settings.barcodeEnabled })
          }
          label={t.settings.enableBarcode}
        />
      </FormSection>
    </div>
  );
}
