import { prisma } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { CreateBranchInput, UpdateBranchInput } from './branch.schema';

const toBranchDto = (branch: any, stock = 0, orders = 0, revenue = 0) => ({
  id: branch.id,
  name: branch.name,
  branchCode: branch.branchCode,
  city: branch.city,
  address: branch.address,
  phone: branch.phone,
  email: branch.email,
  managerName: branch.managerName,
  managerPhone: branch.managerPhone,
  branchType: branch.branchType,
  active: branch.isActive,
  stock,
  orders,
  revenue,
});

export class BranchService {
  async listBranches() {
    const [branches, inventoryByBranch, manualSalesByBranch] = await Promise.all([
      prisma.branch.findMany({
        orderBy: [{ isActive: 'desc' }, { id: 'asc' }],
      }),
      prisma.inventory.groupBy({
        by: ['warehouseId'],
        _sum: { quantity: true },
      }),
      prisma.manualSale.groupBy({
        by: ['branchId'],
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
    ]);

    const stockMap = new Map<number, number>(
      inventoryByBranch
        .filter((row) => row.warehouseId !== null)
        .map((row) => [row.warehouseId as number, row._sum.quantity || 0])
    );
    const salesMap = new Map<number, { orders: number; revenue: number }>(
      manualSalesByBranch
        .filter((row) => row.branchId !== null)
        .map((row) => [
          row.branchId as number,
          {
            orders: row._count._all || 0,
            revenue: Number(row._sum.totalAmount || 0),
          },
        ])
    );

    return branches.map((branch) => {
      const sales = salesMap.get(branch.id);
      return toBranchDto(
        branch,
        stockMap.get(branch.id) || 0,
        sales?.orders || 0,
        sales?.revenue || 0
      );
    });
  }

  async createBranch(data: CreateBranchInput) {
    const existing = await prisma.branch.findFirst({
      where: {
        OR: [{ name: data.name }, { branchCode: data.branchCode }],
      },
    });
    if (existing) {
      throw new ConflictError('Branch name or code already exists');
    }

    const branch = await prisma.branch.create({
      data: {
        name: data.name,
        branchCode: data.branchCode,
        branchType: data.branchType,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        email: data.email || null,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        isActive: data.isActive ?? true,
      },
    });

    return toBranchDto(branch);
  }

  async updateBranch(id: number, data: UpdateBranchInput) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError('Branch not found');

    if (data.name || data.branchCode) {
      const duplicate = await prisma.branch.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(data.name ? [{ name: data.name }] : []),
            ...(data.branchCode ? [{ branchCode: data.branchCode }] : []),
          ],
        },
      });
      if (duplicate) {
        throw new ConflictError('Branch name or code already exists');
      }
    }

    const updated = await prisma.branch.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email,
      },
    });

    return toBranchDto(updated);
  }

  async setBranchStatus(id: number, isActive: boolean) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundError('Branch not found');

    const updated = await prisma.branch.update({
      where: { id },
      data: { isActive },
    });

    return toBranchDto(updated);
  }
}

export default new BranchService();
