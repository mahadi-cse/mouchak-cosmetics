import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

export interface ShippingSettingsTabProps {
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

export default function ShippingSettingsTab({
  settings,
  setSettings,
  t,
  isMobile,
}: ShippingSettingsTabProps) {
  return (
    <div>
      <FormSection title={t.settings.shippingRates}>
        <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className={labelClass}>{t.settings.defaultShipping}</label>
            <input
              type="number"
              value={settings.defaultShipping}
              onChange={(e) => setSettings({ ...settings, defaultShipping: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.settings.freeShippingOver}</label>
            <input
              type="number"
              value={settings.freeShippingOver}
              onChange={(e) =>
                setSettings({ ...settings, freeShippingOver: Number(e.target.value) })
              }
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t.settings.deliveryTimeEstimate}</label>
          <input
            value={settings.deliveryEstimate}
            onChange={(e) => setSettings({ ...settings, deliveryEstimate: e.target.value })}
            className={inputClass}
          />
        </div>
      </FormSection>
    </div>
  );
}
