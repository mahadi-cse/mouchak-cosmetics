import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { ListMyOrdersInput, UpdateMyProfileInput } from './customerDashboard.schema';

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
      customerName: `${customer.user.firstName} ${customer.user.lastName}`.trim(),
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
      firstName: customer.user.firstName,
      lastName: customer.user.lastName,
      phone: customer.user.phone,
      address: customer.user.address,
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

    const userUpdateData: Prisma.UserUpdateInput = {};
    const customerUpdateData: Prisma.CustomerUpdateInput = {};

    if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
    if (data.phone !== undefined) userUpdateData.phone = data.phone || null;
    if (data.address !== undefined) userUpdateData.address = data.address || null;

    if (data.dateOfBirth !== undefined) {
      customerUpdateData.dateOfBirth = this.normalizeOptionalDate(data.dateOfBirth);
    }
    if (data.gender !== undefined) customerUpdateData.gender = data.gender || null;
    if (data.defaultAddress !== undefined) customerUpdateData.defaultAddress = data.defaultAddress || null;
    if (data.city !== undefined) customerUpdateData.city = data.city || null;
    if (data.postalCode !== undefined) customerUpdateData.postalCode = data.postalCode || null;
    if (data.country !== undefined) customerUpdateData.country = data.country || 'Bangladesh';

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      if (Object.keys(customerUpdateData).length > 0) {
        await tx.customer.update({
          where: { id: customer.id },
          data: customerUpdateData,
        });
      }
    });

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
}

export default new CustomerDashboardService();