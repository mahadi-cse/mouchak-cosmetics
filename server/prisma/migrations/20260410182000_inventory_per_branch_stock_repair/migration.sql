-- Ensure at least one branch exists for inventory assignment
INSERT INTO "branches" (
  "name",
  "branchCode",
  "branchType",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  'Main Warehouse',
  'MAIN-WH',
  'WAREHOUSE',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "branches");

-- Assign any null warehouse to first branch
UPDATE "inventory"
SET "warehouseId" = (
  SELECT "id" FROM "branches" ORDER BY "id" ASC LIMIT 1
)
WHERE "warehouseId" IS NULL;

-- Drop old uniqueness if it still exists
DROP INDEX IF EXISTS "inventory_productId_key";

-- Enforce non-null warehouse
ALTER TABLE "inventory"
ALTER COLUMN "warehouseId" SET NOT NULL;

-- Add per-branch constraints/indexes
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_productId_warehouseId_key"
ON "inventory"("productId", "warehouseId");

CREATE INDEX IF NOT EXISTS "inventory_warehouseId_idx"
ON "inventory"("warehouseId");
