-- CreateTable
CREATE TABLE "manual_sales" (
    "id" SERIAL NOT NULL,
    "saleNumber" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "totalQty" INTEGER NOT NULL,
    "note" TEXT,
    "soldBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_sale_items" (
    "id" SERIAL NOT NULL,
    "manualSaleId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "productSkuSnapshot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manual_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manual_sales_saleNumber_key" ON "manual_sales"("saleNumber");

-- CreateIndex
CREATE INDEX "manual_sale_items_manualSaleId_idx" ON "manual_sale_items"("manualSaleId");

-- CreateIndex
CREATE INDEX "manual_sale_items_productId_idx" ON "manual_sale_items"("productId");

-- AddForeignKey
ALTER TABLE "manual_sale_items" ADD CONSTRAINT "manual_sale_items_manualSaleId_fkey"
FOREIGN KEY ("manualSaleId") REFERENCES "manual_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_sale_items" ADD CONSTRAINT "manual_sale_items_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
