import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = [
  { code: 'overview', name: 'Overview', icon: '◈', sortOrder: 1 },
  { code: 'sales', name: 'Sales', icon: '💰', sortOrder: 2 },
  { code: 'inventory', name: 'Inventory', icon: '📦', sortOrder: 3 },
  { code: 'branches', name: 'Branches', icon: '🏪', sortOrder: 4 },
  { code: 'analytics', name: 'Analytics', icon: '📊', sortOrder: 5 },
  { code: 'ecommerce', name: 'E-Commerce', icon: '🌐', sortOrder: 6 },
  { code: 'pos', name: 'POS', icon: '🖥️', badge: 'Soon', sortOrder: 7 },
  { code: 'settings', name: 'Settings', icon: '⚙️', sortOrder: 8 },
];

async function main() {
  for (const m of MODULES) {
    await prisma.appModule.upsert({
      where: { code: m.code },
      update: m,
      create: m,
    });
  }
  console.log("Seeded modules.");
  
  const admin = await prisma.user.findUnique({ where: { email: 'admin@mouchak.local' } });
  if (admin) {
    const modules = await prisma.appModule.findMany();
    for (const m of modules) {
      await prisma.userModule.upsert({
        where: { userId_moduleId: { userId: admin.id, moduleId: m.id } },
        update: { isActive: true },
        create: { userId: admin.id, moduleId: m.id, isActive: true },
      });
    }
    console.log("Assigned all modules to admin.");
  }
}

main().finally(() => prisma.$disconnect());
