import { useQuery } from '@tanstack/react-query';
import { suppliersAPI, type Supplier, type SupplierTransaction } from './api';
import type { PaginatedResponse } from '@/shared/types';

export const SUPPLIER_KEYS = {
  all: ['suppliers'] as const,
  list: (p: any) => [...SUPPLIER_KEYS.all, 'list', p] as const,
  detail: (id: number) => [...SUPPLIER_KEYS.all, 'detail', id] as const,
  txns: (p: any) => [...SUPPLIER_KEYS.all, 'txns', p] as const,
};

export const useListSuppliers = (params?: any, options?: any) =>
  useQuery<PaginatedResponse<Supplier>>({ queryKey: SUPPLIER_KEYS.list(params || {}), queryFn: () => suppliersAPI.list(params), staleTime: 3 * 60 * 1000, ...options });

export const useSupplierTransactions = (params?: any, options?: any) =>
  useQuery<PaginatedResponse<SupplierTransaction>>({ queryKey: SUPPLIER_KEYS.txns(params || {}), queryFn: () => suppliersAPI.listTransactions(params), staleTime: 60 * 1000, ...options });
