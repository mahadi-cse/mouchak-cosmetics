# Architecture Pattern Documentation

## ✅ Architecture Confirmation

Your codebase **FOLLOWS** the proper layered architecture:

```
Components (UI) 
    ↓
Hooks (Business Logic)
    ↓
Services (API Calls)
    ↓
Backend API
```

---

## 3 Main Modules

### 1. **Staff Dashboard** 🏢
**Location:** `modules/dashboard/`

**Architecture Flow:**

```
UI Layer (Components)
├── DashboardLayout.tsx
├── Views/ (OverviewView, EcommerceView, AnalyticsView, etc.)
├── Primitives.tsx (Card, Button, Badge, etc.)
└── ManualSaleModal.tsx
        ↓
Business Logic Layer (Hooks)
├── useResponsive.ts (Responsive state)
└── useBreakpoint.ts (Breakpoint logic)
        ↓
Utilities & Constants
├── utils/theme.ts (Design tokens)
├── utils/constants.ts (Navigation data)
└── data/mockData.ts (Mock data)
        ↓
Backend (via features/*)
└── Uses features/orders, inventory, analytics for real data
```

**Module Structure:**
```
modules/dashboard/
├── components/           ← UI components
│   ├── DashboardLayout.tsx
│   ├── Primitives.tsx
│   ├── Table.tsx
│   ├── ManualSaleModal.tsx
│   ├── index.ts (barrel export)
│   └── views/
├── hooks/               ← Business logic
│   ├── useResponsive.ts
│   └── useBreakpoint.ts
├── utils/              ← Utilities
│   ├── theme.ts
│   └── constants.ts
├── data/               ← Mock data
│   └── mockData.ts
└── index.ts            ← Barrel export
```

---

### 2. **Homepage** 🏠
**Location:** `features/homepage/`

**Architecture Flow:**

```
UI Layer (Components)
└── components/homepage/
    ├── Header.tsx
    ├── Hero.tsx
    ├── Features.tsx
    ├── FeaturedProducts.tsx
    ├── Newsletter.tsx
    ├── Footer.tsx
    └── ProductCard.tsx
        ↓
Business Logic Layer (Hooks - React Query)
├── queries.ts (useHomepageStats)
└── Dependencies: useListProducts from features/products
        ↓
Services Layer (API Calls)
└── api.ts
    ├── fetchHomepageStats()
    ├── fetchSiteSettings()
    └── fetchHeroSlider()
        ↓
Backend API
└── GET /api/homepage/...
```

**Module Structure:**
```
features/homepage/
├── api.ts              ← Services (API calls)
├── queries.ts          ← Hooks (React Query)
├── components/         ← UI (if module-specific)
└── index.ts            ← Barrel export
```

**Usage in app/page.tsx:**
```tsx
import { Header, Hero, Features, FeaturedProducts } from '@/components/homepage';

export default function HomePage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <FeaturedProducts />
    </>
  );
}
```

---

### 3. **Customer Dashboard** 👤
**Location:** `app/(customer-dashboard)/` + `features/customers/`

**Architecture Flow:**

```
Routing Layer (App Router)
├── app/(customer-dashboard)/
│   ├── profile/page.tsx
│   ├── my-orders/page.tsx
│   ├── checkout/page.tsx
│   └── wishlist/page.tsx
        ↓
UI Layer (Components)
└── (Page components imported from features/customers or shared)
        ↓
Business Logic Layer (Hooks - React Query)
├── queries.ts
│   ├── useCustomerDetails()
│   ├── useCustomerOrders()
│   └── useCustomerMetrics()
└── mutations.ts
    ├── useUpdateCustomerProfile()
    └── useUpdateOrderStatus()
        ↓
Services Layer (API Calls)
└── api.ts
    ├── fetchCustomer()
    ├── fetchCustomerOrders()
    ├── updateCustomer()
    └── updateOrderStatus()
        ↓
Backend API
└── GET /api/customers/:id
   POST /api/customers/:id
```

**Module Structure:**
```
features/customers/
├── api.ts              ← Services (API calls)
├── queries.ts          ← Hooks (React Query queries)
├── mutations.ts        ← Hooks (React Query mutations)
├── components/         ← UI (optional for reusable parts)
├── types/              ← TypeScript types
└── index.ts            ← Barrel export

app/(customer-dashboard)/
├── profile/page.tsx    ← Router page
├── my-orders/page.tsx  ← Router page
├── checkout/page.tsx   ← Router page
├── wishlist/page.tsx   ← Router page
└── layout.tsx          ← Layout wrapper
```

---

## Pattern Validation

### ✅ Proper Layer Separation

