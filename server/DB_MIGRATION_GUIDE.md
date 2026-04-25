# Database Migration Guide

**Date:** April 7, 2026  
**PostgreSQL Version:** 12 or higher  
**Prisma Version:** 4.0+

---

## Overview

This migration adds new tables and enhancements to support the staff dashboard features:

1. **ProductAnalytics** table - Track product performance metrics
2. **StockTransfers** table - Manage inter-warehouse inventory movements
3. **Enhanced Customer model** - Add segment tracking and order metrics
4. **Enhanced Inventory model** - Add reorder points and warehouse management
5. **Enhanced Orders model** - Add tax tracking and delivery tracking
6. **New Enums** - CustomerSegment and StockTransferStatus

---

## Migration Files

### Migration 1: `20260407_add_product_analytics_stock_transfers`

**Purpose:** Add new tables and enhancements for dashboard features

**Changes:**

#### New Enums
- `CustomerSegment`: VIP, REGULAR, NEW, INACTIVE
- `StockTransferStatus`: PENDING, IN_TRANSIT, RECEIVED, CANCELLED

#### New Tables

**product_analytics**
```sql
CREATE TABLE "product_analytics" (
    id SERIAL PRIMARY KEY,
    productId INT UNIQUE NOT NULL,
    totalSold INT DEFAULT 0,
    totalRevenue DECIMAL(12,2) DEFAULT 0,
    totalViews INT DEFAULT 0,
    wishlistCount INT DEFAULT 0,
    avgRating DECIMAL(3,2),
    reviewCount INT DEFAULT 0,
    returnCount INT DEFAULT 0,
    lastSoldAt TIMESTAMP,
    lastUpdated TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);
```

**stock_transfers**
```sql
CREATE TABLE "stock_transfers" (
    id SERIAL PRIMARY KEY,
    productId INT NOT NULL,
    inventoryId INT NOT NULL,
    fromWarehouseId INT,
    toWarehouseId INT,
    quantity INT NOT NULL,
    status StockTransferStatus DEFAULT 'PENDING',
    initiatedBy INT NOT NULL,
    initiatedAt TIMESTAMP DEFAULT NOW(),
    receivedAt TIMESTAMP,
    referenceNumber TEXT UNIQUE,
    notes TEXT,
    
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (inventoryId) REFERENCES inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (initiatedBy) REFERENCES users(id) ON DELETE RESTRICT
);
```

#### Table Enhancements

**customers table enhancements**
- `totalOrders INT` - Track number of orders
- `lastOrderAt TIMESTAMP` - Track last purchase
- `segment CustomerSegment` - Customer segmentation (VIP, REGULAR, etc.)

**inventory table enhancements**
- `reorderPoint INT` - Minimum stock trigger for reordering
- `reorderQuantity INT` - Quantity to order when reordering
- `warehouseId INT` - Warehouse location (for multi-warehouse support)
- `lastCountedAt TIMESTAMP` - Last physical count date

**orders table enhancements**
- `taxAmount DECIMAL(12,2)` - Tax charges on order
- `shippedAt TIMESTAMP` - When order was shipped
- `deliveredAt TIMESTAMP` - When order was delivered

#### Indexes Created

**product_analytics indexes:**
- `product_analytics_productId_key` (UNIQUE)
- `product_analytics_totalSold_idx` (DESC)
- `product_analytics_totalRevenue_idx` (DESC)
- `product_analytics_totalViews_idx` (DESC)
- `product_analytics_wishlistCount_idx` (DESC)
- `product_analytics_avgRating_idx` (DESC)
- `product_analytics_lastUpdated_idx`

**stock_transfers indexes:**
- `stock_transfers_referenceNumber_key` (UNIQUE)
- `stock_transfers_productId_idx`
- `stock_transfers_inventoryId_idx`
- `stock_transfers_status_idx`
- `stock_transfers_initiatedAt_idx`
- `stock_transfers_fromWarehouseId_idx`
- `stock_transfers_toWarehouseId_idx`
- `stock_transfers_initiatedBy_idx`
- `stock_transfers_status_initiatedAt_idx` (COMPOSITE)

