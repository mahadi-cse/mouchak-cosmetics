import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Btn } from '../Primitives';
import { confirmDialog } from '@/shared/lib/confirmDialog';

export interface PaymentSettingsTabProps {
  settings: any;
  setSettings: (s: any) => void;
  newPaymentMethod: string;
  setNewPaymentMethod: (val: string) => void;
  homepageStatsData: any;
  createPaymentMethod: any;
  updatePaymentMethod: any;
  deletePaymentMethod: any;
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

export default function PaymentSettingsTab({
  settings,
  setSettings,
  newPaymentMethod,
  setNewPaymentMethod,
  homepageStatsData,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  t,
  isMobile,
}: PaymentSettingsTabProps) {
  return (
    <div>
      <FormSection title={t.settings.paymentConfig}>
        <div className={`mb-[14px] grid gap-[14px] ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <div>
            <label className={labelClass}>{t.settings.storeId}</label>
            <input
              value={settings.sslStoreId}
              onChange={(e) => setSettings({ ...settings, sslStoreId: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.settings.refundPolicy}</label>
            <input
              type="number"
              value={settings.refundDays}
              onChange={(e) => setSettings({ ...settings, refundDays: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t.settings.storeSignature}</label>
          <input
            type="password"
            value={settings.sslStoreSecret}
            onChange={(e) => setSettings({ ...settings, sslStoreSecret: e.target.value })}
            className={inputClass}
            placeholder={t.settings.enterApiSecret}
          />
        </div>
      </FormSection>
      <FormSection title={t.settings.acceptedPaymentMethods}>
        <div className="flex flex-col gap-3 mb-5">
          {homepageStatsData?.paymentMethods?.map((method: any) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-zinc-50/50 hover:bg-white transition-colors"
              style={{ opacity: method.isActive ? 1 : 0.6 }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: method.isActive ? Theme.success : Theme.border }}
                />
                <span className="text-[13px] font-semibold" style={{ color: Theme.fg }}>
                  {method.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updatePaymentMethod.mutate({ id: method.id, data: { isActive: !method.isActive } })}
                  className="relative h-5 w-9 shrink-0 cursor-pointer rounded-full border-none transition-colors"
                  style={{ background: method.isActive ? Theme.primary : Theme.border }}
                >
                  <div
                    className="absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all"
                    style={{ left: method.isActive ? 18 : 2 }}
                  />
                </button>

                <button
                  onClick={async () => {
                    const confirmed = await confirmDialog({
                      title: 'Delete Payment Method?',
                      text: `Are you sure you want to remove "${method.name}"?`,
                      confirmButtonText: 'Yes, delete',
                      icon: 'warning'
                    });
                    if (confirmed) deletePaymentMethod.mutate(method.id);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          {(!homepageStatsData?.paymentMethods || homepageStatsData.paymentMethods.length === 0) && (
            <div className="py-4 text-center text-xs italic" style={{ color: Theme.mutedFg }}>
              No payment methods configured.
            </div>
          )}
        </div>

        <div className="flex gap-2 p-1 rounded-xl bg-zinc-100/50 border border-border">
          <input
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            placeholder="e.g. Rocket"
            className={`${inputClass} border-none bg-transparent h-10`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newPaymentMethod.trim()) {
                e.preventDefault();
                createPaymentMethod.mutate(newPaymentMethod.trim());
                setNewPaymentMethod('');
              }
            }}
          />
          <Btn
            variant="primary"
            size="sm"
            className="h-10 px-6"
            onClick={() => {
              if (newPaymentMethod.trim()) {
                createPaymentMethod.mutate(newPaymentMethod.trim());
                setNewPaymentMethod('');
              }
            }}
          >
            Add Method
          </Btn>
        </div>
      </FormSection>
    </div>
  );
}
