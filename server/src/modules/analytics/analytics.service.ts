import { prisma } from '../../config/database';
import { AnalyticsFilterInput } from './analytics.schema';

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
