import { useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersAPI, type CreateSupplierRequest, type CreateTransactionRequest } from './api';
import { SUPPLIER_KEYS } from './queries';

export const useCreateSupplier = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (d: CreateSupplierRequest) => suppliersAPI.create(d), onSuccess: () => qc.invalidateQueries({ queryKey: SUPPLIER_KEYS.all }) }); };
export const useUpdateSupplier = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: number; data: any }) => suppliersAPI.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: SUPPLIER_KEYS.all }) }); };
export const useDeleteSupplier = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id: number) => suppliersAPI.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: SUPPLIER_KEYS.all }) }); };
export const useCreateSupplierTransaction = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (d: CreateTransactionRequest) => suppliersAPI.createTransaction(d), onSuccess: () => qc.invalidateQueries({ queryKey: SUPPLIER_KEYS.all }) }); };
