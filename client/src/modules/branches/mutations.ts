import { useMutation, useQueryClient } from '@tanstack/react-query';
import { branchesAPI, type BranchUpsertPayload } from './api';
import { BRANCH_QUERY_KEYS } from './queries';

export const useCreateBranchMutation = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BranchUpsertPayload) => branchesAPI.createBranch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
    },
    ...options,
  });
};

export const useUpdateBranchMutation = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<BranchUpsertPayload> }) =>
      branchesAPI.updateBranch(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
    },
    ...options,
  });
};

export const useSetBranchStatusMutation = (options?: any) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      branchesAPI.setBranchStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANCH_QUERY_KEYS.all });
    },
    ...options,
  });
};
