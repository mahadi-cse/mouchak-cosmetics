import { prisma } from '../src/config/database';

async function main() {
  const [categories, products, inventory, customers, orders] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.inventory.count(),
    prisma.customer.count(),
    prisma.order.count(),
  ]);

  console.log(JSON.stringify({ categories, products, inventory, customers, orders }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
