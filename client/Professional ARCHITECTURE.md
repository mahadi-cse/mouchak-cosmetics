# Mouchak Cosmetics — Client Architecture Guide

> **Next.js 16 · React 19 · TypeScript · TanStack Query · Tailwind CSS 4**

This document is the single source of truth for the client application's module-based architecture. Read before adding any file.

---

## Table of Contents

- [Three-Layer Architecture](#three-layer-architecture)
- [Directory Structure](#directory-structure)
- [Layer Rules](#layer-rules)
- [Module Internal Structure](#module-internal-structure)
- [Import Rules](#import-rules)
- [What to Delete & Why](#what-to-delete--why)
- [Migration Steps](#migration-steps)
- [Adding a New Module](#adding-a-new-module)
- [Quick Reference](#quick-reference)

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│           app/  (routing shell)         │
│   pages import from modules, no logic   │
├─────────────────────────────────────────┤
│         modules/  (business layer)      │
│  one folder per domain, self-contained  │
├─────────────────────────────────────────┤
│        shared/  (generic utilities)     │
│    types, utils, components, lib        │
└─────────────────────────────────────────┘
```

| Layer | Responsibility | Can import from |
|---|---|---|
| `app/` | Route definitions, layouts | `modules/`, `shared/` |
| `modules/` | All business domain logic | `shared/` only |
| `shared/` | Generic cross-cutting concerns | nothing in `src/` |

---

## Directory Structure

```
src/
├── app/                              # Next.js App Router — routes only
│   ├── layout.tsx                    # Root layout + providers
│   ├── page.tsx                      # Home → renders modules/homepage
│   ├── globals.css
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (public)/
│   │   ├── layout.tsx
│   │   ├── shop/
│   │   │   └── page.tsx
│   │   └── product/[slug]/
│   │       └── page.tsx
│   ├── (customer-dashboard)/
│   │   ├── layout.tsx
│   │   ├── checkout/
│   │   │   └── page.tsx
│   │   ├── my-orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── wishlist/
│   │       └── page.tsx
│   ├── (staff-dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── inventory/
│   │       └── page.tsx
│   └── api/
│       └── payment/
│           └── ipn/
│               └── route.ts
│
├── modules/                          # ALL business domain modules
│   ├── products/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductDetail.tsx
│   │   └── index.ts
│   ├── orders/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── components/
│   │   │   ├── OrderCard.tsx
│   │   │   └── OrderTimeline.tsx
│   │   └── index.ts
│   ├── cart/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── components/
│   │   │   ├── CartDrawer.tsx
│   │   │   └── CartItem.tsx
│   │   └── index.ts
│   ├── customers/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── components/
│   │   │   ├── CustomerProfile.tsx
│   │   │   └── AddressBook.tsx
│   │   └── index.ts
│   ├── categories/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── components/
│   │   │   └── CategoryGrid.tsx
│   │   └── index.ts
│   ├── inventory/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   ├── components/
│   │   │   ├── InventoryTable.tsx
│   │   │   └── LowStockAlert.tsx
│   │   └── index.ts
│   ├── analytics/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── components/
│   │   │   ├── RevenueChart.tsx
│   │   │   └── SalesSummary.tsx
│   │   └── index.ts
│   ├── auth/
│   │   ├── api.ts
│   │   ├── queries.ts
│   │   ├── components/
│   │   │   └── LoginForm.tsx
│   │   └── index.ts
│   ├── homepage/
│   │   ├── components/
│   │   │   ├── Hero.tsx
│   │   │   ├── FeaturedProducts.tsx
│   │   │   ├── OfferBanner.tsx
│   │   │   └── Testimonials.tsx
│   │   └── index.ts
│   └── dashboard/
│       ├── components/
│       │   ├── StatCard.tsx
│       │   ├── RecentOrders.tsx
│       │   └── DashboardLayout.tsx
│       └── index.ts
│
├── shared/                           # Generic, domain-agnostic
│   ├── lib/
│   │   └── apiClient.ts
│   ├── types/
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── customer.ts
│   │   ├── payment.ts
│   │   ├── inventory.ts
│   │   ├── common.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts
│   │   ├── patterns.ts
│   │   ├── enums.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── string.ts
│   │   ├── storage.ts
│   │   ├── helpers.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   ├── Skeletons.tsx
│   │   ├── LoadingStates.tsx
│   │   └── index.ts
│   └── providers/
│       ├── QueryProvider.tsx
│       └── index.ts
│
└── test/
    ├── test-utils.tsx
    └── utils.test.ts
```

---

## Layer Rules

### `app/` — Routing Shell Only

Pages are thin. They import from `modules/` and render. Zero business logic lives inside a page file.

```tsx
// ✅ app/(public)/shop/page.tsx
import { ProductGrid } from '@/modules/products'

export default function ShopPage() {
  return <ProductGrid />
}

// ❌ Never — business logic inside a page
export default function ShopPage() {
  const [products, setProducts] = useState([])
  useEffect(() => { fetch('/api/products').then(...) }, [])
  return <div>{products.map(...)}</div>
}
```

Layouts handle auth guards and shared chrome (Navbar, Sidebar). They also live in `app/` and import from `modules/`.

```tsx
// app/(customer-dashboard)/layout.tsx
import { DashboardLayout } from '@/modules/dashboard'
import { getSession }      from '@/modules/auth'
import { redirect }        from 'next/navigation'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  return <DashboardLayout>{children}</DashboardLayout>
}
```

---

### `modules/` — Business Domain Layer

Every domain lives here as a self-contained module. A module owns its API calls, React Query hooks, mutations, and UI components. Nothing leaks out except through `index.ts`.

```ts
// ✅ Consuming a module — only the barrel
import { ProductGrid, useProducts } from '@/modules/products'

// ❌ Reaching into module internals — forbidden
import { productAPI }  from '@/modules/products/api'
import { PRODUCT_KEYS } from '@/modules/products/queries'
```

Modules must not import from each other. If two modules share a concern, it belongs in `shared/`.

```ts
// ❌ Cross-module import — forbidden
// inside modules/orders/api.ts
import { useProducts } from '@/modules/products'
```

---

### `shared/` — Generic Utilities

`shared/` has zero domain knowledge. The test: if deleting a module requires changing a file in `shared/`, something is wrong.

```ts
// ✅ shared/utils/formatters.ts — generic, no domain knowledge
export const formatPrice = (amount: number) => `৳${amount.toLocaleString('en-BD')}`

// ❌ This is domain logic — belongs in modules/orders, not shared/
export const calculateOrderTotal = (items: OrderItem[]) => ...
```

---

## Module Internal Structure

Every module follows this exact layout:

```
modules/<domain>/
├── api.ts          # Raw HTTP calls only — no React, no hooks
├── queries.ts      # useQuery hooks + hierarchical query keys
├── mutations.ts    # useMutation hooks with cache invalidation
├── components/     # UI components scoped to this domain
│   └── *.tsx
└── index.ts        # Public barrel — the ONLY import surface
```

Modules with no server interaction (`homepage/`, `dashboard/`) omit `api.ts`, `queries.ts`, `mutations.ts`.

### api.ts

```ts
// modules/products/api.ts
import apiClient from '@/shared/lib/apiClient'
import type { Product, ListProductsParams } from '@/shared/types'

export const productAPI = {
  list: (params?: ListProductsParams) =>
    apiClient.get<Product[]>('/products', { params }),

  getBySlug: (slug: string) =>
    apiClient.get<Product>(`/products/${slug}`),

  getFeatured: (limit = 8) =>
    apiClient.get<Product[]>('/products', { params: { featured: true, limit } }),

  create: (data: Partial<Product>) =>
    apiClient.post<Product>('/products', data),

  update: (id: number, data: Partial<Product>) =>
    apiClient.put<Product>(`/products/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/products/${id}`),
}
```

### queries.ts

```ts
// modules/products/queries.ts
import { useQuery } from '@tanstack/react-query'
import { productAPI } from './api'
import type { ListProductsParams } from '@/shared/types'

export const PRODUCT_KEYS = {
  all:      ['products']                                        as const,
  lists:    ()           => ['products', 'list']               as const,
  list:     (p: ListProductsParams) => ['products', 'list', p] as const,
  details:  ()           => ['products', 'detail']             as const,
  detail:   (slug: string) => ['products', 'detail', slug]     as const,
  featured: ()           => ['products', 'featured']           as const,
}

export const useProducts = (params?: ListProductsParams) =>
  useQuery({
    queryKey: PRODUCT_KEYS.list(params ?? {}),
    queryFn:  () => productAPI.list(params),
    staleTime: 5 * 60 * 1000,
  })

export const useProductBySlug = (slug: string) =>
  useQuery({
    queryKey: PRODUCT_KEYS.detail(slug),
    queryFn:  () => productAPI.getBySlug(slug),
    enabled:  !!slug,
    staleTime: 10 * 60 * 1000,
  })

export const useFeaturedProducts = (limit = 8) =>
  useQuery({
    queryKey: PRODUCT_KEYS.featured(),
    queryFn:  () => productAPI.getFeatured(limit),
    staleTime: 10 * 60 * 1000,
  })
```

### mutations.ts

```ts
// modules/products/mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI } from './api'
import { PRODUCT_KEYS } from './queries'
import type { Product } from '@/shared/types'

export const useCreateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productAPI.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() }),
  })
}

export const useUpdateProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      productAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  })
}

export const useDeleteProduct = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productAPI.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() }),
  })
}
```

### index.ts

```ts
// modules/products/index.ts
// Export only what pages and layouts need.
// api.ts internals and query keys stay private.

