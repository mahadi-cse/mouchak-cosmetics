import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/homepage/stats
 * Fetch homepage statistics for the hero section
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await prisma.homepageStats.findFirst();

    if (!stats) {
      // Return default stats if none exist
      return res.json({
        totalHappyCustomers: 10000,
        minFreeDeliveryAmount: 999,
        isFreeDeliveryActive: true,
        deliveryTimeframe: "48hr",
        currentOfferText: "Spring Sale - Save up to 40%",
        currentOfferPercentage: 40,
        isOfferActive: true,
      });
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching homepage stats:", error);
    res.status(500).json({ error: "Failed to fetch homepage stats" });
  }
});

/**
 * PUT /api/homepage/stats
 * Update homepage statistics (Admin only)
 */
router.put("/stats", async (req, res) => {
  try {
    const { 
      totalHappyCustomers, 
      minFreeDeliveryAmount, 
      isFreeDeliveryActive,
      deliveryTimeframe, 
      currentOfferText, 
      currentOfferPercentage,
      isOfferActive
    } = req.body;

    const stats = await prisma.homepageStats.upsert({
      where: { id: 1 },
      update: {
        ...(totalHappyCustomers !== undefined && { totalHappyCustomers }),
        ...(minFreeDeliveryAmount !== undefined && { minFreeDeliveryAmount }),
        ...(isFreeDeliveryActive !== undefined && { isFreeDeliveryActive }),
        ...(deliveryTimeframe !== undefined && { deliveryTimeframe }),
        ...(currentOfferText !== undefined && { currentOfferText }),
        ...(currentOfferPercentage !== undefined && { currentOfferPercentage }),
        ...(isOfferActive !== undefined && { isOfferActive }),
      },
      create: {
        id: 1,
        totalHappyCustomers: totalHappyCustomers || 10000,
        minFreeDeliveryAmount: minFreeDeliveryAmount || 999,
        isFreeDeliveryActive: isFreeDeliveryActive !== undefined ? isFreeDeliveryActive : true,
        deliveryTimeframe: deliveryTimeframe || "48hr",
        currentOfferText: currentOfferText || "Spring Sale - Save up to 40%",
        currentOfferPercentage: currentOfferPercentage || 40,
        isOfferActive: isOfferActive !== undefined ? isOfferActive : true,
      },
    });

    res.json({ message: "Stats updated successfully", data: stats });
  } catch (error) {
    console.error("Error updating homepage stats:", error);
    res.status(500).json({ error: "Failed to update homepage stats" });
  }
});

/**
 * GET /api/homepage/settings
 * Fetch site settings (store name, hero heading, etc)
 */
router.get("/settings", async (req, res) => {
  try {
    const settings = await prisma.siteSettings.findFirst();

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        storeName: "Mouchak Cosmetics",
        tagline: "Clean · Cruelty-Free · Bangladesh",
        heroHeadline: "Spring Beauty Collection",
        heroYear: "2026",
        heroDescription: "Discover luxurious skincare and makeup that celebrates your natural glow. Clean, cruelty-free formulas delivered across Bangladesh in 48 hours.",
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Error fetching site settings:", error);
    res.status(500).json({ error: "Failed to fetch site settings" });
  }
});

/**
 * PUT /api/homepage/settings
 * Update site settings (Admin only)
 */
router.put("/settings", async (req, res) => {
  try {
    const { storeName, tagline, heroHeadline, heroYear, heroDescription } = req.body;

    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {
        ...(storeName !== undefined && { storeName }),
        ...(tagline !== undefined && { tagline }),
        ...(heroHeadline !== undefined && { heroHeadline }),
        ...(heroYear !== undefined && { heroYear }),
        ...(heroDescription !== undefined && { heroDescription }),
      },
      create: {
        id: 1,
        storeName: storeName || "Mouchak Cosmetics",
        tagline: tagline || "Clean · Cruelty-Free · Bangladesh",
        heroHeadline: heroHeadline || "Spring Beauty Collection",
        heroYear: heroYear || "2026",
        heroDescription: heroDescription || "Discover luxurious skincare and makeup that celebrates your natural glow. Clean, cruelty-free formulas delivered across Bangladesh in 48 hours.",
      },
    });

    res.json({ message: "Settings updated successfully", data: settings });
  } catch (error) {
    console.error("Error updating site settings:", error);
    res.status(500).json({ error: "Failed to update site settings" });
  }
});

/**
 * GET /api/homepage/slider
 * Fetch all active hero slider images.
 * Falls back to featured products when no manual slider entries exist.
 */
router.get("/slider", async (req, res) => {
  try {
    const sliders = await prisma.heroSlider.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
    });

    if (sliders.length > 0) {
      return res.json(sliders);
    }

    // Fallback: build slider entries from featured products
    const featured = await prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { category: true },
    });

    const productSliders = featured.map((p: any, i: number) => ({
      id: -(p.id),  // negative id to distinguish from real slider entries
      title: p.name,
      description: p.shortDescription || p.description || null,
      imageUrl: p.images?.[0] || "",
      imageAlt: p.name,
      buttonText: `Shop Now · ৳${Math.round(Number(p.price))}`,
      buttonLink: `/product/${p.slug}`,
      displayOrder: i,
      isActive: true,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json(productSliders);
  } catch (error) {
    console.error("Error fetching hero slider:", error);
    res.status(500).json({ error: "Failed to fetch hero slider" });
  }
});

/**
 * GET /api/homepage/slider/all
 * Fetch all hero slider images (including inactive) - Admin only
 */
router.get("/slider/all", async (req, res) => {
  try {
    const sliders = await prisma.heroSlider.findMany({
      orderBy: { displayOrder: "asc" },
    });

    res.json(sliders);
  } catch (error) {
    console.error("Error fetching all hero slider images:", error);
    res.status(500).json({ error: "Failed to fetch hero slider images" });
  }
});

/**
 * POST /api/homepage/slider
 * Create a new hero slider image (Admin only)
 */
router.post("/slider", async (req, res) => {
  try {
    const { title, description, imageUrl, imageAlt, buttonText, buttonLink, displayOrder } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const slider = await prisma.heroSlider.create({
      data: {
        title: title || null,
        description: description || null,
        imageUrl,
        imageAlt: imageAlt || "Hero slider image",
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        displayOrder: displayOrder || 0,
        isActive: true,
      },
    });

    res.status(201).json({ message: "Slider image created successfully", data: slider });
  } catch (error) {
    console.error("Error creating hero slider image:", error);
    res.status(500).json({ error: "Failed to create hero slider image" });
  }
});

/**
 * PUT /api/homepage/slider/:id
 * Update a hero slider image (Admin only)
 */
router.put("/slider/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl, imageAlt, buttonText, buttonLink, displayOrder, isActive } = req.body;

    const slider = await prisma.heroSlider.update({
      where: { id: parseInt(id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(imageAlt !== undefined && { imageAlt }),
        ...(buttonText !== undefined && { buttonText }),
        ...(buttonLink !== undefined && { buttonLink }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ message: "Slider image updated successfully", data: slider });
  } catch (error) {
    console.error("Error updating hero slider image:", error);
    res.status(500).json({ error: "Failed to update hero slider image" });
  }
});

/**
 * DELETE /api/homepage/slider/:id
 * Delete a hero slider image (Admin only)
 */
router.delete("/slider/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.heroSlider.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Slider image deleted successfully" });
  } catch (error) {
    console.error("Error deleting hero slider image:", error);
    res.status(500).json({ error: "Failed to delete hero slider image" });
  }
});

export default router;
