-- Improve dashboard overview query performance on manual sales time-range and branch filters
CREATE INDEX IF NOT EXISTS "manual_sales_createdAt_idx" ON "manual_sales"("createdAt");
CREATE INDEX IF NOT EXISTS "manual_sales_branchId_createdAt_idx" ON "manual_sales"("branchId", "createdAt");
