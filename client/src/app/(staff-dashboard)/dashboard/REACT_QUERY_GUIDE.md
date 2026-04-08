# Dashboard React Query Implementation Guide

## Overview

This guide shows how to use the React Query hooks for the dashboard APIs.

## Quick Start

### 1. Dashboard Metrics Example

```typescript
'use client';

import { useDashboardMetrics } from '@/features/analytics/queries';
import { useListOrders } from '@/features/orders/queries';
import { useListCustomers } from '@/features/customers/queries';
import { useInventorySummary } from '@/features/inventory/queries';

export default function DashboardPage() {
  // Get all dashboard metrics at once
  const { revenue, customers, topProducts, salesByCategory, isLoading } = useDashboardMetrics();

  // Get recent orders
  const { data: orders } = useListOrders({ page: 1, limit: 10 });

  // Get customers
  const { data: customersData } = useListCustomers({ page: 1, limit: 10 });

  // Get inventory summary
  const { data: inventory } = useInventorySummary({ page: 1, limit: 10 });

  if (isLoading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Revenue Card */}
      <div>
        <h2>Revenue</h2>
        <p>Total: {revenue.data?.totalRevenue}</p>
        <p>Orders: {revenue.data?.totalOrders}</p>
        <p>Avg Order Value: {revenue.data?.avgOrderValue}</p>
      </div>

      {/* Customers Card */}
      <div>
        <h2>Customers</h2>
        <p>Total: {customers.data?.totalCustomers}</p>
        <p>Active: {customers.data?.activeCustomers}</p>
        <p>VIP: {customers.data?.segments?.vip}</p>
      </div>

      {/* Top Products */}
      <div>
        <h2>Top Products</h2>
        {topProducts.data?.map((product) => (
          <div key={product.productId}>
            <p>{product.productName}</p>
            <p>Sold: {product.unitsSold}</p>
            <p>Revenue: {product.revenue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Orders Management Example

```typescript
'use client';

import { useListOrders, useOrderDetails } from '@/features/orders/queries';
import {
  useUpdateOrderStatusMutation,
  useMarkAsShippedMutation,
  useCancelOrderMutation,
} from '@/features/orders/mutations';
import { useState } from 'react';

