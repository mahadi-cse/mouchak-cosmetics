import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AnalyticsFilterInput } from './analytics.schema';

type OverviewPeriod = 'today' | 'week' | 'month';

const toNumber = (value: Prisma.Decimal | number | string | null | undefined) => Number(value || 0);

const getPeriodRanges = (period: OverviewPeriod) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'today') {
    const currentStart = todayStart;
    const currentEnd = now;
    const previousStart = new Date(todayStart);
    previousStart.setDate(previousStart.getDate() - 1);
    const previousEnd = new Date(todayStart.getTime() - 1);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      comparisonLabel: 'yesterday',
    };
  }

  if (period === 'week') {
    const currentStart = new Date(todayStart);
    currentStart.setDate(currentStart.getDate() - 6);
    const currentEnd = now;

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 7);
    const previousEnd = new Date(currentStart.getTime() - 1);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      comparisonLabel: 'last week',
    };
  }

  const currentStart = new Date(todayStart);
  currentStart.setDate(currentStart.getDate() - 29);
  const currentEnd = now;

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - 30);
  const previousEnd = new Date(currentStart.getTime() - 1);

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    comparisonLabel: 'last month',
  };
};

export class AnalyticsService {
  async getRevenueAnalytics(filters: AnalyticsFilterInput) {
    const where: any = { status: { in: ['DELIVERED', 'SHIPPED'] } };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      period: filters,
      totalRevenue,
      totalOrders,
      totalItems,
      avgOrderValue,
      currency: 'BDT',
    };
  }

  async getSalesByCategory(filters: AnalyticsFilterInput) {
    const where: any = { order: { status: { in: ['DELIVERED', 'SHIPPED'] } } };

    if (filters.startDate || filters.endDate) {
      where.order = { ...where.order, createdAt: {} };
      if (filters.startDate) where.order.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.order.createdAt.lte = new Date(filters.endDate);
    }

    const items = await prisma.orderItem.findMany({
      where,
      include: { product: { include: { category: true, analytics: true } } },
    });

    const categoryMap = new Map<number, any>();

    for (const item of items) {
      const categoryId = item.product.categoryId;
      const categoryName = item.product.category.name;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalSales: 0,
          totalItems: 0,
          totalRevenue: 0,
        });
      }

      const cat = categoryMap.get(categoryId);
      cat.totalSales += 1;
      cat.totalItems += item.quantity;
      cat.totalRevenue += Number(item.totalPrice);
    }

    return Array.from(categoryMap.values());
  }

  async getTopProducts(filters: AnalyticsFilterInput & { limit?: number }) {
    const { limit = 10, startDate, endDate } = filters;

    const where: any = { order: { status: { in: ['DELIVERED', 'SHIPPED'] } } };

    if (startDate || endDate) {
      where.order = { ...where.order, createdAt: {} };
      if (startDate) where.order.createdAt.gte = new Date(startDate);
      if (endDate) where.order.createdAt.lte = new Date(endDate);
    }

    const items = await prisma.orderItem.findMany({
      where,
      include: { product: { include: { analytics: true } } },
    });

    const productMap = new Map<number, any>();

    for (const item of items) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName,
          sku: item.productSku,
          unitsSold: 0,
          revenue: 0,
        });
      }

      const prod = productMap.get(item.productId);
      prod.unitsSold += item.quantity;
      prod.revenue += Number(item.totalPrice);
    }

    const sorted = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    return sorted;
  }

  async getOverviewMetrics(filters: { period?: OverviewPeriod; warehouseId?: number }) {
    const period = filters.period || 'today';
    const { currentStart, currentEnd, previousStart, previousEnd, comparisonLabel } = getPeriodRanges(period);

    const manualSaleWhereCurrent: Prisma.ManualSaleWhereInput = {
      createdAt: { gte: currentStart, lte: currentEnd },
      ...(filters.warehouseId ? { branchId: filters.warehouseId } : {}),
    };

    const manualSaleWherePrevious: Prisma.ManualSaleWhereInput = {
      createdAt: { gte: previousStart, lte: previousEnd },
      ...(filters.warehouseId ? { branchId: filters.warehouseId } : {}),
    };

    const [
      currentManualSaleAggregate,
      previousManualSaleAggregate,
      manualSalesInRange,
      manualSaleItems,
      totalProducts,
      inventoryRows,
    ] = await Promise.all([
      prisma.manualSale.aggregate({
        where: manualSaleWhereCurrent,
        _sum: { totalAmount: true, totalQty: true },
        _count: { _all: true },
      }),
      prisma.manualSale.aggregate({
        where: manualSaleWherePrevious,
        _sum: { totalAmount: true, totalQty: true },
        _count: { _all: true },
      }),
      prisma.manualSale.findMany({
        where: manualSaleWhereCurrent,
        select: {
          createdAt: true,
          totalAmount: true,
        },
      }),
      prisma.manualSaleItem.findMany({
        where: {
          manualSale: manualSaleWhereCurrent,
        },
        select: {
          productId: true,
          productNameSnapshot: true,
          productSkuSnapshot: true,
          quantity: true,
          lineTotal: true,
          product: {
            select: {
              costPrice: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          manualSale: {
            select: {
              createdAt: true,
            },
          },
        },
      }),
      prisma.product.count({
        where: {
          isActive: true,
          ...(filters.warehouseId
            ? {
                inventories: {
                  some: {
                    warehouseId: filters.warehouseId,
                  },
                },
              }
            : {}),
        },
      }),
      prisma.inventory.findMany({
        where: {
          ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
          product: { isActive: true },
        },
        select: {
          quantity: true,
          lowStockThreshold: true,
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const currentRevenue = toNumber(currentManualSaleAggregate._sum.totalAmount);
    const previousRevenue = toNumber(previousManualSaleAggregate._sum.totalAmount);
    const currentTransactions = currentManualSaleAggregate._count._all;
    const previousTransactions = previousManualSaleAggregate._count._all;

    const salesDeltaPercent =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    const transactionDelta = currentTransactions - previousTransactions;
    const currentAvgTicket = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;
    const previousAvgTicket = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;
    const avgTicketDelta = currentAvgTicket - previousAvgTicket;

    const trendBucketCount = 6;
    const trendDurationMs = Math.max(1, currentEnd.getTime() - currentStart.getTime());
    const bucketSizeMs = trendDurationMs / trendBucketCount;
    const trendBuckets = Array.from({ length: trendBucketCount }, () => ({
      revenue: 0,
      cost: 0,
      transactions: 0,
    }));

    for (const sale of manualSalesInRange) {
      const elapsed = sale.createdAt.getTime() - currentStart.getTime();
      const idx = Math.min(trendBucketCount - 1, Math.max(0, Math.floor(elapsed / bucketSizeMs)));
      trendBuckets[idx].revenue += toNumber(sale.totalAmount);
      trendBuckets[idx].transactions += 1;
    }

    for (const item of manualSaleItems) {
      const elapsed = item.manualSale.createdAt.getTime() - currentStart.getTime();
      const idx = Math.min(trendBucketCount - 1, Math.max(0, Math.floor(elapsed / bucketSizeMs)));
      trendBuckets[idx].cost += toNumber(item.product.costPrice) * item.quantity;
    }

    const categorySalesMap = new Map<string, { categoryName: string; totalRevenue: number; totalItems: number }>();
    const topProductsMap = new Map<number, {
      productId: number;
      productName: string;
      sku: string;
      unitsSold: number;
      revenue: number;
    }>();

    for (const item of manualSaleItems) {
      const categoryName = item.product.category?.name || 'Uncategorized';
      const categoryBucket = categorySalesMap.get(categoryName) || {
        categoryName,
        totalRevenue: 0,
        totalItems: 0,
      };
      categoryBucket.totalRevenue += toNumber(item.lineTotal);
      categoryBucket.totalItems += item.quantity;
      categorySalesMap.set(categoryName, categoryBucket);

      const productBucket = topProductsMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productNameSnapshot,
        sku: item.productSkuSnapshot,
        unitsSold: 0,
        revenue: 0,
      };
      productBucket.unitsSold += item.quantity;
      productBucket.revenue += toNumber(item.lineTotal);
      topProductsMap.set(item.productId, productBucket);
    }

    const categoryDistributionMap = new Map<string, number>();
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const row of inventoryRows) {
      const categoryName = row.product.category?.name || 'Uncategorized';
      categoryDistributionMap.set(categoryName, (categoryDistributionMap.get(categoryName) || 0) + 1);

      if (row.quantity <= 0) {
        outOfStockCount += 1;
      } else if (row.quantity <= row.lowStockThreshold) {
        lowStockCount += 1;
      }
    }

    const alertItems = inventoryRows
      .filter((row) => row.quantity <= row.lowStockThreshold)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 8)
      .map((row) => ({
        productId: row.product.id,
        productName: row.product.name,
        sku: row.product.sku,
        categoryName: row.product.category?.name || 'Uncategorized',
        quantity: row.quantity,
        threshold: row.lowStockThreshold,
        status: row.quantity <= 0 ? 'out' : 'low',
      }));

    const salesByCategory = Array.from(categorySalesMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 6)
      .map((entry) => ({
        ...entry,
        sharePercent: currentRevenue > 0 ? (entry.totalRevenue / currentRevenue) * 100 : 0,
      }));

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    return {
      period,
      range: {
        startDate: currentStart.toISOString(),
        endDate: currentEnd.toISOString(),
        comparisonLabel,
      },
      manualSales: {
        totalSales: currentRevenue,
        totalQty: toNumber(currentManualSaleAggregate._sum.totalQty),
        transactions: currentTransactions,
        avgTicket: currentAvgTicket,
        salesDeltaPercent,
        transactionDelta,
        avgTicketDelta,
      },
      trend: {
        revenue: trendBuckets.map((bucket) => Math.round(bucket.revenue)),
        cost: trendBuckets.map((bucket) => Math.round(bucket.cost)),
        transactions: trendBuckets.map((bucket) => bucket.transactions),
        avgTicket: trendBuckets.map((bucket) =>
          bucket.transactions > 0 ? Math.round(bucket.revenue / bucket.transactions) : 0
        ),
      },
      inventory: {
        totalProducts,
        lowStockCount,
        outOfStockCount,
        categoryDistribution: Array.from(categoryDistributionMap.entries())
          .map(([categoryName, count]) => ({ categoryName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6),
        alertItems,
      },
      salesByCategory,
      topProducts,
    };
  }

  async getCustomerAnalytics(filters: AnalyticsFilterInput) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { orders: true },
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.orders.length > 0).length;
    const avgOrdersPerCustomer = activeCustomers > 0 ? customers.reduce((sum, c) => sum + c.orders.length, 0) / activeCustomers : 0;
    const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);
    const avgSpentPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    const segments = {
      vip: customers.filter(c => c.segment === 'VIP').length,
      regular: customers.filter(c => c.segment === 'REGULAR').length,
      new: customers.filter(c => c.segment === 'NEW').length,
      inactive: customers.filter(c => c.segment === 'INACTIVE').length,
    };

    return {
      totalCustomers,
      activeCustomers,
      avgOrdersPerCustomer,
      totalSpent,
      avgSpentPerCustomer,
      segments,
    };
  }

  async getInvoiceData(filters: AnalyticsFilterInput) {
    const where: any = {};

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true, payment: true, customer: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return orders.map(order => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.customer?.user.firstName + ' ' + order.customer?.user.lastName || 'N/A',
      status: order.status,
      paymentStatus: order.payment?.status,
      total: order.total,
      itemCount: order.items.length,
    }));
  }

  async getCustomReport(query: any) {
    // Flexible reporting based on query parameters
    const { entityType, metric, groupBy, startDate, endDate } = query;

    if (entityType === 'orders' && metric === 'count') {
      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const count = await prisma.order.count({ where });
      return { entityType, metric, value: count };
    }

    if (entityType === 'products' && metric === 'total') {
      const count = await prisma.product.count();
      return { entityType, metric, value: count };
    }

    if (entityType === 'inventory' && metric === 'totalQuantity') {
      const inventory = await prisma.inventory.findMany();
      const total = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      return { entityType, metric, value: total };
    }

    return { error: 'Invalid report query' };
  }
}

export default new AnalyticsService();
