import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { NotFoundError } from '../../shared/utils/AppError';
import { parsePagination } from '../../shared/utils/pagination';
import { CreateSupplierInput, UpdateSupplierInput, CreateSupplierTransactionInput } from './supplier.schema';

const toNumber = (v: Prisma.Decimal | number | string | null | undefined) => Number(v || 0);

export class SupplierService {
  async createSupplier(data: CreateSupplierInput) {
    return prisma.supplier.create({ data: { name: data.name, email: data.email || null, phone: data.phone || null, address: data.address || null, rotationDays: data.rotationDays || null } });
  }

  async updateSupplier(id: number, data: UpdateSupplierInput) {
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Supplier not found');
    return prisma.supplier.update({ where: { id }, data });
  }

  async deleteSupplier(id: number) {
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Supplier not found');
    return prisma.supplier.delete({ where: { id } });
  }

  async listSuppliers(filters: { page?: number; limit?: number; search?: string; includeInactive?: boolean }) {
    const { page = 1, limit = 50, search, includeInactive } = filters;
    const { skip, take } = parsePagination({ page, limit });
    const where: Prisma.SupplierWhereInput = {};
    if (!includeInactive) where.isActive = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      prisma.supplier.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getSupplier(id: number) {
    const supplier = await prisma.supplier.findUnique({ where: { id }, include: { transactions: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 20 } } });
    if (!supplier) throw new NotFoundError('Supplier not found');
    return supplier;
  }

  async createTransaction(data: CreateSupplierTransactionInput) {
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier) throw new NotFoundError('Supplier not found');

    const productIds = [...new Set((data.items || []).map(i => i.productId))];
    let products = new Map<number, any>();
    if (productIds.length > 0) {
      const prods = await prisma.product.findMany({ where: { id: { in: productIds } } });
      products = new Map(prods.map(p => [p.id, p]));
    }

    const lineItems = (data.items || []).map(item => {
      const product = products.get(item.productId);
      return {
        productId: item.productId,
        productNameSnapshot: product?.name || `Product #${item.productId}`,
        productSkuSnapshot: product?.sku || 'N/A',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      };
    });

    const totalQty = lineItems.reduce((s, i) => s + i.quantity, 0);
    const computedAmount = lineItems.length > 0 ? lineItems.reduce((s, i) => s + i.lineTotal, 0) : data.totalAmount;

    const txn = await prisma.supplierTransaction.create({
      data: {
        supplierId: data.supplierId,
        branchId: data.branchId || null,
        branchName: data.branchName || null,
        direction: data.direction,
        totalAmount: computedAmount,
        totalQty,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        note: data.note || null,
        recordedBy: data.recordedBy || 'Staff',
        ...(lineItems.length > 0 ? { items: { create: lineItems } } : {}),
      },
      include: { items: true },
    });

    return {
      ...txn,
      totalAmount: toNumber(txn.totalAmount),
      items: txn.items.map(i => ({ ...i, unitPrice: toNumber(i.unitPrice), lineTotal: toNumber(i.lineTotal) })),
    };
  }

  async listTransactions(filters: { supplierId?: number; page?: number; limit?: number; search?: string; sortOrder?: 'asc' | 'desc' }) {
    const { page = 1, limit = 20, supplierId, search, sortOrder = 'desc' } = filters;
    const { skip, take } = parsePagination({ page, limit });
    const where: Prisma.SupplierTransactionWhereInput = {};
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { note: { contains: search, mode: 'insensitive' } },
        { branchName: { contains: search, mode: 'insensitive' } },
        { recordedBy: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { items: { some: { productNameSnapshot: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [data, total] = await Promise.all([
      prisma.supplierTransaction.findMany({ where, skip, take, orderBy: { createdAt: sortOrder }, include: { items: true, supplier: { select: { name: true } } } }),
      prisma.supplierTransaction.count({ where }),
    ]);
    return {
      data: data.map(t => ({ ...t, totalAmount: toNumber(t.totalAmount), items: t.items.map(i => ({ ...i, unitPrice: toNumber(i.unitPrice), lineTotal: toNumber(i.lineTotal) })) })),
      total, page, limit,
    };
  }
}

export default new SupplierService();
