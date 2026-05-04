import { prisma } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import {
  CreateCodOrderInput,
  CreateOrderInput,
  UpdateOrderInput,
  UpdateOrderStatusInput,
  CreateReturnInput,
  ProcessRefundInput,
} from './order.schema';

export class OrderService {
  private readonly trackingTitleMap: Record<string, string> = {
    PENDING: 'Order placed',
    CONFIRMED: 'Order confirmed',
    PROCESSING: 'Order processing',
    SHIPPED: 'Order shipped',
    DELIVERED: 'Order delivered',
    CANCELLED: 'Order cancelled',
    REFUNDED: 'Order refunded',
  };

  private async appendTrackingEvent(orderId: number, status: string, description?: string) {
    const title = this.trackingTitleMap[status] || `Status updated to ${status}`;

    await prisma.orderTrackingEvent.create({
      data: {
        orderId,
        status: status as any,
        title,
        description,
      },
    });
  }

  private async getOrCreateCustomerByUserId(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        isActive: true,
        customer: {
          select: {
            id: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundError('Authenticated user not found');
    }

    if (user.customer?.isActive) {
      return user.customer.id;
    }

    if (user.customer && !user.customer.isActive) {
      const reactivated = await prisma.customer.update({
        where: { userId: user.id },
        data: { isActive: true },
        select: { id: true },
      });
      return reactivated.id;
    }

    const created = await prisma.customer.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || null,
        defaultAddress: user.address || null,
      },
      select: { id: true },
    });

    return created.id;
  }

  async createOrder(data: CreateOrderInput) {
    // Validate products exist and have stock
    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map(item => item.productId) } },
      include: { inventories: { orderBy: { warehouseId: 'asc' }, take: 1 } },
    });

    if (products.length !== data.items.length) {
      throw new NotFoundError('One or more products not found');
    }

    // Check stock availability
    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId);
      const inventory = product?.inventories?.[0];
      if (!inventory || (inventory.quantity - inventory.reservedQty) < item.quantity) {
        throw new ConflictError(`Insufficient stock for product ${product?.name}`);
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;
      return {
        product,
        ...item,
        unitPrice: product.price,
        totalPrice: itemTotal,
      };
    });

    const total =
      subtotal +
      (data.discountAmount || 0) +
      (data.shippingCharge || 0) +
      (data.taxAmount || 0);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        channel: data.channel,
        shippingName: data.shippingName,
        shippingPhone: data.shippingPhone,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPostal: data.shippingPostal,
        shippingCountry: data.shippingCountry,
        subtotal: subtotal,
        discountAmount: data.discountAmount || 0,
        shippingCharge: data.shippingCharge || 0,
        taxAmount: data.taxAmount || 0,
        total: total,
        notes: data.notes,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            productName: item.product.name,
            productSku: item.product.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // Reserve inventory
    for (const item of data.items) {
      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
        orderBy: { warehouseId: 'asc' },
      });
      if (!inventory) throw new NotFoundError(`Inventory not found for product ${item.productId}`);
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedQty: { increment: item.quantity },
        },
      });
    }

    // Create payment record
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: data.paymentMethod || 'CASH',
        status: data.paymentMethod === 'SSLCOMMERZ' ? 'INITIATED' : 'PENDING',
        amount: total,
        tranId: (data as any).transactionId || undefined,
      },
    });

    await this.appendTrackingEvent(order.id, 'PENDING', 'Cash on delivery order has been placed');

    return order;
  }

  async createCodOrder(data: CreateCodOrderInput, userId: number) {
    const customerId = await this.getOrCreateCustomerByUserId(userId);

    return this.createOrder({
      customerId,
      channel: 'ONLINE',
      paymentMethod: data.paymentMethod || 'CASH',
      transactionId: (data as any).transactionId,
      discountAmount: 0,
      shippingCharge: 0,
      taxAmount: 0,
      items: [
        {
          productId: data.productId,
          quantity: data.quantity,
        },
      ],
      shippingName: data.shippingName,
      shippingPhone: data.shippingPhone,
      shippingAddress: data.shippingAddress,
      shippingCity: data.shippingCity,
      shippingPostal: data.shippingPostal,
      shippingCountry: data.shippingCountry,
      notes: data.notes,
    });
  }

  async listOrders(filters: {
    page?: number;
    limit?: number;
    status?: string;
    channel?: string;
    customerId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const { page = 1, limit = 10, status, channel, customerId, startDate, endDate, search } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = {};
    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (customerId) where.customerId = customerId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { shippingName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          customer: { include: { user: true } },
          payment: true,
          trackingEvents: {
            orderBy: { createdAt: 'asc' },
          },
        },
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

  async getOrderDetails(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true, return: true } },
        customer: { include: { user: true } },
        staffUser: true,
        payment: { include: { refunds: true } },
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: true,
      },
    });

    if (!order) throw new NotFoundError('Order not found');

    return order;
  }

  async updateOrder(orderId: number, data: UpdateOrderInput) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');

    return await prisma.order.update({
      where: { id: orderId },
      data: {
        notes: data.notes,
      },
      include: { items: true, customer: true, payment: true },
    });
  }

  async updateOrderStatus(orderId: number, data: UpdateOrderStatusInput) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');

    const updateData: any = { status: data.status };

    if (data.status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (data.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      // Release reserved inventory
      const items = await prisma.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const inventory = await prisma.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { warehouseId: 'asc' },
        });
        if (!inventory) throw new NotFoundError(`Inventory not found for product ${item.productId}`);
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedQty: { decrement: item.quantity },
            quantity: { decrement: item.quantity },
          },
        });
      }
    } else if (data.status === 'CANCELLED') {
      // Release reserved inventory
      const items = await prisma.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const inventory = await prisma.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { warehouseId: 'asc' },
        });
        if (!inventory) throw new NotFoundError(`Inventory not found for product ${item.productId}`);
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            reservedQty: { decrement: item.quantity },
          },
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payment: true },
    });

    await this.appendTrackingEvent(orderId, data.status);

    return updatedOrder;
  }

  async getOrderTracking(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async addOrderNotes(orderId: number, notes: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order not found');

    return await prisma.order.update({
      where: { id: orderId },
      data: {
        notes: order.notes ? `${order.notes}\n${notes}` : notes,
      },
    });
  }

  async createReturn(data: CreateReturnInput) {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: data.orderItemId },
      include: { product: true },
    });

    if (!orderItem) throw new NotFoundError('Order item not found');

    const refundAmount = Number(orderItem.unitPrice) * data.returnedQuantity;

    const returnRecord = await prisma.return.create({
      data: {
        orderItemId: data.orderItemId,
        reason: data.reason,
        returnedQuantity: data.returnedQuantity,
        status: 'REQUESTED',
        refundAmount: refundAmount,
        notes: data.notes,
      },
    });

    return returnRecord;
  }

  async processRefund(data: ProcessRefundInput) {
    const returnRecord = await prisma.return.findUnique({
      where: { id: data.returnId },
      include: { orderItem: { include: { order: true } } },
    });

    if (!returnRecord) throw new NotFoundError('Return not found');

    const order = returnRecord.orderItem.order;
    const payment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (!payment) throw new NotFoundError('Payment not found');

    // Create refund
    const refund = await prisma.refund.create({
      data: {
        returnId: data.returnId,
        paymentId: payment.id,
        originalAmount: payment.amount,
        refundAmount: data.refundAmount,
        status: 'PENDING',
      },
    });

    // Update return status
    await prisma.return.update({
      where: { id: data.returnId },
      data: {
        status: 'REFUND_PROCESSED',
        refundedAt: new Date(),
      },
    });

    // Update order status if all items are returned
    const remainingItems = await prisma.orderItem.findMany({
      where: { orderId: order.id, return: null },
    });

    if (remainingItems.length === 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED' },
      });
    }

    return refund;
  }

  async markAsShipped(orderId: number) {
    return await this.updateOrderStatus(orderId, { status: 'SHIPPED' });
  }

  async cancelOrder(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundError('Order not found');

    if (['DELIVERED', 'REFUNDED'].includes(order.status)) {
      throw new ConflictError('Cannot cancel ' + order.status + ' order');
    }

    // Release reserved inventory
    for (const item of order.items) {
      const inventory = await prisma.inventory.findFirst({
        where: { productId: item.productId },
        orderBy: { warehouseId: 'asc' },
      });
      if (!inventory) throw new NotFoundError(`Inventory not found for product ${item.productId}`);
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedQty: { decrement: item.quantity },
        },
      });
    }

    return await this.updateOrderStatus(orderId, { status: 'CANCELLED' });
  }

  async generateInvoice(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        customer: { include: { user: true } },
        payment: true,
      },
    });

    if (!order) throw new NotFoundError('Order not found');

    return {
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: {
        name: order.shippingName,
        phone: order.shippingPhone,
        address: order.shippingAddress,
        city: order.shippingCity,
      },
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discountAmount,
      shipping: order.shippingCharge,
      tax: order.taxAmount,
      total: order.total,
      status: order.status,
      paymentStatus: order.payment?.status,
    };
  }
}

export default new OrderService();
