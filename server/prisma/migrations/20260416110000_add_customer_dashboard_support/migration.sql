-- Customer dashboard support improvements
-- 1) customer activation state
-- 2) faster order/wishlist lookups for customer dashboard queries

ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "orders_customerId_createdAt_idx"
ON "orders"("customerId", "createdAt");

CREATE INDEX IF NOT EXISTS "orders_customerId_status_idx"
ON "orders"("customerId", "status");

CREATE INDEX IF NOT EXISTS "wishlist_customerId_createdAt_idx"
ON "wishlist"("customerId", "createdAt");
