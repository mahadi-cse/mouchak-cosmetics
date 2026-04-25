import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎬 Seeding hero slider images...");

  try {
    // Clear existing slider data
    await prisma.heroSlider.deleteMany();
    console.log("✓ Cleared existing slider data");

    // Create 3 default slider images
    const sliders = await prisma.heroSlider.createMany({
      data: [
        {
          title: "Spring Beauty Collection",
          description: "Discover luxurious skincare and makeup that celebrates your natural glow",
          imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Beautiful woman with glowing skin",
          buttonText: "Shop Now",
          buttonLink: "/shop",
          displayOrder: 1,
          isActive: true,
        },
        {
          title: "Premium Skincare Range",
          description: "Science-backed formulations for every skin type",
          imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Skincare products lineup",
          buttonText: "Explore Skincare",
          buttonLink: "/shop?category=skincare",
          displayOrder: 2,
          isActive: true,
        },
        {
          title: "Professional Makeup Collection",
          description: "Professional-grade makeup for every occasion",
          imageUrl: "https://images.unsplash.com/photo-1596462502278-af242a95ab22?q=80&w=1200&auto=format&fit=crop",
          imageAlt: "Professional makeup palette",
          buttonText: "View Makeup",
          buttonLink: "/shop?category=makeup",
          displayOrder: 3,
          isActive: true,
        },
      ],
    });

    console.log(`✓ Created ${sliders.count} slider images`);
    console.log("✨ Hero slider seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding hero slider:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
