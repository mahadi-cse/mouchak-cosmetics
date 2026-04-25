import 'dotenv/config';
import { prisma } from '../src/config/database';

const userTypes = [
  { code: '1x101', name: 'SYSTEM_ADMIN' },
  { code: '4x404', name: 'MANAGER' },
  { code: '5x505', name: 'SALES_STAFF' },
  { code: '6x606', name: 'CASHIER' },
  { code: '7x707', name: 'RIDER' },
  { code: '9x909', name: 'CUSTOMER' },
] as const;

async function main() {
  for (const userType of userTypes) {
    await prisma.userType.upsert({
      where: { code: userType.code },
      update: { name: userType.name },
      create: {
        code: userType.code,
        name: userType.name,
      },
    });
  }

  console.log('Seeded user_type role codes successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
