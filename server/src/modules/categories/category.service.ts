import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/slug';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';
import { cacheGet, cacheSet, cacheInvalidatePattern, TTL } from '../../shared/utils/cache';
import productService from '../products/product.service';

const KEYS = {
  list: (branchId?: number, includeInactive?: boolean) =>
    `categories:list:b${branchId ?? 'all'}:ia${includeInactive ? '1' : '0'}`,
  slug: (slug: string) => `categories:slug:${slug}`,
};

export class CategoryService {
  async createCategory(data: CreateCategoryInput) {
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findFirst({ where: { slug } });

    if (existing) {
      if (!existing.isActive) {
        const updated = await prisma.category.update({
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
        await cacheInvalidatePattern('categories:*');
        return updated;
      }
      throw new ConflictError('Category with this name already exists');
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder || 0,
        branchId: data.branchId,
      },
    });

    await cacheInvalidatePattern('categories:*');
    return category;
  }

  async getCategoryBySlug(slug: string) {
    const key = KEYS.slug(slug);
    const cached = await cacheGet<any>(key);
    if (cached) return cached;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: { products: { where: { isActive: true } } },
    });

    if (!category) throw new NotFoundError('Category not found');

    await cacheSet(key, category, TTL.VERY_LONG);
    return category;
  }

  async listCategories(filters?: { branchId?: number; includeInactive?: boolean }) {
    const key = KEYS.list(filters?.branchId, filters?.includeInactive);
    const cached = await cacheGet<any[]>(key);
    if (cached) return cached;

    const where: any = {};
    if (!filters?.includeInactive) where.isActive = true;
    if (filters?.branchId) where.branchId = filters.branchId;

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });

    await cacheSet(key, categories, TTL.VERY_LONG);
    return categories;
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id: Number(id) } });
    if (!category) throw new NotFoundError('Category not found');

    const updated = await prisma.category.update({
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

    await cacheInvalidatePattern('categories:*');
    return updated;
  }

  async deleteCategory(id: string) {
    const categoryId = Number(id);
    const category = await prisma.category.findUnique({ 
      where: { id: categoryId },
      include: { products: { select: { id: true } } }
    });
    if (!category) throw new NotFoundError('Category not found');

    try {
      // 1. Manually delete all products in this category to trigger their dependency cleanup
      for (const product of category.products) {
        await productService.deleteProduct(product.id);
      }

      // 2. Delete the category and its SKUSetting safely
      const deleted = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`DELETE FROM "sku_settings" WHERE "categoryId" = ${categoryId}`;
        return await tx.category.delete({ where: { id: categoryId } });
      });

      await cacheInvalidatePattern('categories:*');
      return deleted;
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ConflictError(
          'Cannot delete this category because it contains products. Please move or delete the products first, or deactivate the category instead.'
        );
      }
      throw error;
    }
  }

  async updateCategoryStatus(id: number, data: { isActive?: boolean }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Category not found');

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: data.isActive },
    });

    await cacheInvalidatePattern('categories:*');
    return updated;
  }
}

export default new CategoryService();
