-- Add new enums
CREATE TYPE "CustomerSegment" AS ENUM ('VIP', 'REGULAR', 'NEW', 'INACTIVE');
CREATE TYPE "StockTransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- Enhance customers table
ALTER TABLE "customers" ADD COLUMN "totalOrders" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customers" ADD COLUMN "lastOrderAt" TIMESTAMP(3);
ALTER TABLE "customers" ADD COLUMN "segment" "CustomerSegment" NOT NULL DEFAULT 'NEW';

-- Enhance inventory table
ALTER TABLE "inventory" ADD COLUMN "reorderPoint" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "inventory" ADD COLUMN "reorderQuantity" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "inventory" ADD COLUMN "warehouseId" INTEGER;
ALTER TABLE "inventory" ADD COLUMN "lastCountedAt" TIMESTAMP(3);

-- Enhance orders table
ALTER TABLE "orders" ADD COLUMN "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- Create product_analytics table
CREATE TABLE "product_analytics" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "totalSold" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "wishlistCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DECIMAL(3,2),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "returnCount" INTEGER NOT NULL DEFAULT 0,
    "lastSoldAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_analytics_pkey" PRIMARY KEY ("id")
);

-- Create stock_transfers table
CREATE TABLE "stock_transfers" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "fromWarehouseId" INTEGER,
    "toWarehouseId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'PENDING',
    "initiatedBy" INTEGER NOT NULL,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "referenceNumber" TEXT,
    "notes" TEXT,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- Create indexes for product_analytics
CREATE UNIQUE INDEX "product_analytics_productId_key" ON "product_analytics"("productId");
CREATE INDEX "product_analytics_totalSold_idx" ON "product_analytics"("totalSold" DESC);
CREATE INDEX "product_analytics_totalRevenue_idx" ON "product_analytics"("totalRevenue" DESC);
CREATE INDEX "product_analytics_totalViews_idx" ON "product_analytics"("totalViews" DESC);
CREATE INDEX "product_analytics_wishlistCount_idx" ON "product_analytics"("wishlistCount" DESC);
CREATE INDEX "product_analytics_avgRating_idx" ON "product_analytics"("avgRating" DESC);
CREATE INDEX "product_analytics_lastUpdated_idx" ON "product_analytics"("lastUpdated");

-- Create indexes for stock_transfers
CREATE UNIQUE INDEX "stock_transfers_referenceNumber_key" ON "stock_transfers"("referenceNumber");
CREATE INDEX "stock_transfers_productId_idx" ON "stock_transfers"("productId");
CREATE INDEX "stock_transfers_inventoryId_idx" ON "stock_transfers"("inventoryId");
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers"("status");
CREATE INDEX "stock_transfers_initiatedAt_idx" ON "stock_transfers"("initiatedAt");
CREATE INDEX "stock_transfers_fromWarehouseId_idx" ON "stock_transfers"("fromWarehouseId");
CREATE INDEX "stock_transfers_toWarehouseId_idx" ON "stock_transfers"("toWarehouseId");
CREATE INDEX "stock_transfers_initiatedBy_idx" ON "stock_transfers"("initiatedBy");
CREATE INDEX "stock_transfers_status_initiatedAt_idx" ON "stock_transfers"("status", "initiatedAt");

-- Create indexes for enhanced customers table
CREATE INDEX "customers_segment_idx" ON "customers"("segment");
CREATE INDEX "customers_loyaltyPoints_idx" ON "customers"("loyaltyPoints");
CREATE INDEX "customers_totalSpent_idx" ON "customers"("totalSpent");
CREATE INDEX "customers_lastOrderAt_idx" ON "customers"("lastOrderAt");
CREATE INDEX "customers_segment_totalSpent_idx" ON "customers"("segment", "totalSpent");
CREATE INDEX "customers_totalOrders_idx" ON "customers"("totalOrders");

-- Create indexes for enhanced inventory table
CREATE INDEX "inventory_reorderPoint_idx" ON "inventory"("reorderPoint");
CREATE INDEX "inventory_quantity_reorderPoint_idx" ON "inventory"("quantity", "reorderPoint");
CREATE INDEX "inventory_warehouseId_idx" ON "inventory"("warehouseId");
CREATE INDEX "inventory_lastCountedAt_idx" ON "inventory"("lastCountedAt");

-- Create indexes for enhanced orders table
CREATE INDEX "orders_shippedAt_idx" ON "orders"("shippedAt");
CREATE INDEX "orders_deliveredAt_idx" ON "orders"("deliveredAt");
CREATE INDEX "orders_taxAmount_idx" ON "orders"("taxAmount");

-- Add foreign key for product_analytics
ALTER TABLE "product_analytics" ADD CONSTRAINT "product_analytics_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for stock_transfers
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
