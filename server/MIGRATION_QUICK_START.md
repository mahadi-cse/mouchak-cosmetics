# Database Migration - Quick Start Guide

**Target:** Local Development & Deployment  
**Duration:** 5 minutes  
**Difficulty:** Easy ✅

---

## 📋 Overview

This migration adds:
- 📊 ProductAnalytics table (product performance metrics)
- 📦 StockTransfers table (warehouse inventory transfers)
- 👥 Customer segmentation fields
- 📈 Inventory reorder optimization
- 🧮 Order tax tracking
- 25+ performance indexes

**Files:**
- `schema.prisma` - Updated schema ✅
- `migrations/20260407_add_product_analytics_stock_transfers/migration.sql` - SQL migration ✅
- `prisma/seed-dashboard.ts` - Data initialization ✅
- `DB_MIGRATION_GUIDE.md` - Detailed guide

---

## 🚀 Quick Start (5 minutes)

### Step 1: Update Dependencies (1 min)
```bash
cd server
npm install
```

### Step 2: Run Migration (2 min)
```bash
# Deploy migration
npx prisma migrate deploy

# Expected: ✔ Applied migrations:
#           • 20260407_add_product_analytics_stock_transfers
```

### Step 3: Generate Prisma Client (1 min)
```bash
npx prisma generate
```

### Step 4: Seed Data (1 min)
```bash
# Initialize product analytics and customer segments
npx tsx prisma/seed-dashboard.ts

# Expected: ✨ Database seed completed successfully!
```

### Step 5: Verify (optional but recommended)
```bash
# Test database connection
npx prisma studio

# Or verify via CLI
npx prisma db execute --stdin < verify.sql
```

**Done!** ✅ Migration complete.

---

## 🔄 Step-by-Step Details

### 1. Navigate to Server Directory
```bash
cd "f:\My Projects\Mouchak Cosmetics\server"
```

### 2. Check Prisma Status
```bash
npx prisma migrate status

# Shows pending migrations:
# On database "mouchak_cosmetics": 1 migration pending
#   20260407_add_product_analytics_stock_transfers
```

If already applied, skip to Step 3.

### 3. Apply Migration
```bash
npx prisma migrate deploy

# Console output:
# ✔ Applied migrations:
#   • 20260407_add_product_analytics_stock_transfers
```

### 4. Regenerate Prisma Client
```bash
npx prisma generate

# Console output:
# ✔ Generated Prisma Client to ./node_modules/.prisma/client
```

### 5. Seed Database
```bash
npx tsx prisma/seed-dashboard.ts

# Console output:
# 🌱 Starting database seed...
# 📊 Initializing product analytics...
# ✅ Initialized analytics for X products
# 👥 Updating customer segments and metrics...
# ✅ Updated segments for X customers
# 📦 Initializing inventory reorder points...
# ✅ Initialized reorder points for X inventory items
# ✨ Database seed completed successfully!
```

### 6. Verify Tables
```bash
# Open Prisma Studio
npx prisma studio

# Browse:
# • ProductAnalytics (new table)
# • StockTransfer (new table)
# • Check enhanced tables: customers, inventory, orders
```

Or use direct queries:
```bash
psql -U postgres -d mouchak_cosmetics
```

```sql
-- Count new tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_name IN ('product_analytics', 'stock_transfers');

-- Count indexes
SELECT COUNT(*) FROM pg_indexes 
WHERE tablename IN ('product_analytics', 'stock_transfers', 'customers', 'inventory', 'orders');

-- Check enums
SELECT enum_range(null::"CustomerSegment");
SELECT enum_range(null::"StockTransferStatus");
```

### 7. Restart Application
```bash
# In separate terminal
cd client
npm run dev

# In another terminal
cd server
npm run dev
```

---

## 🔍 Verify Migration Success

### Quick Checks

**Check 1: Tables exist**
```bash
npx prisma studio
# Navigate to ProductAnalytics and StockTransfer
```

**Check 2: Indexes created**
```sql
psql -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('product_analytics', 'stock_transfers');"
# Should return > 15
```

**Check 3: Data populated**
```sql
psql -c "SELECT COUNT(*) FROM product_analytics;"
# Should match number of products
```

**Check 4: Relationships working**
```javascript
// In Node.js REPL
const { prisma } = require('./dist/config/database');

// Test relationship
const product = await prisma.product.findFirst({
  include: { analytics: true }
});
console.log(product.analytics); // Should have data
```

---

## 📝 Schema Changes Summary

### New Tables
```typescript
// ProductAnalytics
{
  id: number
  productId: number (unique, FK to products)
  totalSold: number
  totalRevenue: Decimal
  totalViews: number
  wishlistCount: number
  avgRating: Decimal
  reviewCount: number
  returnCount: number
  lastSoldAt: DateTime
  lastUpdated: DateTime
}

// StockTransfer
{
  id: number
  productId: number (FK to products)
  inventoryId: number (FK to inventory)
  fromWarehouseId: number
  toWarehouseId: number
  quantity: number
  status: 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'
  initiatedBy: number (FK to users)
  initiatedAt: DateTime
  receivedAt: DateTime
  referenceNumber: string (unique)
  notes: string
}
```

