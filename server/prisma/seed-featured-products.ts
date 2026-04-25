import 'dotenv/config';
import { prisma } from '../src/config/database';

async function main() {
  console.log('⭐ Marking products as featured...');

  const limit = Number(process.env.FEATURED_SEED_LIMIT ?? 8);

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, name: true },
  });

  if (products.length === 0) {
    console.log('ℹ️ No products found. Nothing to update.');
    return;
  }

  const ids = products.map((p) => p.id);

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { isFeatured: true },
  });

  console.log(`✅ Updated ${result.count} products to isFeatured=true`);
  console.log('✅ Featured products:');
  for (const p of products) {
    console.log(`- ${p.id}: ${p.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
