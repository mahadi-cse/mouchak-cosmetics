import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { authAPI } from '../api';

export const SECURITY_DEVICES_KEY = ['auth', 'security-devices'] as const;

export interface SecurityDevice {
  id: number;
  ipAddress: string | null;
  deviceType: string;
  browser: string;
  os: string;
  createdAt: string;
  isCurrent: boolean;
  isActive: boolean;
}

export function useSecurityDevicesQuery() {
  const { data: session, status } = useSession();

  return useQuery<SecurityDevice[]>({
    queryKey: SECURITY_DEVICES_KEY,
    queryFn: authAPI.getSecurityDevices,
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 10 * 1000,
  });
}

export function useRevokeDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => authAPI.revokeDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_DEVICES_KEY });
    },
  });
}

export function useRevokeAllOtherDevicesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAPI.revokeAllOtherDevices(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SECURITY_DEVICES_KEY });
    },
  });
}
