import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🏠 Seeding homepage stats...");

  try {
    // Check if stats already exist
    const existingStats = await prisma.homepageStats.findFirst();

    if (existingStats) {
      console.log("✓ Homepage stats already exist. Updating...");
      const updated = await prisma.homepageStats.update({
        where: { id: existingStats.id },
        data: {
          totalHappyCustomers: 10000,
          minFreeDeliveryAmount: 999,
          isFreeDeliveryActive: true,
          deliveryTimeframe: "48hr",
          currentOfferText: "Spring Sale - Save up to 40%",
          currentOfferPercentage: 40,
          isOfferActive: true,
        },
      });
      console.log("✓ Updated homepage stats:", updated);
    } else {
      console.log("✓ Creating new homepage stats...");
      const created = await prisma.homepageStats.create({
        data: {
          totalHappyCustomers: 10000,
          minFreeDeliveryAmount: 999,
          isFreeDeliveryActive: true,
          deliveryTimeframe: "48hr",
          currentOfferText: "Spring Sale - Save up to 40%",
          currentOfferPercentage: 40,
          isOfferActive: true,
        },
      });
      console.log("✓ Created homepage stats:", created);
    }

    console.log("✨ Homepage stats seed completed!");
  } catch (error) {
    console.error("❌ Error seeding homepage stats:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
