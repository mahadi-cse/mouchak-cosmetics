import apiClient from '@/shared/lib/apiClient';
import type { AuditLogsResponse, AuditLogParams } from './types';

export const settingsAPI = {
  getAuditLogs: async (params: AuditLogParams): Promise<AuditLogsResponse> => {
    const res = await apiClient.get<AuditLogsResponse>('/audit-logs', { params });
    return res.data;
  },
};