export function OrdersTable() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // List orders with filtering
  const { data: orders, isLoading } = useListOrders(
    {
      page: 1,
      limit: 20,
      status: 'PENDING',
    },
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  // Get order details
  const { data: selectedOrder } = useOrderDetails(selectedOrderId || undefined);

  // Mutations
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateOrderStatusMutation();
  const { mutate: markShipped, isPending: isShipping } = useMarkAsShippedMutation();
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrderMutation();

  const handleUpdateStatus = (orderId: number, status: string) => {
    updateStatus({ orderId, data: { status: status as any } });
  };

  const handleMarkShipped = (orderId: number) => {
    markShipped(orderId);
  };

  const handleCancelOrder = (orderId: number) => {
    cancelOrder(orderId);
  };

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Order #</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {orders?.data?.map((order: any) => (
          <tr key={order.id}>
            <td>{order.orderNumber}</td>
            <td>{order.shippingName}</td>
            <td>{order.total}</td>
            <td>{order.status}</td>
            <td>
              <button
                onClick={() => setSelectedOrderId(order.id)}
                disabled={isUpdating}
              >
                View
              </button>
              <button
                onClick={() => handleMarkShipped(order.id)}
                disabled={isShipping || order.status === 'SHIPPED'}
              >
                Ship
              </button>
              <button
                onClick={() => handleCancelOrder(order.id)}
                disabled={isCancelling || order.status === 'CANCELLED'}
              >
                Cancel
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 3. Inventory Management Example

```typescript
'use client';

import { useInventorySummary, useLowStockItems } from '@/features/inventory/queries';
import { useAdjustStockMutation } from '@/features/inventory/mutations';

export function InventoryDashboard() {
  // Get inventory summary
  const { data: inventory, isLoading } = useInventorySummary({
    page: 1,
    limit: 20,
  });

  // Get low stock items
  const { data: lowStock } = useLowStockItems({
    page: 1,
    limit: 10,
  });

  // Adjust stock mutation
  const { mutate: adjustStock, isPending } = useAdjustStockMutation({
    onSuccess: () => {
      alert('Stock adjusted successfully');
    },
    onError: (error: any) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleAdjustStock = (productId: number, quantity: number) => {
    adjustStock({
      productId,
      quantity,
      type: 'ADJUSTMENT',
      reason: 'Manual adjustment',
    });
  };

  if (isLoading) return <div>Loading inventory...</div>;

  return (
    <div>
      <h2>Inventory Overview</h2>
      <div>
        Total Items: {inventory?.pagination?.total}
      </div>

      <h3>Low Stock Items ({lowStock?.pagination?.total})</h3>
      {lowStock?.data?.map((item: any) => (
        <div key={item.productId}>
          <p>
            {item.name} - Current: {item.currentStock} / Threshold: {item.lowStockThreshold}
          </p>
          <button
            onClick={() => handleAdjustStock(item.productId, 10)}
            disabled={isPending}
          >
            Add 10 Units
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 4. Customers Management Example

```typescript
'use client';

import { useListCustomers, useCustomerDetails, useCustomerMetrics } from '@/features/customers/queries';
import { useUpdateLoyaltyPointsMutation } from '@/features/customers/mutations';
import { useState } from 'react';

export function CustomersTable() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  // List customers
  const { data: customers, isLoading } = useListCustomers({
    page: 1,
    limit: 20,
    segment: 'VIP',
  });

  // Get customer details
  const { data: customerDetail } = useCustomerDetails(selectedCustomerId || undefined);

  // Get customer metrics
  const { data: metrics } = useCustomerMetrics(selectedCustomerId || undefined);

  // Update loyalty points
  const { mutate: updatePoints } = useUpdateLoyaltyPointsMutation();

  const handleAddLoyaltyPoints = (customerId: number, points: number) => {
    updatePoints({
      customerId,
      data: {
        points,
        action: 'ADD',
        reason: 'Manual addition',
      },
    });
  };

  if (isLoading) return <div>Loading customers...</div>;

  return (
    <div>
      <h2>VIP Customers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Total Spent</th>
            <th>Orders</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {customers?.data?.map((customer: any) => (
            <tr key={customer.id}>
              <td>{customer.user?.firstName} {customer.user?.lastName}</td>
              <td>{customer.user?.email}</td>
              <td>{customer.totalSpent}</td>
              <td>{customer.totalOrders}</td>
              <td>
                <button onClick={() => setSelectedCustomerId(customer.id)}>
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCustomerId && (
        <div>
          <h3>Customer Details</h3>
          <p>Name: {customerDetail?.user?.firstName}</p>
          <p>Email: {customerDetail?.user?.email}</p>
          <p>Loyalty Points: {metrics?.loyaltyPoints}</p>
          <p>Total Orders: {metrics?.totalOrders}</p>
          <p>Total Spent: {metrics?.totalSpent}</p>
          <button
            onClick={() => handleAddLoyaltyPoints(selectedCustomerId, 100)}
          >
            Add 100 Points
          </button>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### Inventory Hooks
- `useInventorySummary(params)` - Get paginated inventory
- `useProductStockDetails(productId)` - Get specific product stock
- `useLowStockItems(params)` - Get items below threshold
- `useInventoryHistory(productId, params)` - Get transaction history
- `useInventoryReports(params)` - Get inventory reports

### Orders Hooks
- `useListOrders(params)` - Get paginated orders
- `useOrderDetails(orderId)` - Get specific order
- `useOrdersByCustomer(customerId)` - Get customer's orders
- `useOrdersByStatus(status)` - Get orders by status
- `useOrderInvoice(orderId)` - Get order invoice

### Customers Hooks
- `useListCustomers(params)` - Get paginated customers
- `useCustomerDetails(customerId)` - Get customer details
- `useCustomerOrders(customerId, params)` - Get customer orders
- `useCustomerMetrics(customerId)` - Get customer metrics
- `useCustomersBySegment(segment)` - Get customers by segment

### Analytics Hooks
- `useRevenueAnalytics(params)` - Revenue metrics
- `useSalesByCategory(params)` - Sales breakdown by category
- `useTopProducts(params)` - Top selling products
- `useCustomerAnalytics(params)` - Customer statistics
- `useInvoiceData(params)` - Invoice data
- `useDashboardMetrics(params)` - Combined dashboard metrics

## Mutations

### Inventory Mutations
- `useAdjustStockMutation()` - Adjust stock quantity
- `useTransferStockMutation()` - Transfer between warehouses
- `useReconcileStockMutation()` - Reconcile physical count

### Orders Mutations
- `useCreateOrderMutation()` - Create new order
- `useUpdateOrderStatusMutation()` - Update order status
- `useAddOrderNotesMutation()` - Add notes to order
- `useCreateReturnMutation()` - Create return request
- `useProcessRefundMutation()` - Process refund
- `useMarkAsShippedMutation()` - Mark order as shipped
- `useCancelOrderMutation()` - Cancel order

### Customers Mutations
- `useUpdateCustomerMutation()` - Update customer profile
- `useUpdateLoyaltyPointsMutation()` - Modify loyalty points
- `useDeleteCustomerMutation()` - Delete customer

## Best Practices

1. **Use the dashboard metrics hook** for overview pages
2. **Enable queries conditionally** with the `enabled` option
3. **Set appropriate staleTime** for your use case
4. **Use mutations** with `onSuccess`/`onError` callbacks
5. **Invalidate queries** after mutations to keep data fresh
6. **Combine multiple queries** for complex views
