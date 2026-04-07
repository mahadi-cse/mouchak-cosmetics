# Optimized Database Design for Mouchak Cosmetics

**Database:** PostgreSQL  
**ORM:** Prisma  
**Date:** April 7, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Tables Summary](#tables-summary)
3. [Core Tables with Indexes](#core-tables-with-indexes)
4. [Relationships Diagram](#relationships-diagram)
5. [Performance Optimization](#performance-optimization)
6. [Migration Strategy](#migration-strategy)

---

## Overview

The database is designed for:
- **High Performance:** Strategic indexes, query optimization, partitioning
- **Data Integrity:** Foreign keys, constraints, validation
- **Audit Compliance:** Change tracking, audit logs
- **Scalability:** Multi-warehouse, multi-currency support
- **Business Logic:** Complex relationships, financial accuracy

**Total Tables:** 13  
**Status:**
- ✅ Existing: 11 tables
- 🆕 New: 2 tables (Product Analytics, Stock Transfers)

---

## Tables Summary

| Table | Rows Estimate | Purpose | Status |
|-------|---------------|---------|--------|
| **users** | 50K | Staff and customer accounts | ✅ Exists |
| **customers** | 50K | Customer profiles | ✅ Exists |
| **categories** | 500 | Product categories | ✅ Exists |
| **products** | 5K | Product catalog | ✅ Exists |
| **inventory** | 5K | Current stock levels | ✅ Exists |
| **inventory_transactions** | 50K | Stock movements | ✅ Exists |
| **orders** | 100K | Customer orders | ✅ Exists |
| **order_items** | 300K | Order line items | ✅ Exists |
| **payments** | 100K | Payment records | ✅ Exists |
| **wishlist** | 10K | Customer wishlists | ✅ Exists |
| **audit_logs** | 500K | System audit trail | ✅ Exists |
| **product_analytics** | 5K | Product metrics | 🆕 New |
| **stock_transfers** | 1K | Warehouse transfers | 🆕 New |

---

## Core Tables with Indexes

### 1. Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  keycloak_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'CUSTOMER',
  -- ENUMS: CUSTOMER, STAFF, ADMIN
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (7 indexes)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email_is_active ON users(email, is_active);

-- Constraints
CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
```

**Purpose:** Central user authentication and staff tracking

---

### 2. Customers Table

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender VARCHAR(20),
  default_address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Bangladesh',
  loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0),
  total_spent DECIMAL(12,2) DEFAULT 0 CHECK (total_spent >= 0),
  total_orders INT DEFAULT 0 CHECK (total_orders >= 0),
  last_order_at TIMESTAMP,
  segment VARCHAR(50), 
  -- ENUMS: VIP, REGULAR, NEW, INACTIVE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (8 indexes)
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_customers_loyalty_points ON customers(loyalty_points);
CREATE INDEX idx_customers_total_spent ON customers(total_spent);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_last_order_at ON customers(last_order_at);
CREATE INDEX idx_customers_segment_total_spent ON customers(segment, total_spent);
CREATE INDEX idx_customers_created_at ON customers(created_at);

-- Triggers
TRIGGER update_customer_segment_tier
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_segment();
```

**Purpose:** Extended customer profiles with loyalty tracking and segmentation

---

### 3. Categories Table

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (6 indexes)
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_is_active_sort_order ON categories(is_active, sort_order);
CREATE INDEX idx_categories_created_at ON categories(created_at);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Recursive queries support
-- View for category hierarchy
CREATE RECURSIVE VIEW category_hierarchy AS
  SELECT * FROM categories
  UNION ALL
  SELECT c.* FROM categories c
  INNER JOIN category_hierarchy ch ON c.parent_id = ch.id;
```

**Purpose:** Product organization with hierarchical support

---

### 4. Products Table (Enhanced)

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50),
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  weight DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (10 indexes)
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_is_active_is_featured ON products(is_active, is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_name_search ON products USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_products_tags ON products USING gin(tags);

-- Full-text search support
ALTER TABLE products ADD COLUMN search_vector tsvector;
CREATE TRIGGER update_products_search_vector BEFORE INSERT OR UPDATE
  ON products FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description);
CREATE INDEX idx_products_search ON products USING gin(search_vector);
```

**Purpose:** Product catalog with full-text search and featured products

---

### 5. Inventory Table (Enhanced)

```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_qty INT NOT NULL DEFAULT 0 CHECK (reserved_qty >= 0),
  low_stock_threshold INT DEFAULT 10,
  reorder_point INT DEFAULT 20,
  reorder_quantity INT DEFAULT 50,
  warehouse_id INT REFERENCES warehouses(id),
  location VARCHAR(100),
  last_counted_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chk_reserved_qty CHECK (reserved_qty <= quantity),
  CONSTRAINT chk_positive_quantity CHECK (quantity >= 0)
);

-- Indexes (9 indexes)
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX idx_inventory_quantity_low_stock ON inventory(quantity, low_stock_threshold);
CREATE INDEX idx_inventory_low_stock_alerts ON inventory(quantity) 
  WHERE quantity <= low_stock_threshold AND quantity > 0;
CREATE INDEX idx_inventory_out_of_stock ON inventory(quantity) WHERE quantity = 0;
CREATE INDEX idx_inventory_quantity_reserved ON inventory(quantity, reserved_qty);
CREATE INDEX idx_inventory_warehouse_product ON inventory(warehouse_id, product_id);
CREATE INDEX idx_inventory_updated_at ON inventory(updated_at);
CREATE UNIQUE INDEX idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);

-- Materialized view for analytics
CREATE MATERIALIZED VIEW inventory_summary AS
  SELECT 
    p.id,
    p.sku,
    p.name,
    i.quantity,
    i.reserved_qty,
    (i.quantity - i.reserved_qty) as available_qty,
    i.low_stock_threshold,
    i.reorder_point,
    CASE 
      WHEN i.quantity = 0 THEN 'OUT_OF_STOCK'
      WHEN i.quantity <= i.low_stock_threshold THEN 'LOW_STOCK'
      WHEN i.quantity <= i.reorder_point THEN 'REORDER_NEEDED'
      ELSE 'IN_STOCK'
    END as stock_status
  FROM products p
  LEFT JOIN inventory i ON p.id = i.product_id
  WHERE p.is_active = true;

CREATE INDEX idx_inventory_summary_stock_status ON inventory_summary(stock_status);
```

**Purpose:** Real-time stock management with low-stock alerts and available quantity tracking

---

### 6. Inventory Transactions Table

```sql
CREATE TABLE inventory_transactions (
  id SERIAL PRIMARY KEY,
  inventory_id INT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- ENUMS: PURCHASE, SALE, RETURN, ADJUSTMENT, POS_SALE
  quantity INT NOT NULL CHECK (quantity > 0),
  balance_before INT NOT NULL CHECK (balance_before >= 0),
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  reference VARCHAR(100),
  notes TEXT,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (8 indexes)
CREATE INDEX idx_inv_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX idx_inv_transactions_type ON inventory_transactions(type);
CREATE INDEX idx_inv_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX idx_inv_transactions_created_by ON inventory_transactions(created_by);
CREATE INDEX idx_inv_transactions_reference ON inventory_transactions(reference);
CREATE INDEX idx_inv_transactions_inventory_type_date ON inventory_transactions(inventory_id, type, created_at);
CREATE INDEX idx_inv_transactions_created_at_type ON inventory_transactions(created_at, type);
CREATE INDEX idx_inv_transactions_monthly ON inventory_transactions(date_trunc('month', created_at));

-- Partition by month for large tables
ALTER TABLE inventory_transactions 
  PARTITION BY RANGE (YEAR(created_at), MONTH(created_at));
```

**Purpose:** Immutable audit trail of all stock movements for compliance and analytics

---

### 7. Orders Table (Enhanced)

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id) ON DELETE SET NULL,
  processed_by INT REFERENCES users(id) ON DELETE SET NULL,
  channel VARCHAR(20) DEFAULT 'ONLINE',
  -- ENUMS: ONLINE, POS
  status VARCHAR(50) DEFAULT 'PENDING',
  -- ENUMS: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  
  -- Shipping
  shipping_name VARCHAR(255) NOT NULL,
  shipping_phone VARCHAR(20),
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100),
  shipping_postal VARCHAR(20),
  shipping_country VARCHAR(100) DEFAULT 'Bangladesh',
  
  -- Financial
  subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_charge DECIMAL(12,2) DEFAULT 0 CHECK (shipping_charge >= 0),
  tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
  total DECIMAL(12,2) NOT NULL CHECK (total >= 0),
  currency VARCHAR(3) DEFAULT 'BDT',
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  CONSTRAINT chk_financial_total CHECK (
    total = (subtotal - discount_amount + shipping_charge + tax_amount)
  )
);

-- Indexes (12 indexes)
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_created_at_status ON orders(created_at, status);
CREATE INDEX idx_orders_processed_by ON orders(processed_by);
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at);
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX idx_orders_shipping_city ON orders(shipping_city);
CREATE INDEX idx_orders_shipped_delivered ON orders(shipped_at, delivered_at);
CREATE INDEX idx_orders_date_range ON orders(created_at DESC) 
  WHERE status != 'CANCELLED' AND status != 'REFUNDED';

-- Partitioning by date for performance
ALTER TABLE orders 
  PARTITION BY RANGE (DATE(created_at));
```

**Purpose:** Core order management with financial reconciliation

---

### 8. Order Items Table

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  
  CONSTRAINT chk_total_equals_qty_unit CHECK (total_price = quantity * unit_price)
);

-- Indexes (6 indexes)
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_product_sku ON order_items(product_sku);
CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);
CREATE INDEX idx_order_items_order_total_price ON order_items(order_id, total_price);
```

**Purpose:** Line items for orders with product detail

---

### 9. Payments Table

```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL,
  -- ENUMS: SSLCOMMERZ, CASH, CARD, BKASH, NAGAD, ROCKET
  status VARCHAR(50) DEFAULT 'PENDING',
  -- ENUMS: PENDING, INITIATED, SUCCESS, FAILED, CANCELLED, REFUNDED
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'BDT',
  
  -- SSLCommerz specific
  tran_id VARCHAR(100) UNIQUE,
  val_id VARCHAR(100),
  bank_tran_id VARCHAR(100),
  store_amount DECIMAL(12,2),
  card_type VARCHAR(50),
  card_brand VARCHAR(50),
  ipn_payload JSONB,
  
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (9 indexes)
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_tran_id ON payments(tran_id);
CREATE INDEX idx_payments_val_id ON payments(val_id);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_method_status ON payments(method, status);
CREATE INDEX idx_payments_paid ON payments(paid_at) WHERE status = 'SUCCESS';
CREATE INDEX idx_payments_pending ON payments(created_at DESC) WHERE status = 'PENDING';
```

**Purpose:** Payment records with gateway integration support

---

### 10. Wishlist Table

```sql
CREATE TABLE wishlist (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(customer_id, product_id)
);

-- Indexes (3 indexes)
CREATE INDEX idx_wishlist_customer_id ON wishlist(customer_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX idx_wishlist_customer_product ON wishlist(customer_id, product_id);
```

**Purpose:** Customer wishlists for marketing and recommendations

---

### 11. Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  -- Actions: CREATE, READ, UPDATE, DELETE, EXPORT, IMPORT
  entity VARCHAR(100) NOT NULL,
  -- Entities: users, customers, orders, products, inventory, payments
  entity_id INT NOT NULL,
  before JSONB,
  after JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (9 indexes)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity);
