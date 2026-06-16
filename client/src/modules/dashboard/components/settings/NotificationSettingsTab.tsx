import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

export interface NotificationSettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
  t: any;
}

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

export default function NotificationSettingsTab({
  settings,
  setSettings,
  t,
}: NotificationSettingsTabProps) {
  return (
    <div>
      <FormSection title={t.settings.emailNotifications}>
        <Toggle
          val={settings.emailOrders}
          onToggle={() => setSettings({ ...settings, emailOrders: !settings.emailOrders })}
          label={t.settings.newOrderPlaced}
        />
        <Toggle
          val={settings.emailStock}
          onToggle={() => setSettings({ ...settings, emailStock: !settings.emailStock })}
          label={t.settings.lowStockAlertEmail}
        />
        <Toggle
          val={settings.emailNewCustomer}
          onToggle={() =>
            setSettings({ ...settings, emailNewCustomer: !settings.emailNewCustomer })
          }
          label={t.settings.newCustomerRegistered}
        />
      </FormSection>
      <FormSection title={t.settings.smsNotifications}>
        <Toggle
          val={settings.smsOrders}
          onToggle={() => setSettings({ ...settings, smsOrders: !settings.smsOrders })}
          label={t.settings.orderConfSms}
        />
        <Toggle
          val={settings.smsDelivery}
          onToggle={() => setSettings({ ...settings, smsDelivery: !settings.smsDelivery })}
          label={t.settings.deliveryStatusSms}
        />
      </FormSection>
    </div>
  );
}