**customers table indexes:**
- `customers_segment_idx`
- `customers_loyaltyPoints_idx`
- `customers_totalSpent_idx`
- `customers_lastOrderAt_idx`
- `customers_segment_totalSpent_idx` (COMPOSITE)
- `customers_totalOrders_idx`

**inventory table indexes:**
- `inventory_reorderPoint_idx`
- `inventory_quantity_reorderPoint_idx` (COMPOSITE)
- `inventory_warehouseId_idx`
- `inventory_lastCountedAt_idx`

**orders table indexes:**
- `orders_shippedAt_idx`
- `orders_deliveredAt_idx`
- `orders_taxAmount_idx`

---

## Running the Migration

### Method 1: Using Prisma (Recommended)

```bash
# Navigate to server directory
cd server

# Create migration files from schema changes
npx prisma migrate deploy

# Or if you already have the migration file
npx prisma migrate deploy

# Verify migration
npx prisma db push

# Generate updated Prisma client
npx prisma generate
```

### Method 2: Direct SQL (if needed)

```bash
# Connect to PostgreSQL
psql -U postgres -d mouchak_cosmetics

# Run migration manually
\i prisma/migrations/20260407_add_product_analytics_stock_transfers/migration.sql

# Or using psql
psql -U postgres -d mouchak_cosmetics < migration.sql
```

### Method 3: Using pg_dump and pg_restore

```bash
# Backup database first
pg_dump -U postgres mouchak_cosmetics > backup.sql

# Connect and run migration
psql -U postgres -d mouchak_cosmetics < migration.sql
```

---

## Verification Steps

After running migration, verify all changes:

```sql
-- Check enums exist
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'public."CustomerSegment"'::regtype;

SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'public."StockTransferStatus"'::regtype;

-- Check product_analytics table
SELECT * FROM information_schema.tables 
WHERE table_name = 'product_analytics';

-- Check stock_transfers table
SELECT * FROM information_schema.tables 
WHERE table_name = 'stock_transfers';

-- Check customers enhancements
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Check inventory enhancements
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'inventory' 
ORDER BY ordinal_position;

-- Check orders enhancements
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check all indexes
SELECT * FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Count total indexes
SELECT COUNT(*) as total_indexes FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## Data Migration Tasks

After schema migration, perform these data tasks:

### 1. Populate Customer Segments

```sql
-- Segment customers based on spending
UPDATE customers
SET segment = CASE
  WHEN total_spent > 50000 THEN 'VIP'::CustomerSegment
  WHEN total_spent > 10000 THEN 'REGULAR'::CustomerSegment
  WHEN created_at > NOW() - INTERVAL '30 days' THEN 'NEW'::CustomerSegment
  ELSE 'INACTIVE'::CustomerSegment
END
WHERE segment = 'NEW';

-- Update creation date based on first order
UPDATE customers
SET last_order_at = (
  SELECT MAX(created_at) FROM orders 
  WHERE customer_id = customers.id
);

-- Count orders for each customer
UPDATE customers
SET total_orders = (
  SELECT COUNT(*) FROM orders 
  WHERE customer_id = customers.id
);
```

### 2. Initialize Product Analytics

```sql
-- Populate product sales data
INSERT INTO product_analytics (product_id, total_sold, total_revenue, last_sold_at)
SELECT 
  p.id,
  COALESCE(SUM(oi.quantity), 0),
  COALESCE(SUM(oi.total_price), 0),
  MAX(o.created_at)
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'DELIVERED'
GROUP BY p.id;

-- Update wishlist counts
UPDATE product_analytics pa
SET wishlist_count = (
  SELECT COUNT(*) FROM wishlist 
  WHERE product_id = pa.product_id
);

-- Update total views (if you have a views tracking table)
-- UPDATE product_analytics pa
-- SET total_views = (
--   SELECT COUNT(*) FROM product_views 
--   WHERE product_id = pa.product_id
-- );
```

### 3. Initialize Inventory Enhancements

```sql
-- Set default reorder points based on sales volume
UPDATE inventory i
SET 
  reorder_point = CASE
    WHEN COALESCE(pa.total_sold, 0) > 100 THEN 50
    WHEN COALESCE(pa.total_sold, 0) > 50 THEN 30
    WHEN COALESCE(pa.total_sold, 0) > 10 THEN 20
    ELSE 10
  END,
  reorder_quantity = CASE
    WHEN COALESCE(pa.total_sold, 0) > 100 THEN 200
    WHEN COALESCE(pa.total_sold, 0) > 50 THEN 100
    WHEN COALESCE(pa.total_sold, 0) > 10 THEN 50
    ELSE 20
  END,
  last_counted_at = NOW()