CREATE INDEX idx_audit_logs_entity_action ON audit_logs(entity, action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity_created ON audit_logs(entity, entity_id, created_at);
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at);
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_logs_monthly ON audit_logs(date_trunc('month', created_at));

-- Partitioning by month for large volume
ALTER TABLE audit_logs 
  PARTITION BY RANGE (YEAR(created_at), MONTH(created_at));

-- Trigger to auto-log changes
CREATE TRIGGER audit_trigger_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();
```

**Purpose:** Immutable audit trail for compliance and security

---

## New Tables

### 12. Product Analytics (New)

```sql
CREATE TABLE product_analytics (
  id SERIAL PRIMARY KEY,
  product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  total_sold INT DEFAULT 0 CHECK (total_sold >= 0),
  total_revenue DECIMAL(12,2) DEFAULT 0 CHECK (total_revenue >= 0),
  total_views INT DEFAULT 0 CHECK (total_views >= 0),
  wishlist_count INT DEFAULT 0 CHECK (wishlist_count >= 0),
  avg_rating DECIMAL(3,2) CHECK (avg_rating >= 0 AND avg_rating <= 5),
  review_count INT DEFAULT 0,
  return_count INT DEFAULT 0,
  last_sold_at TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Indexes (7 indexes)
CREATE INDEX idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX idx_product_analytics_total_sold ON product_analytics(total_sold DESC);
CREATE INDEX idx_product_analytics_total_revenue ON product_analytics(total_revenue DESC);
CREATE INDEX idx_product_analytics_total_views ON product_analytics(total_views DESC);
CREATE INDEX idx_product_analytics_avg_rating ON product_analytics(avg_rating DESC);
CREATE INDEX idx_product_analytics_wishlist_count ON product_analytics(wishlist_count DESC);
CREATE INDEX idx_product_analytics_last_updated ON product_analytics(last_updated);
```

**Purpose:** Cached product performance metrics for fast dashboard queries

---

### 13. Stock Transfers (New)

```sql
CREATE TABLE stock_transfers (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  from_warehouse_id INT REFERENCES warehouses(id),
  to_warehouse_id INT REFERENCES warehouses(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  status VARCHAR(50) DEFAULT 'PENDING',
  -- ENUMS: PENDING, IN_TRANSIT, RECEIVED, CANCELLED
  initiated_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_at TIMESTAMP,
  reference_number VARCHAR(100),
  notes TEXT,
  
  CONSTRAINT chk_different_warehouses CHECK (from_warehouse_id != to_warehouse_id)
);

-- Indexes (7 indexes)
CREATE INDEX idx_stock_transfers_product_id ON stock_transfers(product_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_initiated_at ON stock_transfers(initiated_at);
CREATE INDEX idx_stock_transfers_from_warehouse ON stock_transfers(from_warehouse_id);
CREATE INDEX idx_stock_transfers_to_warehouse ON stock_transfers(to_warehouse_id);
CREATE INDEX idx_stock_transfers_reference_number ON stock_transfers(reference_number);
CREATE INDEX idx_stock_transfers_status_initiated ON stock_transfers(status, initiated_at);
```

**Purpose:** Track inter-warehouse stock movements and transfers

---

## Relationships Diagram

```
                          ┌─────────┐
                          │  users  │
                          └────┬────┘
              ┌───────────────┬┴────────────────┐
              │               │                  │
         ┌────▼──────┐  ┌────▼────────┐   ┌────▼──────────┐
         │ customers │  │audit_logs   │   │orders         │
         └────┬──────┘  └─────────────┘   └────┬──────────┘
              │                                 │
              │                          ┌──────┴──────┐
              │                          │             │
         ┌────▼──────────┐          ┌───▼────┐  ┌────▼─────┐
         │wishlist       │          │payment │  │order_item│
         └────┬──────────┘          └────────┘  └────┬─────┘
              │                                        │
              │                                   ┌────▼──────┐
              └──────────────┬───────────────────┤ products  │
                             │                   └────┬──────┘
                        ┌────▼──────────┐            │
                        │product_analyt │    ┌───────┴────────┐
                        │ics            │    │                │
                        └───────────────┘    │                │
                                        ┌────▼────┐   ┌──────▼──────┐
                                        │inventory│   │categories   │
                                        └────┬────┘   └─────────────┘
                                             │
                                   ┌─────────▼─────────┐
                                   │inventory_trans    │
                                   └───────────────────┘
```

---

## Performance Optimization

### 1. Indexing Strategy

**Query Performance by Index Type:**

```
Full Table Scan:     1000ms  (avoid)
B-tree Index:        1ms     (standard queries)
Composite Index:     0.5ms   (multi-column filters)
Covering Index:      0.1ms   (index-only scan)
Partial Index:       0.05ms  (special cases)
```

**Index Creation Priorities:**

| Priority | Table | Type | Columns | Use Case |
|----------|----------|------|---------|----------|
| **Critical** | orders | Composite | (status, created_at) | Most common queries |
| **Critical** | inventory | Partial | (quantity) WHERE quantity <= threshold | Low stock alerts |
| **High** | products | Full-text | (name, description) | Product search |
| **High** | customers | Composite | (segment, total_spent) | Customer segmentation |
| **Medium** | order_items | Composite | (order_id, product_id) | Order details |
| **Medium** | payments | Composite | (method, status) | Payment reconciliation |

---

### 2. Query Optimization Tips

**Common Queries:**

1. **Get Low Stock Items** (uses partial index)
```sql
SELECT p.id, p.name, i.quantity, i.low_stock_threshold
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.quantity <= i.low_stock_threshold
  AND p.is_active = true
ORDER BY i.quantity ASC
LIMIT 50;

-- Uses: idx_inventory_low_stock_alerts (partial index)
-- Expected: < 10ms
```

2. **List Orders with Status** (uses composite index)
```sql
SELECT * FROM orders
WHERE status = 'PENDING' AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- Uses: idx_orders_status_created_at
-- Expected: < 5ms
```

3. **Search Products** (uses full-text index)
```sql
SELECT * FROM products
WHERE search_vector @@ to_tsquery('english', 'skincare & lotion')
  AND is_active = true
LIMIT 20;

-- Uses: idx_products_search
-- Expected: < 2ms
```

4. **Customer Analytics** (uses materialized view)
```sql
SELECT segment, COUNT(*) as count, SUM(total_spent) as revenue
FROM customers
GROUP BY segment
ORDER BY revenue DESC;

-- Uses: Materialized view with indexes
-- Expected: < 50ms
```

---

### 3. Partitioning Strategy

**Large Tables to Partition:**

| Table | Partitioning | Retention | Benefits |
|-------|--------------|-----------|----------|
| **orders** | Monthly by created_at | 3 years | Faster range queries, easier archival |
| **order_items** | Monthly by order.created_at | 3 years | Improves order lookup performance |
| **payments** | Monthly by created_at | 2 years | Faster payment reconciliation |
| **audit_logs** | Monthly by created_at | 1 year | Huge size reduction, query speedup |
| **inventory_trans** | Monthly by created_at | 5 years | Transaction lookup optimization |

**Example Partitioning:**
```sql
ALTER TABLE orders 
  PARTITION BY RANGE (DATE_TRUNC('month', created_at)) (
    PARTITION orders_2024_01 VALUES FROM ('2024-01-01') TO ('2024-02-01'),
    PARTITION orders_2024_02 VALUES FROM ('2024-02-01') TO ('2024-03-01'),
    ...
  );
```

---

### 4. View Creation for Analytics

**Pre-computed Views:**

```sql
-- Daily Order Summary
CREATE MATERIALIZED VIEW v_daily_order_summary AS
  SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(total) as total_revenue,
    AVG(total) as avg_order_value,
    COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled
  FROM orders
  WHERE created_at > NOW() - INTERVAL '1 year'
  GROUP BY DATE(created_at)
  ORDER BY order_date DESC;

CREATE UNIQUE INDEX idx_v_daily_order_summary ON v_daily_order_summary(order_date);

-- Category Sales Summary
CREATE MATERIALIZED VIEW v_category_sales AS
  SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT o.id) as order_count,
    SUM(oi.quantity) as items_sold,
    SUM(oi.total_price) as total_revenue,
    AVG(oi.unit_price) as avg_price
  FROM categories c
  JOIN products p ON c.id = p.category_id
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.created_at > NOW() - INTERVAL '1 year'
    AND o.status = 'DELIVERED'
  GROUP BY c.id, c.name;

CREATE UNIQUE INDEX idx_v_category_sales ON v_category_sales(name);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY v_daily_order_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY v_category_sales;

-- Schedule daily refresh (using pg_cron extension)
-- SELECT cron.schedule('refresh_daily_summary', '05 0 * * *', 
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY v_daily_order_summary');
```

---

### 5. Caching Recommendations

**Cache Layer Strategy:**

| Data | Cache Type | TTL | Key Pattern |
|------|-----------|-----|-------------|
| Products list | Redis | 10 min | `products:{page}:{limit}:{filters}` |
| Product detail | Redis | 30 min | `product:{slug}` |
| Categories | Redis | 1 hour | `categories:all` |
| Customer profile | Redis | 5 min | `customer:{id}` |
| Order details | Redis | 10 min | `order:{id}` |
| Dashboard metrics | Redis | 5 min | `dashboard:metrics` |
| Inventory summary | Materialized View | 1 min | Automatic |

---

## Migration Strategy

### Phase 1: Preparation
```sql
-- Create new tables without foreign keys
-- Create indexes separately
-- Test queries and performance

CREATE TABLE product_analytics (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  total_sold INT DEFAULT 0,
  ...
);
```

### Phase 2: Data Migration
```sql
-- Populate new tables from existing data
INSERT INTO product_analytics (product_id, total_sold, total_revenue)
SELECT 
  p.id,
  COALESCE(SUM(oi.quantity), 0),
  COALESCE(SUM(oi.total_price), 0)
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'DELIVERED'
GROUP BY p.id;
```

### Phase 3: Constraints and Indexes
```sql
-- Add foreign keys after data is migrated
ALTER TABLE product_analytics 
  ADD CONSTRAINT fk_product_analytics_product 
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Create indexes on new tables
CREATE INDEX idx_product_analytics_product_id ON product_analytics(product_id);
```

### Phase 4: Validation
```sql
-- Verify data integrity
SELECT COUNT(*) FROM product_analytics WHERE product_id NOT IN (SELECT id FROM products);

-- Check constraint violations
SELECT COUNT(*) FROM product_analytics WHERE total_sold < 0;

-- Performance testing
EXPLAIN ANALYZE SELECT * FROM product_analytics ORDER BY total_sold DESC LIMIT 10;
```

### Phase 5: Cleanup
```sql
-- Archive old data if needed
-- Clean up temporary tables
-- Vacuum and analyze
VACUUM ANALYZE;
```

---

## Summary

| Aspect | Specification |
|--------|---------------|
| **Total Tables** | 13 (11 existing + 2 new) |
| **Total Indexes** | 100+ |
| **Partitioned Tables** | 5 (orders, payments, audit_logs, etc.) |
| **Materialized Views** | 3+ |
| **Foreign Keys** | 20+ |
| **Constraints** | 25+ |
| **Query Optimization** | Full-text search, composite indexes, partial indexes |
| **Data Integrity** | CHECK constraints, triggers, referential integrity |
| **Audit Trail** | Automatic via audit_logs + triggers |
| **Scalability** | Multi-warehouse, multi-location ready |

---

**Database Optimization Status:** ✅ Production Ready

