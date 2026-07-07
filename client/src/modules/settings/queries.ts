import { useQuery } from '@tanstack/react-query';
import { settingsAPI } from './api';
import type { AuditLogParams } from './types';

export const SETTINGS_QUERY_KEYS = {
  all: ['settings'] as const,
  auditLogs: (params: AuditLogParams) => [...SETTINGS_QUERY_KEYS.all, 'audit-logs', params] as const,
};

export function useAuditLogs(params: AuditLogParams) {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.auditLogs(params),
    queryFn: () => settingsAPI.getAuditLogs(params),
  });
}
