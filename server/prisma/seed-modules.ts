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
  // Settings sub-modules
  { code: 'settings:products', name: 'Settings › Products', icon: '📦', sortOrder: 10 },
  { code: 'settings:categories', name: 'Settings › Categories', icon: '🗂️', sortOrder: 11 },
  { code: 'settings:general', name: 'Settings › General', icon: '🏷️', sortOrder: 12 },
  { code: 'settings:payment', name: 'Settings › Payment', icon: '💳', sortOrder: 13 },
  { code: 'settings:shipping', name: 'Settings › Shipping', icon: '🚚', sortOrder: 14 },
  { code: 'settings:inventory', name: 'Settings › Inventory', icon: '📦', sortOrder: 15 },
  { code: 'settings:notifications', name: 'Settings › Notifications', icon: '🔔', sortOrder: 16 },
  { code: 'settings:staff', name: 'Settings › Staff & Roles', icon: '👤', sortOrder: 17 },
  { code: 'settings:trending', name: 'Settings › Trending Products', icon: '🔥', sortOrder: 18 },
  { code: 'settings:discounts', name: 'Settings › Discount & Sales', icon: '🏷️', sortOrder: 19 },
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
