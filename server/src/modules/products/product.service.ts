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

  async updateProduct(id: number, data: UpdateProductInput) {
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

    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = generateSlug(data.name);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.sku) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.weight !== undefined) updateData.weight = data.weight;

    return await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, inventory: true },
    });
  }

  async deleteProduct(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return await prisma.product.delete({
      where: { id },
    });
  }

  async bulkImportProducts(products: any[]) {
    const results = { imported: 0, failed: 0, errors: [] as any[] };

    for (const productData of products) {
      try {
        const existing = await prisma.product.findUnique({
          where: { sku: productData.sku },
        });

        if (!existing) {
          const slug = generateSlug(productData.name);
          await prisma.product.create({
            data: {
              name: productData.name,
              slug,
              description: productData.description,
              shortDescription: productData.shortDescription,
              price: productData.price,
              compareAtPrice: productData.compareAtPrice,
              costPrice: productData.costPrice,
              sku: productData.sku,
              barcode: productData.barcode,
              categoryId: productData.categoryId,
              images: productData.images || [],
              isFeatured: productData.isFeatured || false,
              tags: productData.tags || [],
              weight: productData.weight,
            },
          });

          await prisma.inventory.create({
            data: {
              productId: productData.id,
              quantity: 0,
              reservedQty: 0,
              lowStockThreshold: 10,
            },
          });

          results.imported++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          sku: productData.sku,
          error: error.message,
        });
      }
    }

    return results;
  }

  async updateProductStatus(id: number, data: { isActive?: boolean; isFeatured?: boolean }) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    return await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, inventory: true },
    });
  }
}

export default new ProductService();
