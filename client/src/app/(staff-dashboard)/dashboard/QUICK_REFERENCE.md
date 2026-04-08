# React Query Quick Reference

## Module Imports

```typescript
// Inventory
import {
  useInventorySummary,
  useProductStockDetails,
  useLowStockItems,
  useInventoryHistory,
  useInventoryReports,
  useAdjustStockMutation,
  useTransferStockMutation,
  useReconcileStockMutation,
} from '@/features/inventory';

// Orders
import {
  useListOrders,
  useOrderDetails,
  useOrdersByCustomer,
  useOrdersByStatus,
  useOrderInvoice,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useAddOrderNotesMutation,
  useCreateReturnMutation,
  useProcessRefundMutation,
  useMarkAsShippedMutation,
  useCancelOrderMutation,
} from '@/features/orders';

// Customers
import {
  useListCustomers,
  useCustomerDetails,
  useCustomerOrders,
  useCustomerMetrics,
  useCustomersBySegment,
  useUpdateCustomerMutation,
  useUpdateLoyaltyPointsMutation,
  useDeleteCustomerMutation,
} from '@/features/customers';

// Analytics
import {
  useRevenueAnalytics,
  useSalesByCategory,
  useTopProducts,
  useCustomerAnalytics,
  useInvoiceData,
  useCustomReport,
  useDashboardMetrics,
} from '@/features/analytics';
```

## Query Key Factories

### Inventory Query Keys
```typescript
INVENTORY_QUERY_KEYS = {
  all: ['inventory'],
  summary: ['inventory', 'summary'],
  summaryPaginated: (page, limit) => [...INVENTORY_QUERY_KEYS.summary, page, limit],
  stock: ['inventory', 'stock'],
  stockDetail: (productId) => [...INVENTORY_QUERY_KEYS.stock, 'detail', productId],
  lowStock: ['inventory', 'low-stock'],
  lowStockPaginated: (page, limit) => [...INVENTORY_QUERY_KEYS.lowStock, page, limit],
  history: (productId) => ['inventory', 'history', productId],
  reports: ['inventory', 'reports'],
  reconcile: ['inventory', 'reconcile'],
}
```

### Orders Query Keys
```typescript
ORDERS_QUERY_KEYS = {
  all: ['orders'],
  list: ['orders', 'list'],
  listPaginated: (page, limit) => [...ORDERS_QUERY_KEYS.list, page, limit],
  detail: (orderId) => ['orders', 'detail', orderId],
  byCustomer: (customerId) => ['orders', 'customer', customerId],
  byStatus: (status) => ['orders', 'status', status],
  invoice: (orderId) => ['orders', 'invoice', orderId],
}
```

### Customers Query Keys
```typescript
CUSTOMERS_QUERY_KEYS = {
  all: ['customers'],
  list: ['customers', 'list'],
  listPaginated: (page, limit) => [...CUSTOMERS_QUERY_KEYS.list, page, limit],
  detail: (customerId) => ['customers', 'detail', customerId],
  orders: (customerId) => ['customers', 'orders', customerId],
  metrics: (customerId) => ['customers', 'metrics', customerId],
  segment: (segment) => ['customers', 'segment', segment],
}
```

### Analytics Query Keys
```typescript
ANALYTICS_QUERY_KEYS = {
  all: ['analytics'],
  revenue: ['analytics', 'revenue'],
  salesByCategory: ['analytics', 'sales', 'category'],
  topProducts: ['analytics', 'products', 'top'],
  customers: ['analytics', 'customers'],
  invoices: ['analytics', 'invoices'],
  custom: (reportId) => ['analytics', 'custom', reportId],
  dashboard: ['analytics', 'dashboard'],
}
```

## Common Use Cases

### Get Dashboard Metrics
```typescript
const { revenue, customers, topProducts, salesByCategory, isLoading, isError } = 
  useDashboardMetrics();

// Access individual metrics:
const totalRevenue = revenue.data?.totalRevenue;
const customerCount = customers.data?.totalCustomers;
const bestProducts = topProducts.data;
const categorySales = salesByCategory.data;
```

### List Orders with Filters
```typescript
const { data, isLoading, refetch } = useListOrders({
  page: 1,
  limit: 20,
  status: 'PENDING', // Optional filter
  sortBy: 'createdAt',
  sortOrder: 'DESC',
});

// data.data = orders array
// data.pagination.total = total count
// data.pagination.page = current page
// data.pagination.pages = total pages
```

### Get Single Customer Profile
```typescript
const [customerId, setCustomerId] = useState<number | null>(null);

const { data: customer, isLoading } = useCustomerDetails(
  customerId || undefined,
  { enabled: !!customerId } // Only fetch when ID is set
);

// customer.id, customer.user, customer.totalSpent, etc.
```

### Update Order Status
```typescript
const { mutate: updateStatus, isPending, isError, error } = 
  useUpdateOrderStatusMutation();

// In event handler:
updateStatus({
  orderId: 123,
  data: { status: 'SHIPPED' }
});

// With callbacks:
updateStatus(
  { orderId: 123, data: { status: 'SHIPPED' } },
  {
    onSuccess: (data) => console.log('Updated:', data),
    onError: (error) => console.error('Failed:', error),
  }
);
```

