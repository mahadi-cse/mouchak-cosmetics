const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='order_tracking_events'");
  const indexes = await prisma.$queryRawUnsafe("SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='order_tracking_events' ORDER BY indexname");
  const constraints = await prisma.$queryRawUnsafe("SELECT conname FROM pg_constraint WHERE conrelid='order_tracking_events'::regclass ORDER BY conname");

  console.log(JSON.stringify({ tables, indexes, constraints }, null, 2));
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
