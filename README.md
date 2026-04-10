<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/ShadCN_UI-latest-000?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Keycloak-SSO-4D4D4D?style=for-the-badge&logo=keycloak&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/SSLCommerz-Payment-FF6B00?style=for-the-badge" />
</p>

# 🧴 Mouchak Cosmetics

> A full-stack **E-commerce + Inventory Management + Analytics Dashboard** platform built for a real-world cosmetics business. Handles storefront operations, staff workflows, POS billing, and business intelligence — all from a single unified system.

---

## 📌 Why This Project?

Most e-commerce solutions treat inventory and analytics as afterthoughts. **Mouchak Cosmetics** was built from day one as a **unified platform** where:

- **Customers** browse products, manage orders, and checkout seamlessly
- **Staff** manage inventory, process POS orders, and track customers
- **Admins** view revenue analytics, generate reports, and manage users

This is **not a tutorial clone** — it's a production-grade system solving real business problems for a cosmetics brand in Bangladesh.

---

## 🏗️ System Architecture

```
mouchak-cosmetics/
├── client/          → Next.js 16 frontend (App Router + TypeScript)
└── ...              → Backend services (coming soon)
```

### Frontend Architecture — Feature-Sliced Design (FSD)

The `client/` follows **Feature-Sliced Design**, a proven architecture for scalable, maintainable frontends:

```
client/src/
│
├── app/                         # Next.js App Router
│   ├── (public)/                # 🌐 Storefront — Home, Shop, Product [slug]
│   ├── (auth)/                  # 🔑 Authentication — Login via Keycloak SSO
│   ├── (customer-dashboard)/    # 👤 Customer — Orders, Profile, Checkout, Wishlist
│   ├── (staff-dashboard)/       # 📊 Staff & Admin — Dashboard, POS, Inventory, Analytics
│   └── api/                     # 🔌 API Routes — Payment IPN webhook
│
├── features/                    # Feature modules (self-contained business logic)
│   ├── products/                #   Product CRUD, catalog display
│   ├── inventory/               #   Stock tracking, adjustments
│   ├── orders/                  #   Order management, POS transactions
│   ├── analytics/               #   Revenue charts, top products
│   ├── customers/               #   Customer management
│   └── cart/                    #   Shopping cart, checkout flow
│
├── entities/                    # Domain models (Product, Order, Customer, etc.)
│
└── shared/                      # Cross-cutting concerns
    ├── lib/                     #   Keycloak, Prisma, Axios, SSLCommerz, QueryClient
    ├── providers/               #   React Query provider
    ├── components/              #   RoleGuard, shared UI
    └── hooks/                   #   useSession, custom hooks
```

Each **feature module** is self-contained:

```
features/<module>/
├── components/     → UI components scoped to this feature
├── queries/        → React Query hooks (read operations)
├── mutations/      → React Query hooks (write operations)
├── actions/        → Next.js Server Actions ("use server")
├── types/          → TypeScript type definitions
└── index.ts        → Public barrel export
```

---

## ⚡ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 (App Router) | Server components, file-based routing, server actions |
| **Language** | TypeScript 5 | End-to-end type safety |
| **Styling** | Tailwind CSS 4 + ShadCN UI | Utility-first styling + accessible, composable components |
| **Auth** | Keycloak | Enterprise SSO with role-based access control (RBAC) |
| **Data Fetching** | TanStack Query (React Query) | Caching, background sync, optimistic updates |
| **Server Mutations** | Next.js Server Actions | Secure server-side mutations without API boilerplate |
| **ORM** | Prisma | Type-safe database queries with migrations |
| **Payments** | SSLCommerz | Bangladesh payment gateway with IPN webhook |
| **Architecture** | Feature-Sliced Design | Scalable, modular frontend with clear boundaries |

---

## 🎯 Key Features

### 🛒 Customer Storefront
- Product catalog with dynamic `[slug]` pages
- Shopping cart with slide-out drawer
- Secure checkout via SSLCommerz payment gateway
- Order tracking & history
- Wishlist & profile management

### 📊 Staff Dashboard
| Module | Capability |
|--------|-----------|
| **Dashboard** | Business KPIs and overview |
| **POS Terminal** | In-store billing for walk-in customers |
| **Orders** | Process orders, update fulfillment status |
| **Products** | Full CRUD for product catalog |
| **Inventory** | Stock levels, adjustments, low-stock alerts |
| **Customers** | Profiles, purchase history |
| **Analytics** | Revenue charts, top-selling products, trends |
| **Reports** | Exportable business reports |

### 🔐 Admin Panel
- User management with role assignment
- System settings & configuration
- Route-level RBAC via `RoleGuard` component

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** database
- **Keycloak** instance for authentication

### Quick Start

```bash
# Clone the repo
git clone https://github.com/<your-username>/mouchak-cosmetics.git
cd mouchak-cosmetics

# Frontend setup
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create `client/.env.local`:

```env
# Keycloak Auth
NEXT_PUBLIC_KEYCLOAK_URL=<your-keycloak-url>
NEXT_PUBLIC_KEYCLOAK_REALM=<realm-name>
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=<client-id>

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mouchak

# SSLCommerz Payment
SSLCOMMERZ_STORE_ID=<store-id>
SSLCOMMERZ_STORE_PASSWORD=<store-password>
SSLCOMMERZ_IS_SANDBOX=true
```

---

## 🛠️ Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Feature-Sliced Design** | Each feature is an isolated module — easy to test, refactor, or remove without side effects |
| **Server Actions over API Routes** | Eliminates boilerplate; mutations run on the server with full type safety |
| **React Query** | Built-in caching and background refetching; no manual state management for async data |
| **Route Groups** | `(public)`, `(customer-dashboard)`, `(staff-dashboard)` enable layout-level auth guards without URL nesting |
| **Keycloak SSO** | Enterprise-grade auth with multi-role support; avoids building auth from scratch |
| **Barrel Exports** | Each feature's `index.ts` defines its public API — internal implementation stays encapsulated |

---

## 📁 Project Stats

| Directory | Files | Description |
|-----------|-------|-------------|
| `app/` | 27 | Pages, layouts, API routes across 4 route groups |
| `features/` | 54 | 6 feature modules with full CQRS-style separation |
| `entities/` | 5 | Domain type definitions |
| `shared/` | 8 | Cross-cutting lib, providers, components, hooks |
| **Total** | **95** | Production-ready skeleton |

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ for <strong>Mouchak Cosmetics</strong>
</p>
