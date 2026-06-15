import { prisma } from '../../config/database';
import { generateSlug } from '../../shared/utils/slug';
import { ConflictError, NotFoundError } from '../../shared/utils/AppError';
import { CreateProductInput, UpdateProductInput } from './product.schema';
import { parsePagination } from '../../shared/utils/pagination';
import { cacheGet, cacheSet, cacheInvalidatePattern, cacheDel, TTL } from '../../shared/utils/cache';

const KEYS = {
  list: (filters: object) => `products:list:${JSON.stringify(filters)}`,
  slug: (slug: string) => `products:slug:${slug}`,
};

/** Cache keys for homepage content that depends on featured products */
const HP_SLIDER_KEY = 'homepage:slider';

export class ProductService {
  private async getDefaultBranchId() {
    const branch = await prisma.branch.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!branch) throw new NotFoundError('No active branch found');
    return branch.id;
  }

  async createProduct(data: CreateProductInput) {
    let sku = data.sku;
    let existingSku = await prisma.product.findUnique({ where: { sku } });
    let counterSku = 1;
    while (existingSku) {
      sku = `${data.sku}-${counterSku}`;
      existingSku = await prisma.product.findUnique({ where: { sku } });
      counterSku++;
    }

    let slug = generateSlug(data.name);
    let existingSlug = await prisma.product.findUnique({ where: { slug } });
    let counterSlug = 1;
    while (existingSlug) {
      slug = `${generateSlug(data.name)}-${counterSlug}`;
      existingSlug = await prisma.product.findUnique({ where: { slug } });
      counterSlug++;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        sku,
        barcode: data.barcode,
        categoryId: data.categoryId,
        images: data.images || [],
        isFeatured: data.isFeatured || false,
        tags: data.tags || [],
        weight: data.weight,
        unitType: data.unitType || 'PIECE',
        unitLabel: data.unitLabel || 'pc',
        ...(data.sizes && data.sizes.length > 0
          ? {
              sizes: {
                create: data.sizes.map((s, i) => ({
                  name: s.name,
                  sortOrder: s.sortOrder ?? i,
                  imageUrl: s.imageUrl || null,
                  priceOverride: s.priceOverride || null,
                  costPriceOverride: s.costPriceOverride || null,
                  isActive: s.isActive ?? true,
                })),
              },
            }
          : {}),
      },
      include: { sizes: { orderBy: { sortOrder: 'asc' } } },
    });

    const defaultBranchId = data.branchId || (await this.getDefaultBranchId());
    await prisma.inventory.create({
      data: {
        productId: product.id,
        warehouseId: defaultBranchId,
        quantity: data.openingStock || 0,
        reservedQty: 0,
        lowStockThreshold: 10,
      },
    });

    await cacheInvalidatePattern('products:list:*');
    return product;
  }

  async getProductBySlug(slug: string) {
    const key = KEYS.slug(slug);
    const cached = await cacheGet<any>(key);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        inventories: true,
        sizes: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) throw new NotFoundError('Product not found');

    await cacheSet(key, product, TTL.SHORT);
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
    branchId?: number;
    includeInactive?: boolean;
  }) {
    const key = KEYS.list(filters);
    const cached = await cacheGet<any>(key);
    if (cached) return cached;

    const { page = 1, limit = 10, category, search, featured, minPrice, maxPrice, branchId, includeInactive } = filters;
    const { skip, take } = parsePagination({ page, limit });

    const where: any = {};
    if (!includeInactive) where.isActive = true;
    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }
    if (featured !== undefined) where.isFeatured = featured;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    if (branchId !== undefined) where.inventories = { some: { warehouseId: branchId } };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, inventories: true, sizes: { orderBy: { sortOrder: 'asc' } } },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    const result = { products, total, page, limit, totalPages: Math.ceil(total / limit) };

    // Only cache non-search results — search queries are too varied to benefit
    if (!search) {
      await cacheSet(key, result, TTL.SHORT);
    }

    return result;
  }

  async updateProduct(id: number, data: UpdateProductInput) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    let sku = data.sku;
    if (sku && sku !== product.sku) {
      let existingSku = await prisma.product.findFirst({
        where: { id: { not: id }, sku },
      });
      let counterSku = 1;
      while (existingSku) {
        sku = `${data.sku}-${counterSku}`;
        existingSku = await prisma.product.findFirst({
          where: { id: { not: id }, sku },
        });
        counterSku++;
      }
    }

    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name;
      let slug = generateSlug(data.name);
      let existingSlug = await prisma.product.findFirst({
        where: { id: { not: id }, slug },
      });
      let counterSlug = 1;
      while (existingSlug) {
        slug = `${generateSlug(data.name)}-${counterSlug}`;
        existingSlug = await prisma.product.findFirst({
          where: { id: { not: id }, slug },
        });
        counterSlug++;
      }
      updateData.slug = slug;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice;
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (sku) updateData.sku = sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.unitType !== undefined) updateData.unitType = data.unitType;
    if (data.unitLabel !== undefined) updateData.unitLabel = data.unitLabel;

    if (data.sizes !== undefined) {
      await prisma.productSize.deleteMany({ where: { productId: id } });
      if (data.sizes.length > 0) {
        await prisma.productSize.createMany({
          data: data.sizes.map((s, i) => ({
            productId: id,
            name: s.name,
            sortOrder: s.sortOrder ?? i,
            imageUrl: s.imageUrl || null,
            priceOverride: s.priceOverride || null,
            costPriceOverride: s.costPriceOverride || null,
            isActive: s.isActive ?? true,
          })),
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, inventories: true, sizes: { orderBy: { sortOrder: 'asc' } } },
    });

    // Invalidate product caches + homepage slider if isFeatured changed
    const invalidations: Promise<void>[] = [
      cacheInvalidatePattern('products:list:*'),
      cacheInvalidatePattern(`products:slug:${updated.slug}`),
    ];
    if (data.isFeatured !== undefined || data.images !== undefined) {
      // isFeatured or images changed — the homepage slider fallback must refresh
      invalidations.push(cacheDel(HP_SLIDER_KEY));
    }
    await Promise.all(invalidations);

    return updated;
  }

  async deleteProduct(id: number) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const deleted = await prisma.product.delete({ where: { id } });
    await cacheInvalidatePattern('products:*');
    return deleted;
  }

  async bulkImportProducts(products: any[]) {
    const results = { imported: 0, failed: 0, errors: [] as any[] };

    for (const productData of products) {
      try {
        let sku = productData.sku;
        let existingSku = await prisma.product.findUnique({ where: { sku } });
        let counterSku = 1;
        while (existingSku) {
          sku = `${productData.sku}-${counterSku}`;
          existingSku = await prisma.product.findUnique({ where: { sku } });
          counterSku++;
        }

        let slug = generateSlug(productData.name);
        let existingSlug = await prisma.product.findUnique({ where: { slug } });
        let counterSlug = 1;
        while (existingSlug) {
          slug = `${generateSlug(productData.name)}-${counterSlug}`;
          existingSlug = await prisma.product.findUnique({ where: { slug } });
          counterSlug++;
        }

        const created = await prisma.product.create({
          data: {
            name: productData.name,
            slug,
            description: productData.description,
            shortDescription: productData.shortDescription,
            price: productData.price,
            compareAtPrice: productData.compareAtPrice,
            costPrice: productData.costPrice,
            sku,
            barcode: productData.barcode,
            categoryId: productData.categoryId,
            images: productData.images || [],
            isFeatured: productData.isFeatured || false,
            tags: productData.tags || [],
            weight: productData.weight,
          },
        });

        const defaultBranchId = await this.getDefaultBranchId();
        await prisma.inventory.create({
          data: {
            productId: created.id,
            warehouseId: defaultBranchId,
            quantity: 0,
            reservedQty: 0,
            lowStockThreshold: 10,
          },
        });
        results.imported++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ sku: productData.sku, error: error.message });
      }
    }

    await cacheInvalidatePattern('products:list:*');
    return results;
  }

  async updateProductStatus(id: number, data: { isActive?: boolean; isFeatured?: boolean }) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError('Product not found');

    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, inventories: true, sizes: { orderBy: { sortOrder: 'asc' } } },
    });

    // Bust all product caches AND the homepage slider (isFeatured may have changed)
    await Promise.all([
      cacheInvalidatePattern('products:*'),
      cacheDel(HP_SLIDER_KEY),
    ]);
    return updated;
  }
}

export default new ProductService();
