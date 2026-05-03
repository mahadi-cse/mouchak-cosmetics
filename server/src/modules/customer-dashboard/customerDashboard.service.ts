import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { CreateReturnRequestInput, ListMyOrdersInput, UpdateMyProfileInput } from './customerDashboard.schema';

class CustomerDashboardService {
  private async getCustomerByUserId(userId: number) {
    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!customer || !customer.isActive || !customer.user.isActive) {
      throw new NotFoundError('Customer profile not found');
    }

    return customer;
  }

  private normalizeOptionalDate(input?: string) {
    if (input === undefined) {
      return undefined;
    }

    if (!input) {
      return null;
    }

    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError('Invalid date format for dateOfBirth');
    }

    return parsed;
  }

  async getSummary(userId: number) {
    const customer = await this.getCustomerByUserId(userId);

    const [wishlistCount, totalOrders, activeOrders, trackableOrders, latestOrder] = await Promise.all([
      prisma.wishlist.count({ where: { customerId: customer.id } }),
      prisma.order.count({ where: { customerId: customer.id } }),
      prisma.order.count({
        where: {
          customerId: customer.id,
          status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
      }),
      prisma.order.count({
        where: {
          customerId: customer.id,
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED'] },
        },
      }),
      prisma.order.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      totalOrders,
      activeOrders,
      trackableOrders,
      wishlistCount,
      loyaltyPoints: customer.loyaltyPoints,
      totalSpent: customer.totalSpent,
      segment: customer.segment,
      latestOrder,
    };
  }

  async getProfile(userId: number) {
    const customer = await this.getCustomerByUserId(userId);

    return {
      id: customer.id,
      userId: customer.userId,
      email: customer.user.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: customer.defaultAddress,
      dateOfBirth: customer.dateOfBirth,
      gender: customer.gender,
      defaultAddress: customer.defaultAddress,
      city: customer.city,
      postalCode: customer.postalCode,
      country: customer.country,
      loyaltyPoints: customer.loyaltyPoints,
      totalSpent: customer.totalSpent,
      totalOrders: customer.totalOrders,
      lastOrderAt: customer.lastOrderAt,
      segment: customer.segment,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  async updateProfile(userId: number, data: UpdateMyProfileInput) {
    const customer = await this.getCustomerByUserId(userId);

    const customerUpdateData: Prisma.CustomerUpdateInput = {};

    if (data.firstName !== undefined) customerUpdateData.firstName = data.firstName;
    if (data.lastName !== undefined) customerUpdateData.lastName = data.lastName;
    if (data.phone !== undefined) customerUpdateData.phone = data.phone || null;
    if (data.address !== undefined) customerUpdateData.defaultAddress = data.address || null;

    if (data.dateOfBirth !== undefined) {
      customerUpdateData.dateOfBirth = this.normalizeOptionalDate(data.dateOfBirth);
    }
    if (data.gender !== undefined) customerUpdateData.gender = data.gender || null;
    if (data.defaultAddress !== undefined) customerUpdateData.defaultAddress = data.defaultAddress || null;
    if (data.city !== undefined) customerUpdateData.city = data.city || null;
    if (data.postalCode !== undefined) customerUpdateData.postalCode = data.postalCode || null;
    if (data.country !== undefined) customerUpdateData.country = data.country || 'Bangladesh';

    if (Object.keys(customerUpdateData).length > 0) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: customerUpdateData,
      });
    }

    return this.getProfile(userId);
  }

  async listOrders(userId: number, filters: ListMyOrdersInput) {
    const customer = await this.getCustomerByUserId(userId);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { skip, take } = parsePagination({ page, limit });

    const where: Prisma.OrderWhereInput = {
      customerId: customer.id,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? {
            OR: [
              { orderNumber: { contains: filters.search, mode: 'insensitive' } },
              { shippingName: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                },
              },
            },
          },
          payment: {
            select: {
              method: true,
              status: true,
              amount: true,
              paidAt: true,
            },
          },
          trackingEvents: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
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

  async getOrderTracking(userId: number, orderId: number) {
    const customer = await this.getCustomerByUserId(userId);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customer.id,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        shippedAt: true,
        deliveredAt: true,
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found for this customer');
    }

    return order;
  }

  async listWishlist(userId: number) {
    const customer = await this.getCustomerByUserId(userId);

    const wishlist = await prisma.wishlist.findMany({
      where: { customerId: customer.id },
      include: {
        product: {
          include: {
            category: true,
            inventories: {
              orderBy: { warehouseId: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return wishlist;
  }

  async addWishlistItem(userId: number, productId: number) {
    const customer = await this.getCustomerByUserId(userId);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or inactive');
    }

    return prisma.wishlist.upsert({
      where: {
        customerId_productId: {
          customerId: customer.id,
          productId,
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        productId,
      },
      include: {
        product: {
          include: {
            category: true,
            inventories: {
              orderBy: { warehouseId: 'asc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  async removeWishlistItem(userId: number, productId: number) {
    const customer = await this.getCustomerByUserId(userId);

    const deleted = await prisma.wishlist.deleteMany({
      where: {
        customerId: customer.id,
        productId,
      },
    });

    return {
      removed: deleted.count > 0,
      productId,
    };
  }

  async listMyReturns(userId: number, page = 1, limit = 10) {
    const customer = await this.getCustomerByUserId(userId);
    const { skip, take } = parsePagination({ page, limit });

    const where = {
      orderItem: {
        order: {
          customerId: customer.id,
        },
      },
    };

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          orderItem: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  createdAt: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.return.count({ where }),
    ]);

    return { data: returns, total, page, limit };
  }

  async createReturnRequest(userId: number, input: CreateReturnRequestInput) {
    const customer = await this.getCustomerByUserId(userId);

    // Verify the order item belongs to this customer
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: input.orderItemId,
        order: {
          customerId: customer.id,
          status: 'DELIVERED',
        },
      },
      include: {
        order: true,
        return: true,
      },
    });

    if (!orderItem) {
      throw new NotFoundError(
        'Order item not found, does not belong to you, or the order has not been delivered yet.',
      );
    }

    if (orderItem.return) {
      throw new ValidationError('A return request already exists for this item.');
    }

    if (input.returnedQuantity > orderItem.quantity) {
      throw new ValidationError(
        `Cannot return more than the ordered quantity (${orderItem.quantity}).`,
      );
    }

    const refundAmount = (Number(orderItem.unitPrice) * input.returnedQuantity).toFixed(2);

    const returnRecord = await prisma.return.create({
      data: {
        orderItemId: input.orderItemId,
        reason: input.reason,
        returnedQuantity: input.returnedQuantity,
        refundAmount: parseFloat(refundAmount),
        notes: input.notes || null,
        status: 'REQUESTED',
      },
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                status: true,
                createdAt: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return returnRecord;
  }
}

export default new CustomerDashboardService();