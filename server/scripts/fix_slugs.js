import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    const newSlug = generateSlug(cat.name) || `cat-${cat.id}`;
    if (cat.slug !== newSlug) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { slug: newSlug },
      });
      console.log(`Updated slug for ID ${cat.id}: ${cat.slug} -> ${newSlug}`);
    }
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
