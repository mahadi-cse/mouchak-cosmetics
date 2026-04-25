import { prisma } from '../src/config/database';

type SeedCustomer = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
};

const customersSeed: SeedCustomer[] = [
  { email: 'nahid@example.com', firstName: 'Nahid', lastName: 'Hasan', phone: '01710000001', city: 'Dhaka' },
  { email: 'sadia@example.com', firstName: 'Sadia', lastName: 'Akter', phone: '01710000002', city: 'Chattogram' },
  { email: 'tanvir@example.com', firstName: 'Tanvir', lastName: 'Rahman', phone: '01710000003', city: 'Sylhet' },
  { email: 'maria@example.com', firstName: 'Maria', lastName: 'Islam', phone: '01710000004', city: 'Khulna' },
  { email: 'fahim@example.com', firstName: 'Fahim', lastName: 'Karim', phone: '01710000005', city: 'Rajshahi' },
];

function decimalRound(value: number): number {
  return Math.round(value * 100) / 100;
}

async function ensureCustomers() {
  const createdCustomerIds: number[] = [];

  for (let i = 0; i < customersSeed.length; i += 1) {
    const seed = customersSeed[i];
    const keycloakId = `dev-customer-${i + 1}`;

    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: {
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
      },
      create: {
        keycloakId,
        email: seed.email,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
      },
    });

    const customer = await prisma.customer.upsert({
      where: { userId: user.id },
      update: {
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        city: seed.city,
      },
      create: {
        userId: user.id,
        firstName: seed.firstName,
        lastName: seed.lastName,
        phone: seed.phone,
        city: seed.city,
        country: 'Bangladesh',
        defaultAddress: `${seed.city} Main Road`,
      },
    });

    createdCustomerIds.push(customer.id);
  }

  return createdCustomerIds;
}

async function ensureOrders(customerIds: number[]) {
  const products = await prisma.product.findMany({
    take: 8,
    orderBy: { id: 'asc' },
  });

  if (products.length < 2) {
    throw new Error('Not enough products found to seed orders');
  }

  let orderCounter = 1001;

  for (const customerId of customerIds) {
    for (let j = 0; j < 2; j += 1) {
      const productA = products[(customerId + j) % products.length];
      const productB = products[(customerId + j + 1) % products.length];

      const qtyA = 1 + ((customerId + j) % 3);
      const qtyB = 1 + ((customerId + j + 1) % 2);

      const unitA = Number(productA.price);
      const unitB = Number(productB.price);

      const subtotal = decimalRound(unitA * qtyA + unitB * qtyB);
      const discount = decimalRound(subtotal * 0.05);
      const shipping = 80;
      const tax = decimalRound((subtotal - discount) * 0.03);
      const total = decimalRound(subtotal - discount + shipping + tax);

      const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
      const status = statuses[(customerId + j) % statuses.length];
      const orderNumber = `DEV-ORD-${orderCounter}`;
      orderCounter += 1;

      const order = await prisma.order.upsert({
        where: { orderNumber },
        update: {
          status,
          subtotal,
          discountAmount: discount,
          shippingCharge: shipping,
          taxAmount: tax,
          total,
        },
        create: {
          orderNumber,
          customerId,
          channel: j % 2 === 0 ? 'ONLINE' : 'POS',
          status,
          shippingName: `Customer ${customerId}`,
          shippingPhone: `0171${String(customerId).padStart(7, '0')}`,
          shippingAddress: `House ${customerId}, Road ${j + 1}`,
          shippingCity: 'Dhaka',
          subtotal,
          discountAmount: discount,
          shippingCharge: shipping,
          taxAmount: tax,
          total,
          notes: 'Seeded dashboard order',
        },
      });

      const existingItems = await prisma.orderItem.count({ where: { orderId: order.id } });
      if (existingItems === 0) {
        await prisma.orderItem.createMany({
          data: [
            {
              orderId: order.id,
              productId: productA.id,
              productName: productA.name,
              productSku: productA.sku,
              quantity: qtyA,
              unitPrice: unitA,
              totalPrice: decimalRound(unitA * qtyA),
            },
            {
              orderId: order.id,
              productId: productB.id,
              productName: productB.name,
              productSku: productB.sku,
              quantity: qtyB,
              unitPrice: unitB,
              totalPrice: decimalRound(unitB * qtyB),
            },
          ],
        });
      }
    }
  }
}

async function ensureLowStockSignals() {
  const inventory = await prisma.inventory.findMany({
    take: 2,
    orderBy: { id: 'asc' },
  });

  for (const item of inventory) {
    await prisma.inventory.update({
      where: { id: item.id },
      data: {
        quantity: Math.min(item.quantity, 3),
        lowStockThreshold: Math.max(item.lowStockThreshold, 10),
      },
    });
  }
}

async function refreshCustomerStats() {
  const customers = await prisma.customer.findMany({ include: { orders: true } });

  for (const customer of customers) {
    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.total), 0);

    const segment = totalSpent > 20000 ? 'VIP' : totalSpent > 5000 ? 'REGULAR' : 'NEW';

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalOrders,
        totalSpent,
        segment,
        lastOrderAt: customer.orders.length ? customer.orders[customer.orders.length - 1].createdAt : null,
      },
    });
  }
}

async function main() {
  console.log('Seeding dashboard transactional data...');

  const customerIds = await ensureCustomers();
  await ensureOrders(customerIds);
  await ensureLowStockSignals();
  await refreshCustomerStats();

  const [customers, orders, inventory] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.inventory.count(),
  ]);

  console.log(`Done. customers=${customers}, orders=${orders}, inventory=${inventory}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
