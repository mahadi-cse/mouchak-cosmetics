import { apiClient } from '@/shared/lib/apiClient';
import type { UserProfile } from './types';

export const authAPI = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/auth/profile');
    const data = res.data.data;
    return {
      id: data.id,
      name: data.name || data.fullName || data.username || 'User',
      email: data.email,
      avatarUrl: data.avatarUrl || data.profileImage || undefined,
      role: data.userType?.name || data.role,
      userType: data.userType,
    };
  },
  getSecurityDevices: async (): Promise<any[]> => {
    const res = await apiClient.get('/auth/security-devices');
    return res.data.data;
  },
  revokeDevice: async (id: number): Promise<void> => {
    await apiClient.post(`/auth/security-devices/${id}/revoke`);
  },
  revokeAllOtherDevices: async (): Promise<void> => {
    await apiClient.post('/auth/security-devices/revoke-all-others');
  },
};
