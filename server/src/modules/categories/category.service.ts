import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/slug';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

export class CategoryService {
  async createCategory(data: CreateCategoryInput) {
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findFirst({ where: { slug } });

    if (existing) {
      if (!existing.isActive) {
        // If it exists but is inactive, reactivate it and update its data
        return await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            isActive: true,
            sortOrder: data.sortOrder || 0,
            branchId: data.branchId,
          },
        });
      }
      throw new ConflictError('Category with this name already exists');
    }

    return await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder || 0,
        branchId: data.branchId,
      },
    });
  }

  async getCategoryBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { products: { where: { isActive: true } } },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async listCategories(filters?: { branchId?: number; includeInactive?: boolean }) {
    const where: any = {};

    if (!filters?.includeInactive) {
      where.isActive = true;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    return await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id: Number(id) } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name: data.name,
        slug: data.name ? generateSlug(data.name) : undefined,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
        branchId: data.branchId,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id: Number(id) } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Hard delete for categories as requested for products
    return await prisma.category.delete({
      where: { id: Number(id) },
    });
  }

  async updateCategoryStatus(id: number, data: { isActive?: boolean }) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await prisma.category.update({
      where: { id },
      data: { isActive: data.isActive },
    });
  }
}

export default new CategoryService();