### Adjust Inventory Stock
```typescript
const { mutate: adjustStock, isPending } = useAdjustStockMutation();

adjustStock({
  productId: 456,
  quantity: 10,
  type: 'ADDITION', // or 'REDUCTION', 'TRANSFER'
  reason: 'Restock delivery',
});
```

### Get Low Stock Items
```typescript
const { data: lowStockItems, isLoading } = useLowStockItems({
  page: 1,
  limit: 50,
});

// Automatically alerts products below threshold
lowStockItems.data.forEach(item => {
  console.log(`${item.name} at ${item.currentStock}/${item.lowStockThreshold}`);
});
```

### Get Customer by Segment
```typescript
const { data: vipCustomers } = useCustomersBySegment('VIP');
const { data: regularCustomers } = useCustomersBySegment('REGULAR');
const { data: newCustomers } = useCustomersBySegment('NEW');
```

### Refund Process Flow
```typescript
// 1. Create return request
const { mutate: createReturn } = useCreateReturnMutation();
createReturn({
  orderId: 123,
  items: [
    { orderItemId: 1, returnedQuantity: 2, reason: 'Defective' }
  ],
  reason: 'Product defect',
});

// 2. After return confirmation, process refund
const { mutate: processRefund } = useProcessRefundMutation();
processRefund({
  returnId: 789,
  refundMethod: 'CREDIT_CARD',
  notes: 'Full refund approved',
});
```

### Get Analytics Report
```typescript
const { data: revenueData, isLoading } = useRevenueAnalytics({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  interval: 'DAILY', // or 'WEEKLY', 'MONTHLY'
});

// {
//   totalRevenue: 50000,
//   totalOrders: 150,
//   avgOrderValue: 333.33,
//   chartData: [...]
// }
```

### Monitor Orders in Real-Time
```typescript
const { data: orders, refetch } = useListOrders(
  { page: 1, limit: 20, status: 'PENDING' },
  {
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true, // Keep polling in background tab
  }
);

// When you need fresh data immediately:
refetch();
```

## Stale Times Reference

| Data Type | Stale Time | Rationale |
|-----------|-----------|-----------|
| Dashboard Metrics | 10 minutes | High-level overview, not critical |
| Inventory Summary | 5 minutes | Operational but relatively stable |
| Low Stock Items | 10 minutes | Alert-level, less frequent updates |
| Recent Orders | 2-3 minutes | Active operations, frequent changes |
| Order Details | 5 minutes | Reference data, occasional updates |
| Customer List | 15 minutes | Relatively static |
| Customer Metrics | 10 minutes | Calculated data, good to cache |
| Analytics Reports | 15 minutes | Historical data, slow to change |

## Error Response Patterns

All API errors follow this structure:

```typescript
interface ApiError {
  error: {
    message: string;
    code: string;
    details?: Record<string, any>;
    timestamp: string;
  }
}

// In React Query:
const { error } = useListOrders();
if (error) {
  // error is AxiosError
  const apiError = error.response?.data?.error;
  console.log(apiError?.message); // User-friendly message
  console.log(apiError?.code);    // Error code like 'INVALID_STOCK'
}
```

## TypeScript Types

```typescript
// Shared types
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
}

// Inventory
interface InventorySummary {
  productId: number;
  name: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  lastUpdated: Date;
}

// Orders
interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  items: OrderItem[];
}

// Customers
interface Customer {
  id: number;
  user: User;
  totalSpent: number;
  totalOrders: number;
  loyaltyPoints: number;
  segment: 'VIP' | 'REGULAR' | 'NEW';
}

// Analytics
interface RevenueAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  chartData: Array<{ date: string; revenue: number }>;
}
```

## Mutation Options

All mutations accept these options:

```typescript
mutate(data, {
  onSuccess: (data) => {
    // Handle successful mutation
    // Queries are automatically invalidated
  },
  onError: (error) => {
    // Handle error
  },
  onSettled: (data, error) => {
    // Always called after success or error
  },
});
```

## Quick Debug Checks

```typescript
// Is data being cached?
// Check React Query DevTools (development only)

// Force refetch:
refetch();

// Check query state:
console.log({ isLoading, isError, error, data });

// Check API response:
// Browser DevTools > Network tab > Requests to /api/*

// Verify authentication:
// Check localStorage for auth token
// Check Authorization headers in network tab

// Clear cache:
queryClient.clear();
```

## Common Mistakes to Avoid

1. ❌ Not setting `enabled: false` for dependent queries
   ```typescript
   // Wrong - will call even if customerId is null
   const { data } = useCustomerOrders(null);
   
   // Right
   const { data } = useCustomerOrders(customerId || undefined, {
     enabled: !!customerId
   });
   ```

2. ❌ Not invalidating queries after mutations
   ```typescript
   // The mutation hooks handle this automatically,
   // but if creating custom mutations:
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['orders'] });
   }
   ```

3. ❌ Over-fetching data
   ```typescript
   // Wrong - fetches all user details for just the name
   const { data: user } = useCustomerDetails(customerId);
   
   // Better - consider what you actually need
   ```

4. ❌ Not handling undefined values
   ```typescript
   // Wrong
   const { data } = useOrderDetails(orderId); // might be undefined
   const title = data.orderNumber; // Error!
   
   // Right
   const title = data?.orderNumber || 'Loading...';
   ```
