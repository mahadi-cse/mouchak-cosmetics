-- Ensure existing rows have a branch assigned
UPDATE "inventory"
SET "warehouseId" = (
  SELECT "id" FROM "branches" ORDER BY "id" ASC LIMIT 1
)
WHERE "warehouseId" IS NULL;

-- Drop old uniqueness (one row per product)
DROP INDEX IF EXISTS "inventory_productId_key";

-- Make warehouse mandatory for per-branch stock
ALTER TABLE "inventory"
ALTER COLUMN "warehouseId" SET NOT NULL;

-- Add per-branch uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_productId_warehouseId_key"
ON "inventory"("productId", "warehouseId");

CREATE INDEX IF NOT EXISTS "inventory_warehouseId_idx"
ON "inventory"("warehouseId");
