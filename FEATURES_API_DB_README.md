# Features → APIs → DB Tables (Postgres + Prisma)

This document is a **single mapping reference** for what the client UI needs:

- **Homepage features**
- **Staff dashboard features**
- The **APIs** required to support them (REST under `/api`)
- The **Postgres tables** required (as represented in `server/prisma/schema.prisma`)

---

## Homepage (client) features

Source: `client/src/app/page.tsx`, `client/src/components/homepage/*`

- **Header/navigation**
  - Category navigation (Skincare/Makeup/Haircare/Perfume)
  - Search box (UI)
  - Wishlist icon + count (UI)
  - Cart icon + count (UI)
  - Sign in CTA (UI)
  - Links: Track Order, Store Locator (UI)
- **Hero**
  - Promo badges + CTA buttons (UI)
- **Featured products**
  - Featured products grid (currently mock)
  - “View all” link (UI)
  - Range category quick links (UI)
- **Newsletter subscribe** (UI)
- **Footer** (static)

---

## Staff dashboard (client) features

Source: `client/src/app/(staff-dashboard)/dashboard/*`

The dashboard main module is built with **mock data** today, but its UI implies these backend capabilities:

- **Overview**
  - KPIs (revenue/orders/products/customers)
  - Revenue trend, category mix
  - Recent orders
  - Stock alerts
  - Quick action: “+ New Sale”
- **E-commerce view**
  - Orders list/table, new order
  - Products list/table, add/edit product
  - Customer KPIs
- **Inventory**
  - Branch-wise stock view
  - Stock add/edit adjustment
  - Manual sales log
- **Analytics**
  - Revenue and sales charts
  - Top products by revenue (export)
- **Branches**
  - Branch list + activate/deactivate + add branch
- **Settings**
  - Store identity settings
  - Payment settings (SSLCommerz + accepted methods)
  - Shipping settings
  - Inventory thresholds and barcode toggle
  - Notification toggles
  - Staff management
  - Homepage trending selection
  - Promotions/discounts
  - Category management
  - Add product form

---

## API list to implement (summary)

### Already implemented (server)

- **Products**
  - `GET /api/products`
  - `GET /api/products/:slug`

### Needed for homepage wiring

- **Categories**
  - `GET /api/categories`
- **Wishlist**
  - `GET /api/wishlist`
  - `POST /api/wishlist`
  - `DELETE /api/wishlist/:productId`
- **Cart / checkout** (client has cart feature code; pages are currently stubbed)
  - `GET /api/cart`
  - `POST /api/cart/items`
  - `PATCH /api/cart/items/:id`
  - `DELETE /api/cart/items/:id`
  - `POST /api/checkout/init`
- **Newsletter**
  - `POST /api/newsletter/subscribe`

### Needed for staff dashboard (per project docs)

See `API_REQUIREMENTS.md` for the full list (47 endpoints), grouped as:

- Products, Inventory, Orders, Customers, POS, Analytics, Reports, Categories, Admin

---

## Database tables (Prisma models)

### Present in `server/prisma/schema.prisma`

- **Commerce**
  - `users`, `customers`, `categories`, `products`
  - `inventory`, `inventory_transactions`
  - `orders`, `order_items`
  - `payments`
  - `wishlist`
- **Operational analytics**
  - `product_analytics`
  - `stock_transfers`
  - `audit_logs`
- **Returns & refunds**
  - `returns`, `refunds`
- **Branches / multi-location**
  - `branches`
- **RBAC**
  - `roles`, `permissions`, `role_permissions`
  - `user_roles`, `user_branches`, `role_assignments`
- **SKU system**
  - `sku_settings`, `sku_history`

### Likely missing tables for currently-visible UI concepts

These are implied by the client UI/features, but do not exist as models yet:

- **Cart**: `carts`, `cart_items` (or an “order draft” model)
- **Store settings**: `store_settings` (tax rate, shipping rules, notification toggles, accepted payments)
- **Promotions/discounts**: `promotions` (+ optional rules/redemptions tables)
- **Newsletter**: `newsletter_subscriptions`

---

## Migration + seed (backend)

From `server/`:

- Migrations: `npm run db:migrate`
- Seed (catalog + inventory): `npm run db:seed`
- Optional seeds:
  - Dashboard metrics seed: `npm run db:seed:dashboard`
  - RBAC seed: `npm run db:seed:rbac`

