import { apiClient } from '@/shared/lib/apiClient';
import type { UserProfile } from './types/profile.types';

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
};
