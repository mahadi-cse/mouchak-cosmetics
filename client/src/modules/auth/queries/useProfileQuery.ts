import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { authAPI } from '../api';
import type { UserProfile } from '../types/profile.types';

export const PROFILE_QUERY_KEY = ['auth', 'profile'] as const;

export function useProfileQuery() {
  const { data: session, status } = useSession();

  return useQuery<UserProfile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: authAPI.getProfile,
    enabled: status === 'authenticated' && !!session?.accessToken,
    staleTime: 5 * 60 * 1000,  // 5 min — profile rarely changes
    gcTime: 10 * 60 * 1000,    // keep in cache for 10 min
    retry: 1,
  });
}