FROM product_analytics pa
WHERE i.product_id = pa.product_id;
```

---

## Rollback Procedure

If you need to rollback the migration:

### Using Prisma

```bash
# List migrations
npx prisma migrate status

# Rollback to previous migration
npx prisma migrate resolve --rolled-back 20260407_add_product_analytics_stock_transfers
```

### Manual Rollback SQL

```sql
-- Drop new tables
DROP TABLE IF EXISTS "stock_transfers" CASCADE;
DROP TABLE IF EXISTS "product_analytics" CASCADE;

-- Remove new columns
ALTER TABLE "customers" DROP COLUMN IF EXISTS "totalOrders";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "lastOrderAt";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "segment";

ALTER TABLE "inventory" DROP COLUMN IF EXISTS "reorderPoint";
ALTER TABLE "inventory" DROP COLUMN IF EXISTS "reorderQuantity";
ALTER TABLE "inventory" DROP COLUMN IF EXISTS "warehouseId";
ALTER TABLE "inventory" DROP COLUMN IF EXISTS "lastCountedAt";

ALTER TABLE "orders" DROP COLUMN IF EXISTS "taxAmount";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippedAt";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "deliveredAt";

-- Drop new enums
DROP TYPE IF EXISTS "CustomerSegment" CASCADE;
DROP TYPE IF EXISTS "StockTransferStatus" CASCADE;
```

---

## Performance Optimization

After migration, run these optimization commands:

```sql
-- Analyze all tables
ANALYZE;

-- Update table statistics
VACUUM ANALYZE;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Monitor slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 10
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## Monitoring and Maintenance

### Regular Tasks

```bash
# Weekly optimization
npx prisma db execute --stdin < optimize.sql

# Monthly maintenance
VACUUM FULL ANALYZE;

# Check database size
SELECT 
  datname as database,
  pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database
WHERE datname = 'mouchak_cosmetics';

# Check table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Expected Results

After successful migration:

✅ 2 new tables created (product_analytics, stock_transfers)  
✅ 3 tables enhanced with new columns  
✅ 2 new enums defined  
✅ 25+ new indexes created  
✅ All relationships properly configured  
✅ Foreign keys and constraints in place  

---

## Troubleshooting

### Issue: "Column already exists"

**Solution:** The migration has already been applied. Skip or rollback first.

```bash
npx prisma migrate status
```

### Issue: Foreign key constraint fails

**Solution:** Ensure all referenced tables and columns exist.

```sql
-- Check foreign keys
SELECT * FROM information_schema.key_column_usage 
WHERE table_name = 'stock_transfers';
```

### Issue: Enum type already exists

**Solution:** Drop enum and recreate or rename existing one.

```sql
-- List enums
SELECT * FROM pg_enum;

-- Drop if needed (carefully!)
DROP TYPE "CustomerSegment" CASCADE;
```

### Issue: Performance degrades after migration

**Solution:** Update statistics and optimize.

```bash
# Analyze tables
VACUUM ANALYZE;

# Check query plans
EXPLAIN ANALYZE SELECT * FROM product_analytics ORDER BY total_sold DESC LIMIT 10;
```

---

## Next Steps

After migration:

1. ✅ Update Prisma client in application
2. ✅ Run tests to verify database connectivity
3. ✅ Update API endpoints to use new tables
4. ✅ Populate analytics data
5. ✅ Monitor performance metrics
6. ✅ Deploy to staging environment
7. ✅ Run integration tests
8. ✅ Deploy to production

---

## Support

For issues or questions:

1. Check PostgreSQL logs: `/var/log/postgresql/`
2. Review Prisma docs: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
3. Check migration status: `npx prisma migrate status`
4. Review this guide and DATABASE_DESIGN.md

---

**Migration Status:** Ready to Deploy  
**Estimated Duration:** 5-10 minutes  
**Risk Level:** Low (migrations are backward compatible)  
**Rollback Complexity:** Low (can rollback if needed)

