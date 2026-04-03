import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/slug';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { CreateProductInput, UpdateProductInput } from './product.schema';
import { parsePagination } from '../../shared/utils/pagination';

export class ProductService {
  async createProduct(data: CreateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      throw new ConflictError('Product with this SKU already exists');
    }

    const slug = generateSlug(data.name);

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        barcode: data.barcode,
        categoryId: data.categoryId,
        images: data.images || [],
        isFeatured: data.isFeatured || false,
        tags: data.tags || [],
        weight: data.weight,
      },
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        quantity: 0,
        reservedQty: 0,
        lowStockThreshold: 10,
      },
    });

    return product;
  }

  async getProductBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, inventory: true },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async listProducts(filters: {
    category?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 10, category, search, featured, minPrice, maxPrice } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    if (featured !== undefined) {
      where.isFeatured = featured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, inventory: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateProduct(id: string, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (data.sku && data.sku !== product.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existing) {
        throw new ConflictError('Product with this SKU already exists');
      }
    }

    return await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.name ? generateSlug(data.name) : undefined,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku: data.sku,
        barcode: data.barcode,
        categoryId: data.categoryId,
        images: data.images,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        tags: data.tags,
        weight: data.weight,
      },
      include: { category: true, inventory: true },
    });
  }

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export default new ProductService();
