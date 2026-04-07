import { prisma } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { AdjustStockInput, TransferStockInput, ReconcileStockInput } from './inventory.schema';
import { InventoryTransactionType } from '@prisma/client';

export class InventoryService {
  async getInventorySummary(filters: {
    page?: number;
    limit?: number;
    warehouseId?: number;
    lowStockOnly?: boolean;
  }) {
    const { page = 1, limit = 10, warehouseId, lowStockOnly } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (lowStockOnly) where.quantity = { lte: prisma.inventory.fields.lowStockThreshold };

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: { product: true, branch: true, transactions: { take: 5, orderBy: { createdAt: 'desc' } } },
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    return {
      data: data.map(inv => ({
        id: inv.id,
        product: { id: inv.product.id, name: inv.product.name, sku: inv.product.sku },
        quantity: inv.quantity,
        reservedQty: inv.reservedQty,
        availableQty: inv.quantity - inv.reservedQty,
        lowStockThreshold: inv.lowStockThreshold,
        reorderPoint: inv.reorderPoint,
        warehouse: inv.branch?.name || 'N/A',
        lastCountedAt: inv.lastCountedAt,
      })),
      total,
      page,
      limit,
    };
  }

  async getProductStockDetails(productId: number) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Product not found');

    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: {
        branch: true,
        product: true,
      },
    });

    if (!inventory) throw new NotFoundError('Inventory record not found');

    return {
      productId,
      product: { name: product.name, sku: product.sku },
      totalQuantity: inventory.quantity,
      totalReserved: inventory.reservedQty,
      availableQty: inventory.quantity - inventory.reservedQty,
      warehouse: inventory.branch?.name || 'Main Warehouse',
      lowStockThreshold: inventory.lowStockThreshold,
      reorderPoint: inventory.reorderPoint,
      reorderQuantity: inventory.reorderQuantity,
      lastCountedAt: inventory.lastCountedAt,
    };
  }

  async adjustStock(data: AdjustStockInput) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: data.productId },
    });

    if (!inventory) throw new NotFoundError('Inventory not found');

    const newBalance = inventory.quantity + data.quantity;

    const transaction = await prisma.inventoryTransaction.create({
      data: {
        inventoryId: inventory.id,
        type: data.type as InventoryTransactionType,
        quantity: data.quantity,
        balanceBefore: inventory.quantity,
        balanceAfter: newBalance,
        reference: data.reference,
        notes: data.notes,
      },
    });

    await prisma.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newBalance },
    });

    return transaction;
  }

  async transferStock(data: TransferStockInput) {
    const fromInventory = await prisma.inventory.findUnique({
      where: { productId: data.productId },
    });

    if (!fromInventory) throw new NotFoundError('Inventory not found');
    if (fromInventory.quantity < data.quantity) {
      throw new ConflictError('Insufficient stock for transfer');
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        productId: data.productId,
        inventoryId: fromInventory.id,
        fromWarehouseId: data.fromWarehouseId,
        toWarehouseId: data.toWarehouseId,
        quantity: data.quantity,
        notes: data.notes,
        referenceNumber: `ST-${Date.now()}`,
        initiatedBy: 1, // TODO: Get from auth context
      },
    });

    // Deduct from source inventory
    await prisma.inventory.update({
      where: { id: fromInventory.id },
      data: {
        quantity: { decrement: data.quantity },
      },
    });

    // Record transaction
    await prisma.inventoryTransaction.create({
      data: {
        inventoryId: fromInventory.id,
        type: 'ADJUSTMENT',
        quantity: -data.quantity,
        balanceBefore: fromInventory.quantity,
        balanceAfter: fromInventory.quantity - data.quantity,
        reference: transfer.referenceNumber,
        notes: `Transfer to warehouse ${data.toWarehouseId}: ${data.notes}`,
      },
    });

    return transfer;
  }

  async getLowStockItems(filters: {
    warehouseId?: number;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, warehouseId } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = {
      quantity: { lt: prisma.inventory.fields.lowStockThreshold },
    };

    if (warehouseId) where.warehouseId = warehouseId;

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: { product: true, branch: true },
        skip,
        take,
        orderBy: { quantity: 'asc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    return {
      data: data.map(inv => ({
        productId: inv.productId,
        name: inv.product.name,
        sku: inv.product.sku,
        currentStock: inv.quantity,
        lowStockThreshold: inv.lowStockThreshold,
        reorderPoint: inv.reorderPoint,
        warehouse: inv.branch?.name || 'Main',
      })),
      total,
      page,
      limit,
    };
  }

  async getInventoryHistory(productId: number, filters: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
  }) {
    const { page = 1, limit = 10, startDate, endDate, type } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const inventory = await prisma.inventory.findUnique({
      where: { productId },
    });

    if (!inventory) throw new NotFoundError('Inventory not found');

    const where: any = { inventoryId: inventory.id };

    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async reconcileStock(data: ReconcileStockInput) {
    const results = { reconciled: 0, errors: [] as any[] };

    for (const item of data.items) {
      try {
        const inventory = await prisma.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (!inventory) {
          results.errors.push({ productId: item.productId, error: 'Inventory not found' });
          continue;
        }

        const difference = item.physicalCount - inventory.quantity;

        if (difference !== 0) {
          await prisma.inventoryTransaction.create({
            data: {
              inventoryId: inventory.id,
              type: 'ADJUSTMENT',
              quantity: difference,
              balanceBefore: inventory.quantity,
              balanceAfter: item.physicalCount,
              reference: `RECONCILE-${data.warehouseId}`,
              notes: data.notes || 'Stock reconciliation',
            },
          });

          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: item.physicalCount,
              lastCountedAt: new Date(),
            },
          });
        }

        results.reconciled++;
      } catch (error: any) {
        results.errors.push({ productId: item.productId, error: error.message });
      }
    }

    return results;
  }

  async getInventoryReports(filters: {
    reportType?: 'summary' | 'detailed' | 'valuation';
    startDate?: string;
    endDate?: string;
    warehouseId?: number;
  }) {
    const where: any = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;

    const inventory = await prisma.inventory.findMany({
      where,
      include: { product: true, branch: true },
    });

    if (filters.reportType === 'summary') {
      return {
        totalItems: inventory.length,
        totalQuantity: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        totalReserved: inventory.reduce((sum, inv) => sum + inv.reservedQty, 0),
        totalValue: inventory.reduce((sum, inv) => sum + (inv.product.costPrice ? Number(inv.product.costPrice) * inv.quantity : 0), 0),
        lowStockCount: inventory.filter(inv => inv.quantity < inv.lowStockThreshold).length,
      };
    }

    if (filters.reportType === 'valuation') {
      return inventory.map(inv => ({
        productId: inv.productId,
        name: inv.product.name,
        sku: inv.product.sku,
        quantity: inv.quantity,
        costPrice: inv.product.costPrice,
        totalValue: inv.quantity * (Number(inv.product.costPrice) || 0),
      }));
    }

    // Detailed report
    return inventory.map(inv => ({
      id: inv.id,
      product: { id: inv.productId, name: inv.product.name, sku: inv.product.sku },
      quantity: inv.quantity,
      reservedQty: inv.reservedQty,
      availableQty: inv.quantity - inv.reservedQty,
      warehouse: inv.branch?.name || 'Main',
      lastCountedAt: inv.lastCountedAt,
    }));
  }
}

export default new InventoryService();
