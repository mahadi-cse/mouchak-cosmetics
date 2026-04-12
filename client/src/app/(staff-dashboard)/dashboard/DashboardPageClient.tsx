'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  DashboardLayout,
  useBreakpoint,
  ResponsiveContext,
  type Product,
  type SellLog,
  type Order as DashboardOrder,
} from '@/modules/dashboard';
import { isStaffRole } from '@/shared/constants';
import { useListOrders } from '@/modules/orders';
import { useInventorySummary } from '@/modules/inventory';
import { useLowStockItems } from '@/modules/inventory';
import { useListManualSales } from '@/modules/manual-sales';

export default function DashboardPageClient() {
  const { data: session, status } = useSession();
  const bp = useBreakpoint();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellLog, setSellLog] = useState<SellLog[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = useListOrders({ page: 1, limit: 20 });
  const { data: inventoryData, isLoading: inventoryLoading } = useInventorySummary({ page: 1, limit: 100 });
  const { data: lowStockData } = useLowStockItems({ page: 1, limit: 100 });
  const { data: manualSalesData, isLoading: manualSalesLoading } = useListManualSales({ page: 1, limit: 50 });

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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
        price: Number(item.price ?? item.product?.price ?? 0),
        stock: item.currentStock ?? item.quantity ?? item.availableQty ?? 0,
        warehouse: item.warehouse || 'N/A',
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

  useEffect(() => {
    if (Array.isArray(manualSalesData) && !manualSalesLoading) {
      const transformedLog: SellLog[] = manualSalesData.slice(0, 50).map((sale: any, index: number) => ({
        id: sale.saleNumber || String(sale.id || index),
        product: sale.items?.length > 1
          ? `${sale.items[0]?.productNameSnapshot || 'Sale Item'} +${sale.items.length - 1} more`
          : sale.items?.[0]?.productNameSnapshot || 'Sale Item',
        qty: sale.totalQty || 0,
        amount: sale.totalAmount || 0,
        note: sale.note || `Manual Sale · ${sale.branchName || 'Main'}`,
        date: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        by: sale.branchName ? `${sale.soldBy || 'Staff'} · ${sale.branchName}` : (sale.soldBy || 'Staff'),
      }));

      setSellLog(transformedLog);
    }
  }, [manualSalesData, manualSalesLoading]);

  useEffect(() => {
    if (Array.isArray(ordersData) && !ordersLoading) {
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
      setOrders(transformedOrders);
    }
  }, [ordersData, ordersLoading]);

  if (status === 'loading' || !mounted) {
    return <div className="p-6 text-sm text-zinc-500">Checking your session...</div>;
  }

  if (status === 'unauthenticated' || !isStaffRole(session?.user?.role)) {
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
