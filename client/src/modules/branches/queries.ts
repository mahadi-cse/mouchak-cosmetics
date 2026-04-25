import { useQuery } from '@tanstack/react-query';
import { branchesAPI, type BranchDTO } from './api';

export const BRANCH_QUERY_KEYS = {
  all: ['branches'] as const,
};

export const useListBranches = (options?: any) => {
  return useQuery<BranchDTO[]>({
    queryKey: BRANCH_QUERY_KEYS.all,
    queryFn: () => branchesAPI.listBranches(),
    staleTime: 60 * 1000,
    ...options,
  });
};
