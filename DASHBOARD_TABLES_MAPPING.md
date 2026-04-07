# Dashboard Tables Mapping - Complete Reference

**Created:** April 7, 2026  
**Status:** Comprehensive mapping of all database tables used by dashboard features  
**Total Tables:** 13 core tables (all related to dashboard)  
**Quick Links:** [Module Mapping](#module-to-table-mapping) | [Table Schemas](#detailed-table-schemas) | [Relationships](#table-relationships) | [SQL Create Statements](#sql-create-statements) | [Query Examples](#common-dashboard-queries)

---

## Executive Summary

All 13 database tables are essential to the Mouchak Cosmetics dashboard system. This document provides a single source of truth for:
- Which dashboard modules use which tables
- Complete schema for each table
- Table relationships and foreign keys
- SQL create statements for implementation
- Common dashboard queries

---

## Module-to-Table Mapping

### 1. Dashboard (Main Overview)
**Tables Used:** orders, order_items, customers, products, inventory, product_analytics, payments

**Purpose:** Display key metrics and KPIs  
**Columns Needed:**
- orders: id, totalAmount, status, createdAt, updatedAt, shippedAt, deliveredAt, taxAmount
- order_items: orderId, productId, quantity, price
- customers: id, totalOrders, lastOrderAt, segment, totalSpent
- products: id, name, price, stock
- product_analytics: totalSold, totalRevenue, totalViews, avgRating
- payments: amount, status, method, gateway_transaction_id
- inventory: quantity, reorderPoint

**Key Metrics:**
- Total Sales (sum of orders.totalAmount)
- Total Orders Today (count orders where createdAt = TODAY)
- Total Customers (count distinct customers)
- Low Stock Items (inventory where quantity < reorderPoint)

---

### 2. Products Management
**Tables Used:** products, categories, inventory, product_analytics, wishlist

**Purpose:** View, create, edit, delete products and manage catalog  
**Columns Needed:**
- products: id, name, description, price, categoryId, sku, images, stock, createdAt, updatedAt
- categories: id, name, description, image
- inventory: productId, quantity, reorderPoint, reorderQuantity, warehouseId, lastCountedAt
- product_analytics: productId, totalSold, totalViews, wishlistCount, avgRating, returnCount
- wishlist: productId, userId, createdAt

**Operations:**
- List all products with categories
- Get product details with analytics and inventory
- Create new product (adds to products, inventory, product_analytics)
- Update product price, stock, category
- View product analytics (sales, views, wishlist count)

---

### 3. Inventory Management
**Tables Used:** inventory, inventory_transactions, products, stock_transfers, categories

**Purpose:** Track stock levels, transactions, and inter-warehouse transfers  
**Columns Needed:**
- inventory: id, productId, quantity, reorderPoint, reorderQuantity, warehouseId, lastCountedAt
- inventory_transactions: id, inventoryId, productId, transactionType, quantity, reference, notes, createdAt
- products: id, name, sku, price, images
- stock_transfers: id, productId, inventoryId, fromWarehouse, toWarehouse, quantity, status, initiatedBy, initiatedAt, receivedAt
- categories: id, name (for filtering)

**Operations:**
- View current stock levels by warehouse
- Track inventory transactions (purchases, sales, returns, adjustments)
- Manage stock transfers between warehouses
- Set reorder points and quantities
- Flag low-stock items for reordering

**Transaction Types:**
- PURCHASE: Stock received from suppliers
- SALE: Stock decreased by customer orders
- RETURN: Stock returned by customers
- ADJUSTMENT: Manual inventory adjustment
- POS_SALE: Direct point-of-sale sales

---

### 4. Orders Management
**Tables Used:** orders, order_items, customers, products, payments, users, inventory

**Purpose:** Manage customer orders from creation to delivery  
**Columns Needed:**
- orders: id, customerId, totalAmount, status, paymentId, channel, shippedAt, deliveredAt, taxAmount, notes, createdAt
- order_items: id, orderId, productId, quantity, price
- customers: id, name, email, phone, addresses, totalOrders, lastOrderAt
- products: id, name, sku, price, images
- payments: id, orderId, amount, status, method, gateway_transaction_id, paidAt
- users: id, name, role (staff who processed order)
- inventory: quantity (for stock availability check)

**Operations:**
- Create new order (PENDING status)
- Update order status (CONFIRMED, PROCESSING, SHIPPED, DELIVERED)
- Track payment status
- View order items and pricing
- Manage order returns and cancellations
- Filter by status, customer, date range
- Export order reports

**Order Statuses:** PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED (or CANCELLED, REFUNDED)

---

### 5. Customer Management
**Tables Used:** customers, orders, order_items, wishlist, products, payments, users

**Purpose:** Manage customer profiles, segments, and purchase history  
**Columns Needed:**
- customers: id, name, email, phone, addresses, totalOrders, totalSpent, lastOrderAt, segment, loyaltyPoints, notes, createdAt
- orders: customerId, totalAmount, status, createdAt (for purchase history)
- order_items: orderId, productId, quantity (for what they bought)
- wishlist: customerId, productId, createdAt (for wishlist tracking)
- products: id, name, price, images (what's on their wishlist)
- payments: amount, status, method (payment history)
- users: id, name (if staff assigned to customer account)

**Operations:**
- View all customers with segments and loyalty metrics
- Filter by segment (VIP, REGULAR, NEW, INACTIVE)
- View customer purchase history
- View customer wishlist
- Update customer profile and contact info
- Assign loyalty points
- View payment methods on file

**Customer Segments:**
- VIP: totalSpent >= 50,000
- REGULAR: totalSpent 10,000-50,000
- NEW: accountCreatedAt <= 30 days ago
- INACTIVE: lastOrderAt > 90 days ago

---

### 6. POS (Point of Sale)
**Tables Used:** orders, order_items, customers, products, inventory, payments, users, categories

**Purpose:** Ring up sales at physical registers, manage in-store transactions  
**Columns Needed:**
- orders: id, customerId, totalAmount, status, channel (POS_SALE), taxAmount, createdAt
- order_items: orderId, productId, quantity, price
- customers: id, name, phone, email, loyaltyPoints (for loyalty lookups)
- products: id, name, price, sku, images, stock
- inventory: productId, quantity (for real-time stock check)
- payments: orderId, amount, method, status (CASH, CARD, BKASH, NAGAD, ROCKET)
- users: id, name, role (cashier information)
- categories: id, name (for quick product search/filtering)

**Operations:**
- Quick product lookup by name or SKU
- Add items to cart with real-time stock check
- Apply discounts/promotions
- Process payment (cash, card, mobile money)
- Apply loyalty points
- Complete transaction
- Print receipt
- Void/refund sales
- End-of-day cash reconciliation

---

### 7. Analytics & Reporting
**Tables Used:** product_analytics, orders, order_items, customers, products, categories, inventory, payments, inventory_transactions

**Purpose:** Generate sales reports, product performance, customer analytics, inventory analytics  
**Columns Needed:**
- product_analytics: productId, totalSold, totalRevenue, totalViews, wishlistCount, avgRating, reviewCount, returnCount, lastSoldAt
- orders: id, totalAmount, status, createdAt, customerId, channel
- order_items: productId, quantity, price
- customers: id, totalSpent, segment, lastOrderAt
- products: id, name, categoryId, price
- categories: id, name
- inventory: quantity, reorderPoint, lastCountedAt
- payments: amount, status, method, createdAt
- inventory_transactions: transactionType, quantity, createdAt

**Reports Available:**
- Sales by date range, category, product
- Top products by revenue or quantity sold
- Customer segments and spending patterns
- Inventory turnover rate
- Payment method analysis
- Return and refund rates
- Low stock alerts
- Revenue forecasting (based on historical data)

---

### 8. Reports
**Tables Used:** orders, order_items, customers, products, inventory, payments, product_analytics, inventory_transactions

**Purpose:** Generate formal business reports for management  
**Columns Needed:**
- orders: totalAmount, status, createdAt, customerId
- order_items: productId, quantity, price
- customers: id, name, email, totalSpent, segment
- products: id, name, categoryId
- inventory: quantity, reorderPoint, lastCountedAt
- payments: amount, status, gateway_transaction_id
- product_analytics: totalSold, totalRevenue, avgRating
- inventory_transactions: transactionType, quantity, createdAt

**Report Types:**
- Sales reports (daily, weekly, monthly, annual)
- Revenue by product/category/customer
- Customer acquisition and retention
- Inventory aging and turnover
- Payment reconciliation
- Outstanding orders/invoices
- Discount and refund analysis

---

### 9. Categories Management
**Tables Used:** categories, products, inventory, product_analytics

**Purpose:** Organize products into categories, manage category hierarchy  
**Columns Needed:**
- categories: id, name, description, image, parentId (for subcategories)
- products: id, categoryId, name, price
- inventory: productId, quantity
- product_analytics: productId, totalSold, totalRevenue

**Operations:**
- Create, read, update, delete categories
- Organize category hierarchy (parent/child)
- View products in category
- View category sales analytics
- Reorder categories for display

---

### 10. Admin Panel
**Tables Used:** users, customers, products, orders, inventory, audit_logs, payments, categories

**Purpose:** Manage system users, audit logs, global settings, permissions  
**Columns Needed:**
- users: id, name, email, role, status, createdAt, lastLogin
- customers: id, name, email, totalOrders
- products: id, name, categoryId
- orders: id, customerId, totalAmount, status
- inventory: productId, quantity
- audit_logs: id, userId, action, entityType, entityId, changes, createdAt
- payments: id, amount, status

**Operations:**
- Manage user accounts and roles
- View audit logs (who did what, when)
- Configure system settings
- Manage permissions
- View system health/statistics
- Generate admin reports

---

## Detailed Table Schemas

### Table 1: users
**Purpose:** Staff and admin user accounts  
**Related Modules:** All (authentication)

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role CHECK (role IN ('CUSTOMER', 'STAFF', 'ADMIN'))
);

Indexes:
- users_email (email) - for login lookups
- users_role (role) - for permission checks
- users_status (status) - for active user lists
- users_created_at (created_at) - for audit trails
```

**Key Columns:**
- id: User identifier
- email: Unique login email
- role: CUSTOMER, STAFF, or ADMIN
- status: ACTIVE, INACTIVE, SUSPENDED
- last_login: Timestamp for activity tracking

---

### Table 2: customers
**Purpose:** Customer profiles and purchase history tracking  
**Related Modules:** Dashboard, Orders, Customers, POS, Analytics, Admin

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    addresses JSONB,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_order_at TIMESTAMP,
    segment VARCHAR(50) DEFAULT 'NEW',
    loyalty_points INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_segment CHECK (segment IN ('VIP', 'REGULAR', 'NEW', 'INACTIVE'))
);

Indexes:
- customers_email (email) - for lookup
- customers_segment (segment) - for segmentation analysis
- customers_total_spent (total_spent DESC) - for VIP identification
- customers_last_order_at (last_order_at DESC) - for activity analysis
- customers_loyalty_points (loyalty_points DESC) - for rewards tracking
- customers_created_at (created_at DESC) - for new customer tracking
```

**Key Columns:**
- segment: Customer classification (AUTO-CALCULATED)
- total_orders: COUNT of orders (DENORMALIZED)
- total_spent: SUM of order totals (DENORMALIZED)
- loyalty_points: For rewards program
- last_order_at: Used to identify INACTIVE segment

---

### Table 3: categories
**Purpose:** Product categorization and organization  
**Related Modules:** Products, POS, Analytics, Categories

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(500),
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:
- categories_name (name) - for category lookup
- categories_parent_id (parent_id) - for hierarchy queries
```

**Key Columns:**
- name: Category name (unique)
- parent_id: For subcategory hierarchy
- image: Category thumbnail for display

---

### Table 4: products
**Purpose:** Product master data and catalog  
**Related Modules:** Dashboard, Products, Inventory, Orders, POS, Analytics, Categories

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    images JSONB,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:
- products_category_id (category_id) - for category filtering
- products_sku (sku) - for SKU lookup
- products_name (name) - for product search
- products_created_at (created_at DESC) - for new product listings
- products_price (price) - for price sorting
```

**Key Columns:**
- price: Product selling price
- sku: Stock Keeping Unit (unique identifier)
- stock: Current available quantity
- images: JSON array of image URLs

---

### Table 5: inventory
**Purpose:** Stock tracking by warehouse, reorder management  
**Related Modules:** Dashboard, Products, Inventory, Orders, POS, Analytics

```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0 NOT NULL,
    reorder_point INT DEFAULT 10,
    reorder_quantity INT DEFAULT 50,
    warehouse_id INT DEFAULT 1,
    last_counted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

Indexes:
- inventory_product_id (product_id) - for product lookup
- inventory_quantity (quantity ASC) - for low stock alerts
- inventory_reorder_point (quantity, reorder_point) - for reorder logic
- inventory_warehouse_id (warehouse_id) - for warehouse inventory
- inventory_last_counted_at (last_counted_at) - for inventory audit
- inventory_created_at (created_at DESC) - for recent transactions
```

**Key Columns:**
- quantity: Current stock amount (updated with transactions)
- reorder_point: Minimum stock level (e.g., 10 units)
- reorder_quantity: How many to order when below reorder_point (e.g., 50 units)
- warehouse_id: Which warehouse holds this stock
- last_counted_at: For physical cycle counts

---

### Table 6: inventory_transactions
**Purpose:** Audit trail of all inventory movements  
**Related Modules:** Inventory, Dashboard (low stock alerts), Analytics (turnover)

```sql
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_type CHECK (transaction_type IN ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'POS_SALE'))
);

Indexes:
- inv_trans_inventory_id (inventory_id) - for product transactions
- inv_trans_product_id (product_id) - for product history
- inv_trans_type (transaction_type) - for transaction filtering
- inv_trans_created_at (created_at DESC) - for recent transactions
- inv_trans_reference (reference) - for order/PO lookups
```

**Key Columns:**
- transaction_type: PURCHASE, SALE, RETURN, ADJUSTMENT, POS_SALE
- quantity: Positive or negative amount
- reference: Link to order_id, purchase_order_id, etc.
- notes: Reason for adjustment

---

### Table 7: orders
**Purpose:** Customer order records and transaction history  
**Related Modules:** Dashboard, Orders, Customers, POS, Analytics, Reports, Admin

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    payment_id INT REFERENCES payments(id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    channel VARCHAR(50) DEFAULT 'ONLINE',
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_status CHECK (status IN ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
    CONSTRAINT fk_channel CHECK (channel IN ('ONLINE', 'POS'))
);

Indexes:
- orders_customer_id (customer_id) - for customer history
- orders_payment_id (payment_id) - for payment lookup
- orders_status (status) - for order filtering
- orders_channel (channel) - for online vs POS analysis
- orders_created_at (created_at DESC) - for recent orders
- orders_shipped_at (shipped_at) - for shipment tracking
- orders_delivered_at (delivered_at) - for delivery tracking
- orders_total_amount (total_amount DESC) - for high-value orders
```

**Key Columns:**
- status: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
- channel: ONLINE or POS
- tax_amount: Separate from total for accounting
- shipped_at, delivered_at: For order tracking
- total_amount: Sum of all order_items prices

---

### Table 8: order_items
**Purpose:** Line items for each order  
**Related Modules:** Orders, Products, Analytics, Dashboard (order composition)

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, product_id)
);

Indexes:
- order_items_order_id (order_id) - for order details
- order_items_product_id (product_id) - for product sales
```

**Key Columns:**
- price: Selling price at time of order (historical)
- quantity: Units ordered

---

### Table 9: payments
**Purpose:** Payment transaction tracking and reconciliation  
**Related Modules:** Orders, Dashboard, Analytics, Reports, Admin

```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    method VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_method CHECK (method IN ('SSLCOMMERZ', 'CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET')),
    CONSTRAINT fk_payment_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
);

Indexes:
- payments_order_id (order_id) - for order payment lookup
- payments_status (status) - for reconciliation
- payments_method (method) - for payment method analysis
- payments_paid_at (paid_at DESC) - for payment history
- payments_gateway_transaction_id (gateway_transaction_id) - for SSLCommerz reconciliation
- payments_created_at (created_at DESC) - for recent payments
```

**Key Columns:**
- method: SSLCOMMERZ (credit card), CASH, CARD, BKASH, NAGAD, ROCKET
- gateway_transaction_id: SSLCommerz transaction ID for verification
- status: PENDING, COMPLETED, FAILED, REFUNDED
- amount: Payment amount (should match order.total_amount)

---

### Table 10: wishlist
**Purpose:** Customer wish lists for marketing and analytics  
**Related Modules:** Customers, Products, Analytics

```sql
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id)
);

Indexes:
- wishlist_customer_id (customer_id) - for customer wishlists
- wishlist_product_id (product_id) - for product popularity
```

**Key Columns:**
- customer_id, product_id: Links customer to product they want

---

### Table 11: product_analytics (NEW)
**Purpose:** Denormalized analytics metrics for fast dashboard queries  
**Related Modules:** Dashboard, Products, Analytics, Reports

```sql
CREATE TABLE product_analytics (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    total_sold INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_views INT DEFAULT 0,
    wishlist_count INT DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    return_count INT DEFAULT 0,
    return_rate DECIMAL(5,2) DEFAULT 0,
    last_sold_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:
- product_analytics_product_id (product_id UNIQUE) - for product lookup
- product_analytics_total_sold (total_sold DESC) - for best sellers
- product_analytics_total_revenue (total_revenue DESC) - for top revenue
- product_analytics_wishlist_count (wishlist_count DESC) - for popular items
- product_analytics_avg_rating (avg_rating DESC) - for highly rated
- product_analytics_last_sold_at (last_sold_at DESC) - for recently sold
```

**Key Columns:**
- All counters are DENORMALIZED (copied from transactions) for fast queries
- Purpose: 100x faster dashboard queries instead of aggregating millions of rows
- Updated by: Seed script (initial population) + trigger on order_items/wishlist insert

**Performance Impact:** 500ms aggregate query → 5ms denormalized query

---

### Table 12: stock_transfers (NEW)
**Purpose:** Track product movements between warehouses  
**Related Modules:** Inventory, Dashboard (stock availability)

```sql
CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    inventory_id INT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    from_warehouse INT NOT NULL,
    to_warehouse INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(50) DEFAULT 'PENDING',
    initiated_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    notes TEXT,
    CONSTRAINT fk_transfer_status CHECK (status IN ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'))
);

Indexes:
- stock_transfers_product_id (product_id) - for product transfers
- stock_transfers_inventory_id (inventory_id) - for inventory updates
- stock_transfers_status (status) - for transfer filtering
- stock_transfers_from_warehouse (from_warehouse) - for warehouse analysis
- stock_transfers_to_warehouse (to_warehouse) - for warehouse analysis
- stock_transfers_initiated_at (initiated_at DESC) - for recent transfers
```

**Key Columns:**
- status: PENDING → IN_TRANSIT → RECEIVED (or CANCELLED)
- initiated_by: User who created the transfer
- received_at: When goods physically arrived

---

### Table 13: audit_logs
**Purpose:** Compliance and audit trail of all admin actions  
**Related Modules:** Admin, Reports, Compliance

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Indexes:
- audit_logs_user_id (user_id) - for user activity
- audit_logs_entity_type (entity_type) - for entity filtering
- audit_logs_entity_id (entity_type, entity_id) - for specific entity history
- audit_logs_action (action) - for action filtering
- audit_logs_created_at (created_at DESC) - for recent changes
```

**Key Columns:**
- action: CREATE, READ, UPDATE, DELETE, EXPORT
- entity_type: 'USER', 'CUSTOMER', 'PRODUCT', 'ORDER', etc.
- entity_id: ID of the entity affected
- changes: JSON of before/after values for update actions

---

## Table Relationships

### Entity Relationship Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────┐
│                        MOUCHAK COSMETICS                      │
│                    DATABASE RELATIONSHIPS                      │
└─────────────────────────────────────────────────────────────┘

                          ┌──────────┐
                          │  users   │
                          │  id (PK) │
                          └────┬─────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
           (staff)      (admin)         (cashier)
                │              │              │
        ┌───────┴─┐    ┌──────┴──────┐ ┌────────────────┐
        │          │    │             │ │                │
    ┌───────┐  ┌────────────┐  ┌──────────────┐  ┌────────┐
    │orders │  │audit_logs  │  │stock_transfers   │customers│
    │       │  │ user_id→  │  │initiated_by→   │          │
    └───┬───┘  └────────────┘  └──────────────┘  └────────┘
        │
   ┌────┴────┬─────────────────┬──────────┐
   │          │                 │          │
┌──────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐
│orders│  │order_items  │payments│  │shipment│
│      │  │ product_id→ │        │  │tracking│
└──────┘  └──────┬──────┘  └─────────┘  └─────────┘
                 │
          ┌──────┴──────────┐
          │                 │
      ┌──────────┐  ┌────────────┐
      │products  │  │categories  │
      │ cat_id→  │  │  id (PK)   │
      └────┬─────┘  └────────────┘
           │
      ┌────┴─────┬────────────┐
      │           │            │
  ┌─────────┐ ┌──────────┐ ┌──────────────┐
  │inventory│ │wishlist  │ │product_    │
  │         │ │          │ │analytics   │
  └────┬────┘ └──────────┘ └──────────────┘
       │
   ┌───┴────────────────────┐
   │                        │
┌────────────────┐  ┌──────────────┐
│inventory_      │  │stock_        │
│transactions    │  │transfers     │
└────────────────┘  └──────────────┘
```

### One-to-Many Relationships
1. **users → orders** (1 staff:many orders processed)
2. **users → audit_logs** (1 staff:many actions)
3. **users → stock_transfers** (1 staff:many transfers initiated)
4. **categories → products** (1 category:many products)
5. **products → order_items** (1 product:many sales)
6. **products → inventory** (1 product:1 inventory per warehouse)
7. **products → wishlist** (1 product:many wishlist entries)
8. **products → product_analytics** (1 product:1 analytics record)
9. **products → stock_transfers** (1 product:many transfers)
10. **customers → orders** (1 customer:many orders)
11. **customers → wishlist** (1 customer:many wishlist entries)
12. **orders → order_items** (1 order:many items)
13. **orders → payments** (1 order:1 payment)
14. **inventory → inventory_transactions** (1 inventory:many transactions)
15. **inventory → stock_transfers** (1 inventory:many transfers)

### Many-to-Many Relationships (via junction tables)
1. **customers ↔ products** via `wishlist` table

### Foreign Key Constraints
All foreign keys use:
- **ON DELETE CASCADE** for dependent data (should delete when parent deletes)
  - order_items → orders (delete items when order deleted)
  - inventory_transactions → inventory (delete transactions when inventory deleted)
  
- **ON DELETE RESTRICT** for critical data (prevent deletion if referenced)
  - orders → customers (prevent customer deletion if they have orders)
  - products → categories (prevent category deletion if products exist)

---

## SQL Create Statements

Complete SQL to create all 13 dashboard tables:

```sql
-- ===== ENUMS =====
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'STAFF', 'ADMIN');
CREATE TYPE order_status AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('SSLCOMMERZ', 'CASH', 'CARD', 'BKASH', 'NAGAD', 'ROCKET');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE inventory_transaction_type AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'POS_SALE');
CREATE TYPE customer_segment AS ENUM ('VIP', 'REGULAR', 'NEW', 'INACTIVE');
CREATE TYPE stock_transfer_status AS ENUM ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- ===== TABLE: users =====
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'CUSTOMER',
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ===== TABLE: customers =====
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    addresses JSONB,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_order_at TIMESTAMP,
    segment customer_segment DEFAULT 'NEW',
    loyalty_points INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_customers_total_spent ON customers(total_spent DESC);
CREATE INDEX idx_customers_last_order_at ON customers(last_order_at DESC);
CREATE INDEX idx_customers_loyalty_points ON customers(loyalty_points DESC);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- ===== TABLE: categories =====
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image VARCHAR(500),
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ===== TABLE: products =====
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sku VARCHAR(100) UNIQUE NOT NULL,
    images JSONB,
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);

-- ===== TABLE: inventory =====
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0 NOT NULL,
    reorder_point INT DEFAULT 10,
    reorder_quantity INT DEFAULT 50,
    warehouse_id INT DEFAULT 1,
    last_counted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, warehouse_id)
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity ASC);
CREATE INDEX idx_inventory_reorder ON inventory(quantity, reorder_point);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX idx_inventory_last_counted_at ON inventory(last_counted_at);
CREATE INDEX idx_inventory_created_at ON inventory(created_at DESC);

-- ===== TABLE: inventory_transactions =====
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type inventory_transaction_type NOT NULL,
    quantity INT NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_trans_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX idx_inv_trans_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_trans_created_at ON inventory_transactions(created_at DESC);
CREATE INDEX idx_inv_trans_reference ON inventory_transactions(reference);

-- ===== TABLE: orders =====
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    payment_id INT REFERENCES payments(id) ON DELETE SET NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    status order_status DEFAULT 'PENDING',
    channel VARCHAR(50) DEFAULT 'ONLINE',
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: payment_id reference will be added after payments table created

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_channel ON orders(channel);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX idx_orders_delivered_at ON orders(delivered_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount DESC);

-- ===== TABLE: order_items =====
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, product_id)
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ===== TABLE: payments =====
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    status payment_status DEFAULT 'PENDING',
    method payment_method NOT NULL,
    gateway_transaction_id VARCHAR(255),
    notes TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(method);
CREATE INDEX idx_payments_paid_at ON payments(paid_at DESC);
CREATE INDEX idx_payments_gateway_tx_id ON payments(gateway_transaction_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Add payment_id FK to orders
ALTER TABLE orders ADD FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- ===== TABLE: wishlist =====
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_wishlist_customer_id ON wishlist(customer_id);
CREATE INDEX idx_wishlist_product_id ON wishlist(product_id);

-- ===== TABLE: product_analytics (NEW) =====
CREATE TABLE product_analytics (
    id SERIAL PRIMARY KEY,
    product_id INT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    total_sold INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_views INT DEFAULT 0,
    wishlist_count INT DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    return_count INT DEFAULT 0,
    return_rate DECIMAL(5,2) DEFAULT 0,
    last_sold_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX idx_product_analytics_total_sold ON product_analytics(total_sold DESC);
CREATE INDEX idx_product_analytics_total_revenue ON product_analytics(total_revenue DESC);
CREATE INDEX idx_product_analytics_wishlist ON product_analytics(wishlist_count DESC);
CREATE INDEX idx_product_analytics_rating ON product_analytics(avg_rating DESC);
CREATE INDEX idx_product_analytics_last_sold ON product_analytics(last_sold_at DESC);

-- ===== TABLE: stock_transfers (NEW) =====
CREATE TABLE stock_transfers (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    inventory_id INT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    from_warehouse INT NOT NULL,
    to_warehouse INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    status stock_transfer_status DEFAULT 'PENDING',
    initiated_by INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_stock_transfers_product_id ON stock_transfers(product_id);
CREATE INDEX idx_stock_transfers_inventory_id ON stock_transfers(inventory_id);
CREATE INDEX idx_stock_transfers_status ON stock_transfers(status);
CREATE INDEX idx_stock_transfers_from_wh ON stock_transfers(from_warehouse);
CREATE INDEX idx_stock_transfers_to_wh ON stock_transfers(to_warehouse);
CREATE INDEX idx_stock_transfers_initiated_at ON stock_transfers(initiated_at DESC);

-- ===== TABLE: audit_logs =====
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## Common Dashboard Queries

### Performance Query Examples

**1. Dashboard Overview - Total Sales Today**
```sql
SELECT 
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_sales,
    COUNT(DISTINCT o.customer_id) as unique_customers,
    COALESCE(AVG(o.total_amount), 0) as avg_order_value
FROM orders o
WHERE DATE(o.created_at) = CURRENT_DATE
    AND o.status != 'CANCELLED';

-- Expected: < 5ms (with created_at index)
```

**2. Low Stock Alert**
```sql
SELECT 
    p.id,
    p.name,
    i.quantity,
    i.reorder_point,
    i.reorder_quantity
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.quantity < i.reorder_point
    AND i.warehouse_id = 1
ORDER BY i.quantity ASC;

-- Expected: < 5ms (with reorder_point composite index)
```

**3. Top 10 Selling Products**
```sql
SELECT 
    p.id,
    p.name,
    pa.total_sold,
    pa.total_revenue,
    pa.avg_rating,
    pa.wishlist_count
FROM product_analytics pa
JOIN products p ON pa.product_id = p.id
ORDER BY pa.total_sold DESC
LIMIT 10;

-- Expected: < 2ms (with denormalized analytics table)
```

**4. VIP Customers by Spending**
```sql
SELECT 
    c.id,
    c.name,
    c.email,
    c.total_spent,
    c.total_orders,
    c.last_order_at
FROM customers c
WHERE c.segment = 'VIP'
ORDER BY c.total_spent DESC;

-- Expected: < 5ms (with segment index)
```

**5. Orders by Status**
```sql
SELECT 
    status,
    COUNT(*) as count,
    COALESCE(SUM(total_amount), 0) as total_amount
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY status;

-- Expected: < 10ms (with status and created_at indexes)
```

**6. Customer Segments Distribution**
```sql
SELECT 
    segment,
    COUNT(*) as customer_count,
    COALESCE(SUM(total_spent), 0) as total_revenue,
    COALESCE(AVG(total_orders), 0) as avg_orders_per_customer
FROM customers
GROUP BY segment;

-- Expected: < 5ms (with segment index)
```

**7. Inventory Status by Warehouse**
```sql
SELECT 
    i.warehouse_id,
    COUNT(DISTINCT i.product_id) as total_products,
    COALESCE(SUM(i.quantity), 0) as total_quantity,
    COUNT(CASE WHEN i.quantity < i.reorder_point THEN 1 END) as low_stock_count
FROM inventory i
GROUP BY i.warehouse_id;

-- Expected: < 10ms (with warehouse_id index)
```

**8. Recent Orders with Customer Info**
```sql
SELECT 
    o.id,
    o.created_at,
    c.name as customer_name,
    o.total_amount,
    o.status,
    COUNT(oi.id) as item_count
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY o.id, c.name
ORDER BY o.created_at DESC;

-- Expected: < 15ms (with created_at and customer_id indexes)
```

---

## Data Integrity Rules

### Constraints
1. **prices must be positive:** `DECIMAL(12,2) >= 0`
2. **quantities must be positive:** `INT > 0`
3. **unique emails:** No duplicate customer or user emails
4. **order total must match items sum:** `SUM(order_items.price * quantity) = orders.total_amount`
5. **payment amount must match order:** `payments.amount = orders.total_amount`
6. **stock must be non-negative:** `inventory.quantity >= 0`
7. **no self-referential stock transfers:** `from_warehouse != to_warehouse`

### Denormalization Rules
Whenever these transactions occur, update denormalized fields:
1. **New order created** → Update `customers.total_orders`, `customers.total_spent`, `customers.last_order_at`, `customers.segment`
2. **Item sold** → Update `product_analytics.total_sold`, `product_analytics.total_revenue`, `product_analytics.last_sold_at`
3. **Item added to wishlist** → Update `product_analytics.wishlist_count`
4. **Payment completed** → Update `orders.payment_id`, `payments.status`

---

## Dashboard Module → Table Cross-Reference

| Dashboard Module | Primary Tables | Secondary Tables | Analytics Tables |
|---|---|---|---|
| **Dashboard Overview** | orders, customers, products | inventory, payments | product_analytics |
| **Products Mgmt** | products, categories | inventory | product_analytics, wishlist |
| **Inventory Mgmt** | inventory, inventory_transactions | products, stock_transfers | - |
| **Orders Mgmt** | orders, order_items | customers, products, payments | - |
| **Customers** | customers | orders, wishlist, payments | - |
| **POS** | orders, order_items | products, inventory, customers, payments | - |
| **Analytics & Reports** | product_analytics, orders | order_items, customers | inventory_transactions |
| **Categories** | categories, products | inventory | product_analytics |
| **Admin** | users, audit_logs | all tables | - |
| **Reports** | All tables | - | All tables |

---

## Summary Statistics

**Total Tables:** 13  
**Total Indexes:** 45+  
**Total Constraints:** 50+  
**Foreign Keys:** 20+  
**Enums:** 7 types  
**Performance Target:** All queries < 50ms  
**Dashboard Load Time:** < 3 seconds (with proper caching)

---

## Next Steps

1. **Execute Migration:** Run `npx prisma migrate deploy` to create all tables
2. **Run Seed Script:** Execute `npx tsx prisma/seed-dashboard.ts` to populate analytics
3. **Verify Tables:** Run verification queries from "Common Dashboard Queries" section
4. **Monitor Performance:** Check query execution times match "Expected" values
5. **Implement Triggers:** Create database triggers to keep denormalized fields in sync

---

**Document Version:** 1.0  
**Last Updated:** April 7, 2026  
**Database:** PostgreSQL 12+  
**ORM:** Prisma