export { useProducts, useProductBySlug, useFeaturedProducts } from './queries'
export { useCreateProduct, useUpdateProduct, useDeleteProduct } from './mutations'
export { ProductCard }   from './components/ProductCard'
export { ProductGrid }   from './components/ProductGrid'
export { ProductDetail } from './components/ProductDetail'
```

---

## Import Rules

```
app/        →  modules/,  shared/
modules/*   →  shared/   only
shared/     →  nothing inside src/
```

```ts
// ✅ In a page
import { ProductGrid }   from '@/modules/products'
import { ErrorBoundary } from '@/shared/components'
import type { Product }  from '@/shared/types'

// ✅ Inside a module
import apiClient         from '@/shared/lib/apiClient'
import { formatPrice }   from '@/shared/utils'
import type { Product }  from '@/shared/types'

// ❌ Module importing another module
import { useCart } from '@/modules/cart'        // inside modules/products — forbidden

// ❌ shared/ importing a module
import { productAPI } from '@/modules/products' // inside shared/ — forbidden

// ❌ Bypassing the barrel
import { productAPI } from '@/modules/products/api' // always use index.ts
```

---

## What to Delete & Why

### `features/` → merge into `modules/`, then delete

`features/` duplicates what `modules/` owns. Merge each file, then remove the directory.

```
features/products/   → modules/products/
features/customers/  → modules/customers/
features/orders/     → modules/orders/
features/cart/       → modules/cart/
features/categories/ → modules/categories/
features/inventory/  → modules/inventory/
features/analytics/  → modules/analytics/
features/homepage/   → modules/homepage/
```

### `entities/` → update all imports, then delete

`entities/` only re-exports from `shared/types/`. It exists for backward compatibility and doubles the type surface area.

```ts
// ❌ Before
import { Product } from '@/entities/product'
import type { Order } from '@/entities/types'

// ✅ After
import type { Product, Order } from '@/shared/types'
```

### `components/` (root) → redistribute, then delete

- Generic UI → `shared/components/`
- Domain-specific UI → `modules/<domain>/components/`

---

## Migration Steps

- [ ] Merge everything from `features/<domain>/` into `modules/<domain>/`
- [ ] Delete `features/` directory
- [ ] Replace all `@/entities/*` imports with `@/shared/types`
- [ ] Delete `entities/` directory
- [ ] Move root `components/` files into `shared/components/` or `modules/<domain>/components/`
- [ ] Delete root `components/` directory
- [ ] Update `tsconfig.json` path aliases if any pointed to deleted directories
- [ ] Run `npm run typecheck` — fix broken imports
- [ ] Run `npm run lint` — fix path violations

---

## Adding a New Module

```bash
# 1. Create the skeleton
mkdir -p src/modules/payments/components
touch src/modules/payments/{api,queries,mutations,index}.ts

# 2. Define types in shared/types/ first — never in the module itself

# 3. Implement in order: api.ts → queries.ts → mutations.ts → components/ → index.ts

# 4. Wire into app/ via the barrel only — never import internals
```

Build the module first, then wire it into `app/`. Never start from the page and work inward.

---

## Quick Reference

| What | Where |
|---|---|
| New page / route | `app/<route-group>/<route>/page.tsx` |
| Auth guard / shared chrome | `app/<route-group>/layout.tsx` |
| HTTP calls for a domain | `modules/<domain>/api.ts` |
| React Query hooks | `modules/<domain>/queries.ts` |
| Create / Update / Delete | `modules/<domain>/mutations.ts` |
| Domain UI components | `modules/<domain>/components/` |
| Generic UI (Skeleton, Spinner) | `shared/components/` |
| TypeScript types & enums | `shared/types/<domain>.ts` |
| Formatting / utility functions | `shared/utils/` |
| Env config, API base URL | `shared/constants/config.ts` |
| QueryClient provider | `shared/providers/QueryProvider.tsx` |
| Test helpers | `test/test-utils.tsx` |

---

*Last updated: April 10, 2026*
