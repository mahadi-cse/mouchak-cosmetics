'use client';

import { useState, useEffect } from 'react';
import {
  DashboardLayout,
  useBreakpoint,
  ResponsiveContext,
  type Product,
  type SellLog,
  type Order as DashboardOrder,
} from '@/modules/dashboard';
import { useListOrders } from '@/modules/orders';
import { useInventorySummary } from '@/modules/inventory';
import { useLowStockItems } from '@/modules/inventory';

export default function DashboardPage() {
  const bp = useBreakpoint();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellLog, setSellLog] = useState<SellLog[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Fetch real data from API using React Query
  const { data: ordersData, isLoading: ordersLoading } = useListOrders({ page: 1, limit: 20 });
  const { data: inventoryData, isLoading: inventoryLoading } = useInventorySummary({ page: 1, limit: 100 });
  const { data: lowStockData } = useLowStockItems({ page: 1, limit: 100 });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Transform API data to match your UI structure
  useEffect(() => {
    const inventoryItems = (inventoryData as { data?: any[] } | undefined)?.data;
    const lowStockItems = (lowStockData as { data?: any[] } | undefined)?.data || [];
    const lowStockIds = new Set(lowStockItems.map((item: any) => item.productId));

    if (Array.isArray(inventoryItems) && !inventoryLoading) {
      const transformedProducts: Product[] = inventoryItems.map((item: any, index: number) => ({
        id: item.productId || item.product?.id || item.id || index,
        name: item.name || item.product?.name || 'Unknown Product',
        sku: item.sku || item.product?.sku || 'N/A',
        category: item.category || item.product?.category?.name || 'Uncategorized',
        price: item.price || item.product?.price || 0,
        stock: item.currentStock ?? item.quantity ?? item.availableQty ?? 0,
        sold: item.unitsSold || 0,
        manualSold: 0,
        status: (item.currentStock ?? item.quantity ?? item.availableQty ?? 0) <= 0
          ? 'out'
          : lowStockIds.has(item.productId || item.product?.id) || (item.currentStock ?? item.quantity ?? item.availableQty ?? 0) <= (item.lowStockThreshold || 10)
            ? 'low'
            : 'active',
      }));
      setProducts(transformedProducts);
    }
  }, [inventoryData, lowStockData, inventoryLoading]);

  // Transform order data for sell log
  useEffect(() => {
    if (Array.isArray(ordersData) && !ordersLoading) {
      const transformedLog: SellLog[] = ordersData.slice(0, 20).map((order: any, index: number) => ({
        id: String(order.id || index),
        product: `Order #${order.orderNumber}`,
        qty: order.items?.length || 1,
        amount: order.total || 0,
        note: order.notes || 'No notes',
        date: new Date(order.createdAt).toLocaleDateString(),
        by: order.shippingName || 'Customer',
      }));

      const transformedOrders: DashboardOrder[] = ordersData.slice(0, 50).map((order: any) => ({
        id: `#ORD-${order.orderNumber || order.id}`,
        customer: order.shippingName || 'Customer',
        amount: order.total || 0,
        status: (['delivered', 'processing', 'shipped', 'pending'].includes(String(order.status || 'PENDING').toLowerCase())
          ? String(order.status || 'PENDING').toLowerCase()
          : 'pending') as DashboardOrder['status'],
        items: order.items?.length || 1,
        time: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Now',
      }));

      setSellLog(transformedLog);
      setOrders(transformedOrders);
    }
  }, [ordersData, ordersLoading]);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted) {
    return null;
  }

  return (
    <ResponsiveContext.Provider value={bp}>
      <DashboardLayout
        products={products}
        setProducts={setProducts}
        sellLog={sellLog}
        setSellLog={setSellLog}
        orders={orders}
        time={time}
      />
    </ResponsiveContext.Provider>
  );
}