### Enhanced Tables
```typescript
// customers (added)
{
  totalOrders: number
  lastOrderAt: DateTime
  segment: 'VIP' | 'REGULAR' | 'NEW' | 'INACTIVE'
}

// inventory (added)
{
  reorderPoint: number
  reorderQuantity: number
  warehouseId: number
  lastCountedAt: DateTime
}

// orders (added)
{
  taxAmount: Decimal
  shippedAt: DateTime
  deliveredAt: DateTime
}
```

### New Enums
```typescript
enum CustomerSegment {
  VIP
  REGULAR
  NEW
  INACTIVE
}

enum StockTransferStatus {
  PENDING
  IN_TRANSIT
  RECEIVED
  CANCELLED
}
```

---

## ⚠️ Troubleshooting

### Issue: "Prisma has detected a migration"
```bash
# Newer version of Prisma, just follow prompt
npx prisma migrate deploy
```

### Issue: "Cannot connect to database"
```bash
# Verify PostgreSQL is running
# Check DATABASE_URL in .env
# Verify credentials
psql -U postgres -d postgres
```

### Issue: "Cannot find migration file"
```bash
# Ensure migration exists
ls server/prisma/migrations/

# Or regenerate
npx prisma migrate deploy
```

### Issue: "Column already exists"
```bash
# Already applied, check status
npx prisma migrate status

# Show resolved
npx prisma migrate resolve --rolled-back 20260407_add_product_analytics_stock_transfers
```

### Issue: "Foreign key constraint"
```bash
# Check if dependencies exist
npx prisma validate

# Regenerate
npx prisma generate
```

---

## 📚 Next Steps

### After Successful Migration

1. **Test APIs**
   ```bash
   curl http://localhost:5000/api/products
   ```

2. **Verify Prisma Client**
   ```javascript
   // In Node.js
   import { prisma } from '@/lib/db';
   
   const analytics = await prisma.productAnalytics.findMany();
   console.log(analytics);
   ```

3. **Run Tests**
   ```bash
   npm run test
   npm run test:db
   ```

4. **Check TypeScript**
   ```bash
   npx tsc --noEmit
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(db): add product analytics and stock transfers migration"
   git push origin feature/dashboard-migration
   ```

---

## 🎯 Using New Tables

### ProductAnalytics (Dashboard Queries)

```typescript
// Get top products by revenue
const topProducts = await prisma.productAnalytics.findMany({
  orderBy: { totalRevenue: 'desc' },
  take: 10,
  include: { product: true }
});

// Get best sellers
const bestSellers = await prisma.productAnalytics.findMany({
  orderBy: { totalSold: 'desc' },
  take: 10
});

// Get low-viewed products
const poorPerformers = await prisma.productAnalytics.findMany({
  orderBy: { totalViews: 'asc' },
  take: 10
});
```

### StockTransfers (Inventory Management)

```typescript
// Create transfer
const transfer = await prisma.stockTransfer.create({
  data: {
    productId: 1,
    inventoryId: 1,
    fromWarehouseId: 1,
    toWarehouseId: 2,
    quantity: 50,
    initiatedBy: userId,
    referenceNumber: generateReference()
  }
});

// Get pending transfers
const pending = await prisma.stockTransfer.findMany({
  where: { status: 'PENDING' },
  include: { product: true, initiatedByUser: true }
});

// Complete transfer
await prisma.stockTransfer.update({
  where: { id: transferId },
  data: { 
    status: 'RECEIVED',
    receivedAt: new Date()
  }
});
```

### Customer Segments (Marketing/Analytics)

```typescript
// Get VIP customers
const vips = await prisma.customer.findMany({
  where: { segment: 'VIP' },
  include: { user: true, orders: true }
});

// Count by segment
const segments = await prisma.customer.groupBy({
  by: ['segment'],
  _count: true,
  _sum: { totalSpent: true }
});
```

---

## 📞 Support

**Need help?**

1. Check [DB_MIGRATION_GUIDE.md](./DB_MIGRATION_GUIDE.md) for detailed info
2. Review [DATABASE_DESIGN.md](../DATABASE_DESIGN.md) for schema details
3. Check [Prisma docs](https://www.prisma.io/docs)
4. Run `npx prisma help`

**Common commands:**
```bash
npx prisma migrate status        # See pending migrations
npx prisma migrate dev          # Create & apply migration
npx prisma studio              # Visual database browser
npx prisma generate            # Regenerate client
npx prisma validate            # Check schema syntax
npx prisma db push             # Push schema to database
```

---

## ✅ Checklist

- [ ] PostgreSQL running
- [ ] `cd server` is current directory
- [ ] `npm install` completed
- [ ] `npx prisma migrate deploy` succeeded
- [ ] `npx prisma generate` succeeded
- [ ] `npx tsx prisma/seed-dashboard.ts` succeeded
- [ ] Tables verified in Prisma Studio
- [ ] Application starts without errors
- [ ] API responding
- [ ] Tests passing

---

**Status:** ✅ Ready to Deploy  
**Time to Complete:** 5 minutes  
**Risk Level:** Low  
**Reversible:** Yes (via rollback)

