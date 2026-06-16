import React from 'react';
import { Theme } from '@/modules/dashboard/utils/theme';

export interface SecuritySettingsTabProps {
  securityDevices: any[];
  isLoadingSecurity: boolean;
  handleRevokeDevice: (id: number) => Promise<void>;
  handleRevokeAllOtherDevices: () => Promise<void>;
  t: any;
}

export default function SecuritySettingsTab({
  securityDevices,
  isLoadingSecurity,
  handleRevokeDevice,
  handleRevokeAllOtherDevices,
  t,
}: SecuritySettingsTabProps) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-[13px] max-w-xl" style={{ color: Theme.mutedFg }}>
          {t.securityDevices.sub}
        </p>
        {securityDevices.some(d => !d.isCurrent && d.isActive) && (
          <button
            type="button"
            onClick={handleRevokeAllOtherDevices}
            className="inline-flex items-center justify-center px-4 py-2 text-[13px] font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 transition-colors cursor-pointer whitespace-nowrap outline-none"
          >
            {t.securityDevices.revokeAllOthers}
          </button>
        )}
      </div>

      {isLoadingSecurity ? (
        <div className="py-8 text-center text-[13px]" style={{ color: Theme.mutedFg }}>
          {t.securityDevices.loading}
        </div>
      ) : securityDevices.length === 0 ? (
        <div className="py-8 text-center text-[13px]" style={{ color: Theme.mutedFg }}>
          {t.securityDevices.noDevices}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {securityDevices.map((device) => {
            // Determine device icon
            let icon = '🖥️';
            const type = (device.deviceType || '').toLowerCase();
            if (type.includes('mobile') || type.includes('phone')) {
              icon = '📱';
            } else if (type.includes('tablet') || type.includes('ipad')) {
              icon = '📟';
            }

            return (
              <div
                key={device.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-zinc-50/50 hover:bg-white transition-colors gap-3"
                style={{
                  borderColor: device.isCurrent ? Theme.primary : undefined,
                  background: device.isCurrent ? Theme.secondary : undefined,
                  opacity: device.isActive ? 1 : 0.65,
                }}
              >
                <div className="flex items-start gap-3.5">
                  <span className="text-2xl mt-0.5">{icon}</span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold" style={{ color: Theme.fg }}>
                        {device.browser} on {device.os}
                      </span>
                      {device.isCurrent && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          {t.securityDevices.activeNow}
                        </span>
                      )}
                      {!device.isCurrent && !device.isActive && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 border border-gray-200"
                        >
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs" style={{ color: Theme.mutedFg }}>
                       {device.ipAddress && (
                        <span>
                          {t.securityDevices.ipAddress}: <code className="bg-zinc-100/80 px-1 py-0.5 rounded font-mono text-[11px]">{['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(device.ipAddress) ? 'Localhost' : device.ipAddress}</code>
                        </span>
                      )}
                      <span>
                        {t.securityDevices.loginTime}: {new Date(device.createdAt).toLocaleString(
                          typeof window !== 'undefined' ? window.navigator.language : 'en-US',
                          { dateStyle: 'medium', timeStyle: 'short' }
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {!device.isCurrent && device.isActive && (
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(device.id)}
                    className="inline-flex items-center justify-center px-4 py-2 text-[12px] font-bold rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 transition-colors cursor-pointer whitespace-nowrap outline-none shrink-0 self-end sm:self-center"
                  >
                    {t.securityDevices.revokeSession}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
