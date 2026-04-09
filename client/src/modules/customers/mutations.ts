import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateCustomerRequest, UpdateLoyaltyPointsRequest } from './api';
import { customersAPI } from './api';
import { CUSTOMERS_QUERY_KEYS } from './queries';

export const useUpdateCustomerMutation = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: number; data: UpdateCustomerRequest }) =>
      customersAPI.updateCustomer(customerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: CUSTOMERS_QUERY_KEYS.detail(variables.customerId),
      });
    },
    ...options,
  });
};

export const useUpdateLoyaltyPointsMutation = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      { customerId, data }: { customerId: number; data: UpdateLoyaltyPointsRequest }
    ) => customersAPI.updateLoyaltyPoints(customerId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: CUSTOMERS_QUERY_KEYS.detail(variables.customerId),
      });
      queryClient.invalidateQueries({
        queryKey: CUSTOMERS_QUERY_KEYS.metrics(variables.customerId),
      });
    },
    ...options,
  });
};

export const useDeleteCustomerMutation = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (customerId: number) => customersAPI.deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEYS.all });
    },
    ...options,
  });
};
