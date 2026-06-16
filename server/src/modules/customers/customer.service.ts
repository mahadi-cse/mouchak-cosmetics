import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { UpdateCustomerInput, UpdateLoyaltyPointsInput } from './customer.schema';
import authService from '../auth/auth.service';

export class CustomerService {
  async listCustomers(filters: {
    page?: number;
    limit?: number;
    search?: string;
    segment?: string;
  }) {
    const { page = 1, limit = 10, search, segment } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (segment) {
      where.segment = segment;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          user: true,
          orders: { take: 5, orderBy: { createdAt: 'desc' } },
          wishlist: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map(c => ({
        id: c.id,
        firstName: c.firstName || c.user?.firstName,
        lastName: c.lastName || c.user?.lastName,
        user: c.user,
        dateOfBirth: c.dateOfBirth,
        gender: c.gender,
        address: c.defaultAddress,
        city: c.city,
        postalCode: c.postalCode,
        country: c.country,
        loyaltyPoints: c.loyaltyPoints,
        totalSpent: c.totalSpent,
        totalOrders: c.totalOrders,
        lastOrderAt: c.lastOrderAt,
        segment: c.segment,
      })),
      total,
      page,
      limit,
    };
  }

  async getCustomerDetails(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: true,
        orders: {
          include: { items: true, payment: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        wishlist: { include: { product: true } },
      },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    return customer;
  }

  async updateCustomer(customerId: number, data: UpdateCustomerInput) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    return await prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        defaultAddress: data.defaultAddress,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
      },
      include: { user: true },
    });
  }

  async getCustomerOrders(customerId: number, filters: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const { page = 1, limit = 10, status } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = { customerId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, payment: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
    };
  }

  async updateLoyaltyPoints(customerId: number, data: UpdateLoyaltyPointsInput) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    let newPoints = customer.loyaltyPoints;

    if (data.action === 'ADD') {
      newPoints += data.points;
    } else if (data.action === 'SUBTRACT') {
      newPoints = Math.max(0, newPoints - data.points);
    } else if (data.action === 'SET') {
      newPoints = data.points;
    }

    return await prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyPoints: newPoints },
    });
  }

  async deleteCustomer(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    // Delete user and cascade delete customer
    await prisma.user.delete({
      where: { id: customer.userId },
    });

    return { success: true };
  }

  async getCustomerMetrics(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        user: true,
        orders: {
          include: { items: true },
        },
      },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    const totalOrders = customer.orders.length;
    const totalItems = customer.orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0), 0);
    const avgOrderValue = customer.totalSpent && totalOrders > 0 ? Number(customer.totalSpent) / totalOrders : 0;

    return {
      customerId: customer.id,
      customerName: customer.firstName + ' ' + customer.lastName,
      totalOrders,
      totalSpent: customer.totalSpent,
      avgOrderValue,
      lastOrderDate: customer.lastOrderAt,
      loyaltyPoints: customer.loyaltyPoints,
      segment: customer.segment,
      totalItemsPurchased: totalItems,
    };
  }

  async toggleCustomerStatus(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer || !customer.user) throw new NotFoundError('Customer not found');

    const newStatus = !customer.user.isActive;

    await prisma.user.update({
      where: { id: customer.user.id },
      data: { isActive: newStatus },
    });

    // If deactivated, revoke all their sessions automatically
    if (!newStatus) {
      await authService.revokeAllUserRefreshTokens(customer.user.id);
    }

    return { isActive: newStatus };
  }

  async resetCustomerPassword(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer || !customer.user) throw new NotFoundError('Customer not found');

    // Generate a secure random 8-character password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: customer.user.id },
      data: { password: hashedPassword },
    });

    // Revoke all sessions since password was reset
    await authService.revokeAllUserRefreshTokens(customer.user.id);

    return { newPassword };
  }

  async revokeCustomerSessions(customerId: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) throw new NotFoundError('Customer not found');

    await authService.revokeAllUserRefreshTokens(customer.userId);

    return { success: true };
  }
}

export default new CustomerService();
