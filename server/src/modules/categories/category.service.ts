import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/slug';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

export class CategoryService {
  async createCategory(data: CreateCategoryInput) {
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findFirst({ where: { slug } });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    return await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder || 0,
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

  async listCategories() {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.name ? generateSlug(data.name) : undefined,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export default new CategoryService();
