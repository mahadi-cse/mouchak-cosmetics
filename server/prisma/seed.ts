import 'dotenv/config';
import { prisma } from '../src/config/database';
import { generateSlug } from '../src/shared/utils/slug';

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Skincare',
        slug: generateSlug('Skincare'),
        description: 'Face and body skincare products',
        imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Makeup',
        slug: generateSlug('Makeup'),
        description: 'Face makeup and cosmetics',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-f4d8fcd11433?w=400',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Haircare',
        slug: generateSlug('Haircare'),
        description: 'Hair care and treatment products',
        imageUrl: 'https://images.unsplash.com/photo-1597642242797-d009fdd67b79?w=400',
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Fragrance',
        slug: generateSlug('Fragrance'),
        description: 'Perfumes and fragrances',
        imageUrl: 'https://images.unsplash.com/photo-1594784202854-e2b94c900e8c?w=400',
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Radiance Boosting Vitamin C Serum 30ml',
        slug: generateSlug('Radiance Boosting Vitamin C Serum 30ml'),
        description:
          'Powerful vitamin C serum for brightening and anti-aging. Reduces dark spots and improves skin texture.',
        shortDescription: 'Brightening vitamin C serum',
        price: 2800,
        compareAtPrice: 4500,
        sku: 'VITMN-C-001',
        categoryId: categories[0].id,
        images: [
          'https://images.unsplash.com/photo-1618330834871-dd22c2c226ca?w=400',
        ],
        isFeatured: true,
        tags: ['skincare', 'serum', 'vitamin-c'],
        weight: 30,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Velvet Matte Long-lasting Lipstick',
        slug: generateSlug('Velvet Matte Long-lasting Lipstick'),
        description:
          'Ultra-matte lipstick with 12-hour wear. Rich pigmentation and comfortable formula.',
        shortDescription: 'Long-lasting matte lipstick',
        price: 1200,
        compareAtPrice: 1800,
        sku: 'LIPS-001',
        categoryId: categories[1].id,
        images: [
          'https://images.unsplash.com/photo-1598460880248-71ec6d2d582b?w=400',
        ],
        isFeatured: true,
        tags: ['makeup', 'lipstick', 'matte'],
        weight: 3.5,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hydrating Hair Mask Treatment',
        slug: generateSlug('Hydrating Hair Mask Treatment'),
        description:
          'Deep conditioning hair mask for dry and damaged hair. Rich in natural oils.',
        shortDescription: 'Deep conditioning treatment',
        price: 850,
        compareAtPrice: 1200,
        sku: 'HAIR-MASK-001',
        categoryId: categories[2].id,
        images: [
          'https://images.unsplash.com/photo-1633426740402-ef5039824ab9?w=400',
        ],
        isFeatured: true,
        tags: ['haircare', 'mask', 'conditioning'],
        weight: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Rose Garden Eau de Parfum 100ml',
        slug: generateSlug('Rose Garden Eau de Parfum 100ml'),
        description:
          'Elegant rose fragrance with floral and woody notes. Long-lasting perfume.',
        shortDescription: 'Floral eau de parfum',
        price: 3500,
        compareAtPrice: 5000,
        sku: 'FRAG-ROSE-001',
        categoryId: categories[3].id,
        images: [
          'https://images.unsplash.com/photo-1594784202854-e2b94c900e8c?w=400',
        ],
        isFeatured: true,
        tags: ['fragrance', 'perfume', 'rose'],
        weight: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Gentle Cleanser Milky Face Wash',
        slug: generateSlug('Gentle Cleanser Milky Face Wash'),
        description: 'Mild foaming cleanser for all skin types. Removes makeup gently.',
        shortDescription: 'Gentle face wash',
        price: 450,
        compareAtPrice: 650,
        sku: 'CLEAN-001',
        categoryId: categories[0].id,
        images: [
          'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400',
        ],
        isFeatured: false,
        tags: ['skincare', 'cleanser', 'face-wash'],
        weight: 150,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Color Correcting Eye Primer',
        slug: generateSlug('Color Correcting Eye Primer'),
        description: 'Long-wear eye primer that prevents creasing and keeps makeup intact.',
        shortDescription: 'Eye primer for eyeshadow',
        price: 650,
        compareAtPrice: 950,
        sku: 'EYE-PRIME-001',
        categoryId: categories[1].id,
        images: [
          'https://images.unsplash.com/photo-1597642042211-c3ee47be1133?w=400',
        ],
        isFeatured: false,
        tags: ['makeup', 'primer', 'eyes'],
      },
    }),
    prisma.product.create({
      data: {
        name: 'Argan Oil Hair Treatment',
        slug: generateSlug('Argan Oil Hair Treatment'),
        description: 'Pure argan oil for hair restoration and shine. Perfect for dry ends.',
        shortDescription: 'Pure argan oil',
        price: 1100,
        compareAtPrice: 1500,
        sku: 'ARGAN-OIL-001',
        categoryId: categories[2].id,
        images: [
          'https://images.unsplash.com/photo-1599599810489-52d6fafaecbb?w=400',
        ],
        isFeatured: false,
        tags: ['haircare', 'oil', 'treatment'],
        weight: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Ocean Breeze Cologne 75ml',
        slug: generateSlug('Ocean Breeze Cologne 75ml'),
        description: 'Fresh and aquatic fragrance. Perfect for everyday wear.',
        shortDescription: 'Fresh aquatic perfume',
        price: 2200,
        compareAtPrice: 3200,
        sku: 'FRAG-OCEAN-001',
        categoryId: categories[3].id,
        images: [
          'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400',
        ],
        isFeatured: false,
        tags: ['fragrance', 'cologne', 'aquatic'],
        weight: 75,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create inventory for all products
  await Promise.all(
    products.map(product =>
      prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: Math.floor(Math.random() * 100) + 20,
          reservedQty: 0,
          lowStockThreshold: 10,
          location: `Shelf-${Math.floor(Math.random() * 10)}`,
        },
      })
    )
  );

  console.log(`✅ Created inventory for all products`);

  console.log('✨ Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