**Each module follows:**

| Layer | Location | Purpose | Example |
|-------|----------|---------|---------|
| **UI (Components)** | `components/` | Render UI, handle user interaction | Button, Card, Header |
| **Business Logic (Hooks)** | `hooks/` or `queries.ts` | State management, data transformation | useResponsive, useListProducts |
| **Services (API)** | `api.ts` or `services/` | API calls, network requests | fetchProducts(), updateOrder() |
| **Backend** | External API | Business logic, data persistence | `/api/products`, `/api/orders` |

---

## Data Flow Example: Fetching Products

```
1. USER INTERACTION (Component)
   └─ User clicks "Load Products" button
        ↓
2. UI COMPONENT
   └─ components/ProductCard.tsx calls hook
        ↓
3. BUSINESS LOGIC (Hook)
   └─ useListProducts(params)
      ├─ Uses React Query
      └─ Calls productAPI.listProducts()
        ↓
4. SERVICE (API Call)
   └─ api.ts
      ├─ Calls apiClient.get('/products')
      └─ Transforms response
        ↓
5. BACKEND
   └─ GET /api/products
      ├─ Validates request
      ├─ Queries database
      └─ Returns JSON response
        ↓
6. RESULT BACK TO UI
   └─ Hook caches in React Query
      └─ Component re-renders with data ✓
```

---

## Import Examples

### ✅ Correct Imports

```typescript
// Import components
import { DashboardLayout } from '@/modules/dashboard/components';

// Import hooks for business logic
import { useResponsive } from '@/modules/dashboard/hooks/useResponsive';
import { useListProducts } from '@/features/products/queries';
import { useCustomerDetails } from '@/modules/customers/queries';

// Import API services (rarely - through hooks)
import { productAPI } from '@/features/products/api';

// Import types
import type { Product } from '@/entities/types';
```

### ❌ Avoid These

```typescript
// DON'T: Import from utils directly in components
import { API_BASE_URL } from '@/shared/lib/constants';

// DON'T: Skip the hook layer and call API directly
import { apiClient } from '@/shared/lib';
const { data } = await apiClient.get('/products');

// DON'T: Mix concerns in component
const MyComponent = () => {
  const [data, setData] = useState();
  useEffect(() => {
    fetch('/api/products'); // ❌ BAD: API call in component
  }, []);
};
```

---

## Module Organization Checklist

### ✅ Staff Dashboard (modules/dashboard/)
- [x] Components organized in `components/`
- [x] Hooks in `hooks/`
- [x] Utils & constants in `utils/`
- [x] Types defined
- [x] Barrel export (index.ts)

### ✅ Homepage (features/homepage/)
- [x] API calls in `api.ts`
- [x] React Query hooks in `queries.ts`
- [x] UI components in `components/homepage/`
- [x] Barrel export (index.ts)

### ✅ Customer Dashboard (features/customers/ + app/(customer-dashboard)/)
- [x] API calls in `api.ts`
- [x] Query hooks in `queries.ts`
- [x] Mutation hooks in `mutations.ts`
- [x] Components in `components/`
- [x] Types in `types/`
- [x] Routing in `app/(customer-dashboard)/`
- [x] Barrel export (index.ts)

---

## Performance & Best Practices

### 1. **React Query Caching** ✓
Each module uses React Query hooks for automatic caching:
```typescript
const { data: products, isLoading } = useListProducts({
  page: 1,
  limit: 10,
});
```

### 2. **Barrel Exports** ✓
Clean imports through index.ts:
```typescript
export { useListProducts } from './queries';
export { productAPI } from './api';
```

### 3. **Type Safety** ✓
All API responses typed:
```typescript
export const productAPI = {
  listProducts: async (params?: ListProductsParams) => {
    return apiClient.get<PaginatedResponse<Product[]>>('/products');
  },
};
```

### 4. **Separation of Concerns** ✓
- Components don't know about API
- Hooks don't render anything
- Services only make API calls
- All work independently

---

## Next Steps

### 1. **Homepage Enhancements**
- Already follows pattern ✓
- Consider moving to `modules/homepage/` if it grows

### 2. **Customer Dashboard Pages**
- Wire up profile/my-orders with real data
- Use `features/customers/` queries

### 3. **New Modules**
When adding features:
```
modules/<feature>/              OR    features/<feature>/
├── components/                      ├── api.ts
├── hooks/                           ├── queries.ts
├── utils/                           ├── mutations.ts
├── types.ts                         ├── components/
└── index.ts                         ├── types/
                                     └── index.ts
```

---

**Status:** ✅ Architecture is clean and properly layered  
**Recommendation:** Continue following this pattern for all new features
