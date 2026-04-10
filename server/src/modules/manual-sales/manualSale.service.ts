import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { CreateManualSaleInput } from './manualSale.schema';

const toNumber = (value: Prisma.Decimal | number | string) => Number(value);

export class ManualSaleService {
  async createManualSale(data: CreateManualSaleInput) {
    if (!data.branchId) {
      throw new ConflictError('Branch is required to record a sale');
    }
    const productIds = data.items.map((i) => i.productId);
    const uniqueProductIds = [...new Set(productIds)];

    return prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: uniqueProductIds } },
        include: {
          inventories: {
            where: { warehouseId: data.branchId },
          },
        },
      });

      if (products.length !== uniqueProductIds.length) {
        throw new NotFoundError('One or more products were not found');
      }

      const productMap = new Map(products.map((p) => [p.id, p]));
      const productQtyMap = data.items.reduce<Record<number, number>>((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
        return acc;
      }, {});

      for (const [productIdStr, requestedQty] of Object.entries(productQtyMap)) {
        const productId = Number(productIdStr);
        const product = productMap.get(productId);
        const inventory = product?.inventories[0];
        if (!inventory) {
          throw new ConflictError(`Product ${product?.name || productId} is not stocked in this branch`);
        }
        if (inventory.quantity < requestedQty) {
          throw new ConflictError(`Insufficient stock for product ${product.name}`);
        }
      }

      const lineItems = data.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const unitPrice = item.unitPrice && item.unitPrice > 0 ? item.unitPrice : toNumber(product.price);
        const lineTotal = unitPrice * item.quantity;
        return {
          productId: product.id,
          productNameSnapshot: product.name,
          productSkuSnapshot: product.sku,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        };
      });

      const totalQty = lineItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

      const count = await tx.manualSale.count();
      const saleNumber = `MS-${String(count + 1).padStart(6, '0')}`;

      const sale = await tx.manualSale.create({
        data: {
          saleNumber,
          totalAmount,
          totalQty,
          branchId: data.branchId,
          branchName: data.branchName,
          note: data.note,
          soldBy: data.soldBy || 'Staff',
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              productNameSnapshot: item.productNameSnapshot,
              productSkuSnapshot: item.productSkuSnapshot,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const [productIdStr, requestedQty] of Object.entries(productQtyMap)) {
        const productId = Number(productIdStr);
        const product = productMap.get(productId)!;
        const inventory = product.inventories[0]!;
        const beforeQty = inventory.quantity;
        const afterQty = beforeQty - requestedQty;

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: requestedQty } },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: 'POS_SALE',
            quantity: -requestedQty,
            balanceBefore: beforeQty,
            balanceAfter: afterQty,
            reference: saleNumber,
            notes: `Manual sale recorded (${saleNumber})`,
          },
        });
      }

      return {
        id: sale.id,
        saleNumber: sale.saleNumber,
        totalQty: sale.totalQty,
        totalAmount: toNumber(sale.totalAmount),
        branchId: sale.branchId,
        branchName: sale.branchName,
        soldBy: sale.soldBy,
        note: sale.note,
        createdAt: sale.createdAt,
        items: sale.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          productSkuSnapshot: item.productSkuSnapshot,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          lineTotal: toNumber(item.lineTotal),
        })),
      };
    });
  }

  async listManualSales(filters: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'createdAt' | 'totalAmount' | 'totalQty' | 'saleNumber';
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
    const { skip, take } = parsePagination({ page, limit });
    const where: Prisma.ManualSaleWhereInput = search
      ? {
          OR: [
            { saleNumber: { contains: search, mode: 'insensitive' } },
            { branchName: { contains: search, mode: 'insensitive' } },
            { soldBy: { contains: search, mode: 'insensitive' } },
            { note: { contains: search, mode: 'insensitive' } },
            {
              items: {
                some: {
                  OR: [
                    { productNameSnapshot: { contains: search, mode: 'insensitive' } },
                    { productSkuSnapshot: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : {};
    const orderBy: Prisma.ManualSaleOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [sales, total] = await Promise.all([
      prisma.manualSale.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { items: true },
      }),
      prisma.manualSale.count({ where }),
    ]);

    return {
      data: sales.map((sale) => ({
        id: sale.id,
        saleNumber: sale.saleNumber,
        totalQty: sale.totalQty,
        totalAmount: toNumber(sale.totalAmount),
        branchId: sale.branchId,
        branchName: sale.branchName,
        soldBy: sale.soldBy,
        note: sale.note,
        createdAt: sale.createdAt,
        items: sale.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          productSkuSnapshot: item.productSkuSnapshot,
          quantity: item.quantity,
          unitPrice: toNumber(item.unitPrice),
          lineTotal: toNumber(item.lineTotal),
        })),
      })),
      total,
      page,
      limit,
    };
  }
}

export default new ManualSaleService();
