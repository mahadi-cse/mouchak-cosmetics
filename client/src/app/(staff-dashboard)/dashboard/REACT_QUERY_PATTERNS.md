# React Query Implementation Patterns & Best Practices

## Common Patterns

### 1. Infinite Queries for Pagination

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { listOrders } from '@/features/orders/api';

export function InfiniteOrdersList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['orders', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      listOrders({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.pagination.page < lastPage.pagination.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  return (
    <div>
      {data?.pages.map((group) =>
        group.data.map((order) => (
          <div key={order.id}>{order.orderNumber}</div>
        ))
      )}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading more...' : 'Load more'}
      </button>
    </div>
  );
}
```

### 2. Dependent Queries (Sequential Loading)

```typescript
import { useCustomerDetails, useCustomerOrders } from '@/modules/customers/queries';

export function CustomerFullView({ customerId }: { customerId: number }) {
  // First query - customer details
  const { data: customer, isLoading: customerLoading } = useCustomerDetails(customerId);

  // Second query depends on first
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(
    customerId,
    { page: 1, limit: 10 },
    {
      enabled: !!customer, // Only run when customer data exists
    }
  );

  const isLoading = customerLoading || ordersLoading;

  if (isLoading) return <div>Loading customer profile...</div>;

  return (
    <div>
      <h1>{customer.user.firstName} {customer.user.lastName}</h1>
      <div>
        <h2>Recent Orders</h2>
        {orders?.data?.map(order => (
          <div key={order.id}>{order.orderNumber}</div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Optimistic Updates with Mutations

```typescript
import { useUpdateOrderStatusMutation } from '@/features/orders/mutations';
import { useQueryClient } from '@tanstack/react-query';

export function OrderStatusButton({ orderId, currentStatus }) {
  const queryClient = useQueryClient();

  const { mutate: updateStatus } = useUpdateOrderStatusMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['orders', orderId],
      });

      // Snapshot previous data
      const previousOrder = queryClient.getQueryData(['orders', orderId]);

      // Optimistically update
      queryClient.setQueryData(['orders', orderId], (old: any) => ({
        ...old,
        status: variables.data.status,
      }));

      return { previousOrder };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(['orders', variables.orderId], context.previousOrder);
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['orders', variables.orderId],
      });
    },
  });

  return (
    <button
      onClick={() => updateStatus({
        orderId,
        data: { status: 'SHIPPED' },
      })}
    >
      Mark as Shipped
    </button>
  );
}
```

### 4. Refetching and Polling

```typescript
import { useListOrders } from '@/features/orders/queries';

export function LiveOrdersMonitor() {
  // Refetch every 5 seconds
  const { data: orders, refetch } = useListOrders(
    { page: 1, limit: 20 },
    {
      refetchInterval: 5000, // 5 seconds
      refetchIntervalInBackground: true, // Continue refetching when tab is inactive
    }
  );

  return (
    <div>
      <button onClick={() => refetch()}>
        Refresh Now
      </button>
      {orders?.data?.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
}
```

### 5. Filtering and Searching

```typescript
import { useListOrders } from '@/features/orders/queries';
import { useState, useMemo } from 'react';

export function OrderSearchTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: orders } = useListOrders({
    page: 1,
    limit: 20,
    status: statusFilter || undefined,
    search: debouncedSearch || undefined,
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search orders..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="SHIPPED">Shipped</option>
      </select>

      {orders?.data?.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
}
```

## Error Handling Patterns

### 1. Global Error Boundary

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

### 2. Component-Level Error Handling

```typescript
import { useListOrders } from '@/features/orders/queries';

export function OrdersList() {
  const { data, isLoading, isError, error } = useListOrders();

  if (isLoading) return <div>Loading...</div>;

  if (isError) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to load orders';

    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <h3 className="font-bold text-red-800">Error Loading Orders</h3>
        <p className="text-red-700">{errorMessage}</p>
        <button
          onClick={() => queryClient.invalidateQueries()}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {data?.data?.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
}
```

### 3. Mutation Error Handling

```typescript
import { useUpdateOrderStatusMutation } from '@/features/orders/mutations';

export function OrderStatusUpdate({ orderId, currentStatus }) {
  const {
    mutate: updateStatus,
    isPending,
    isError,
    error,
  } = useUpdateOrderStatusMutation();

  const handleUpdate = (newStatus: string) => {
    updateStatus(
      { orderId, data: { status: newStatus as any } },
      {
        onSuccess: () => {
          // Show success toast/notification
          showNotification('Status updated successfully', 'success');
        },
        onError: (error) => {
          // Show error toast/notification
          const message = error instanceof Error
            ? error.message
            : 'Failed to update status';
          showNotification(message, 'error');
        },
      }
    );
  };

  return (
    <div>
      {isError && (
        <div className="text-red-600 mb-2">
          {(error as Error).message}
        </div>
      )}
      <button
        onClick={() => handleUpdate('SHIPPED')}
        disabled={isPending}
      >
        {isPending ? 'Updating...' : 'Update'}
      </button>
    </div>
  );
}
```

## Performance Optimization

### 1. Memoization to Prevent Re-renders

```typescript
import { useMemo } from 'react';
import { useListOrders } from '@/features/orders/queries';

export function OrderMetrics() {
  const { data: orders } = useListOrders();

  const metrics = useMemo(() => {
    if (!orders?.data) return null;

    return {
      total: orders.data.length,
      pending: orders.data.filter(o => o.status === 'PENDING').length,
      shipped: orders.data.filter(o => o.status === 'SHIPPED').length,
    };
  }, [orders?.data]);

  return (
    <div>
      <p>Total: {metrics?.total}</p>
      <p>Pending: {metrics?.pending}</p>
      <p>Shipped: {metrics?.shipped}</p>
    </div>
  );
}
```

### 2. Batch Queries

```typescript
import { useQueries } from '@tanstack/react-query';
import { getCustomerDetails, getCustomerMetrics, getCustomerOrders } from '@/modules/customers/api';

export function CustomerBatch({ customerId }: { customerId: number }) {
  const results = useQueries({
    queries: [
      {
        queryKey: ['customer', customerId, 'details'],
        queryFn: () => getCustomerDetails(customerId),
      },
      {
        queryKey: ['customer', customerId, 'metrics'],
        queryFn: () => getCustomerMetrics(customerId),
      },
      {
        queryKey: ['customer', customerId, 'orders'],
        queryFn: () => getCustomerOrders(customerId, { page: 1, limit: 5 }),
      },
    ],
  });

  const [details, metrics, orders] = results;
  const isLoading = details.isLoading || metrics.isLoading || orders.isLoading;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{details.data?.user?.firstName}</h1>
      <p>Total Orders: {metrics.data?.totalOrders}</p>
      {orders.data?.data?.map(order => (
        <div key={order.id}>{order.orderNumber}</div>
      ))}
    </div>
  );
}
```

## Debugging

### 1. Use React Query DevTools (in development)

```typescript
import { lazy, Suspense } from 'react';

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then(({ ReactQueryDevtools }) => ({
    default: ReactQueryDevtools,
  }))
);

export function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </>
  );
}
```

### 2. Query Key Logging

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: () => {}, // Suppress errors in console
  },
});

// Or instrument individual queries:
const { data } = useListOrders(undefined, {
  onSuccess: (data) => console.log('Orders loaded:', data),
  onError: (error) => console.error('Orders error:', error),
});
```

## Best Practices Summary

1. **Use Query Key Factories**: Organized, type-safe query keys
2. **Set Appropriate Stale Times**: Balance between freshness and performance
3. **Implement Error Handling**: Global + component-level strategies
4. **Optimize Renders**: Use memoization and selective invalidation
5. **Use Mutations with Callbacks**: Provide user feedback
6. **Batch Related Queries**: Load multiple datasets efficiently
7. **Handle Loading States**: Show meaningful loading indicators
8. **Implement Retry Logic**: Handle transient failures
9. **Use DevTools**: Debug query state in development
10. **Test Query Behavior**: Mock APIs with MSW or similar
