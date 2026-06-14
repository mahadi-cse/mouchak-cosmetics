import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '@/modules/dashboard/utils/theme';
import { Card, Btn, Badge } from '../Primitives';
import apiClient from '@/shared/lib/apiClient';
import { toast } from 'react-hot-toast';
import { confirmDialog } from '@/shared/lib/confirmDialog';
import { CheckCircle, XCircle, Key, LogOut } from 'lucide-react';
import { useDashboardLocale } from '../../locales/DashboardLocaleContext';

interface Customer {
  id: number;
  user: {
    isActive: boolean;
  };
  segment: string;
  totalSpent: number;
  totalOrders: number;
  customerName?: string;
  firstName?: string;
  lastName?: string;
}

export default function CustomerSettingsView() {
  const { t } = useDashboardLocale();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: async () => {
      const res = await apiClient.get('/customers', {
        params: { page, limit: 10, search }
      });
      return res.data;
    }
  });

  const toggleStatusMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.put(`/customers/${id}/status`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'Status updated');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  });

  const resetPasswordMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.put(`/customers/${id}/password`);
      return res.data;
    },
    onSuccess: (res) => {
      alert(`Password reset successfully!\n\nNew Password: ${res.data?.newPassword}\n\nPlease copy this password securely.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  });

  const revokeSessionsMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post(`/customers/${id}/revoke-sessions`);
      return res.data;
    },
    onSuccess: (res) => {
      toast.success(res.message || 'All sessions revoked');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to revoke sessions');
    }
  });

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    const isConfirmed = await confirmDialog({
      title: isActive ? t.customers.deactivateTitle : t.customers.activateTitle,
      text: isActive ? t.customers.deactivateText : t.customers.activateText,
    });
    if (isConfirmed) toggleStatusMut.mutate(id);
  };

  const handleResetPassword = async (id: number) => {
    const isConfirmed = await confirmDialog({
      title: t.customers.resetPwdTitle,
      text: t.customers.resetPwdText,
    });
    if (isConfirmed) resetPasswordMut.mutate(id);
  };

  const handleRevokeSessions = async (id: number) => {
    const isConfirmed = await confirmDialog({
      title: t.customers.revokeTitle,
      text: t.customers.revokeText,
    });
    if (isConfirmed) revokeSessionsMut.mutate(id);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500 font-medium">{t.customers.loading}</div>;
  }

  const customers = data?.data?.items || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">{t.customers.title}</h2>
          <p className="text-sm text-zinc-500 font-medium mt-1">{t.customers.sub}</p>
        </div>
        <input
          type="text"
          placeholder={t.customers.searchPlaceholder}
          className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.customers.tableCustomer}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.customers.tableMetrics}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.customers.tableStatus}</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">{t.customers.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {customers.map((c: Customer) => {
                const isActive = c.user?.isActive ?? true;
                let name = c.customerName || (c.firstName ? `${c.firstName} ${c.lastName || ''}`.trim() : null);
                
                if (!name && c.user) {
                  name = (c.user as any).email || (c.user as any).phone || t.na;
                } else if (!name) {
                  name = t.na;
                }
                
                return (
                  <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{name}</div>
                      <div className="text-xs text-zinc-500 mt-1 font-medium">{c.segment || 'NEW'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary">৳{c.totalSpent || 0}</div>
                      <div className="text-xs text-zinc-500 mt-1 font-medium">{c.totalOrders || 0} {t.customers.orders}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        label={isActive ? t.customers.active : t.customers.blocked} 
                        bg={isActive ? '#dcfce7' : '#fee2e2'} 
                        color={isActive ? '#166534' : '#991b1b'} 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Btn 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleStatus(c.id, isActive)}
                          className={isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                          title={isActive ? t.customers.blockAccount : t.customers.activateAccount}
                        >
                          {isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                        </Btn>
                        <Btn 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleResetPassword(c.id)}
                          className="text-zinc-600 hover:bg-zinc-100"
                          title={t.customers.resetPassword}
                        >
                          <Key size={16} />
                        </Btn>
                        <Btn 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRevokeSessions(c.id)}
                          className="text-orange-600 hover:bg-orange-50"
                          title={t.customers.revokeSessions}
                        >
                          <LogOut size={16} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 font-medium">
                    {t.customers.noCustomers}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
