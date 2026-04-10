# Mouchak Cosmetics - Client Application

> A modern, scalable e-commerce frontend built with Next.js 16, React 19, and TypeScript. Designed with module-based architecture for optimal code organization and maintainability.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Architecture Pattern](#architecture-pattern)
- [Directory Structure](#directory-structure)
- [Core Modules](#core-modules)
- [Type System](#type-system)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Loading States & Components](#loading-states--components)
- [Routing & Layouts](#routing--layouts)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building & Deployment](#building--deployment)
- [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or 20+
- npm 9+ or yarn/pnpm

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Visit http://localhost:3001 in your browser
```

### Available Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Create production build
npm start        # Run production server
npm test         # Run Jest tests
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript type checking
```

---

## 📱 Project Overview

**Mouchak Cosmetics** is a full-featured e-commerce platform frontend for cosmetics retail. The application provides:

- **Customer Portal**: Browse products, manage orders, checkout
- **Staff Dashboard**: Analytics, inventory management, order management
- **Authentication**: Keycloak integration for secure auth
- **Shopping Experience**: Product catalog, wishlist, cart management
- **Payment Integration**: SSLCommerz payment gateway support
- **Responsive Design**: Mobile-first, Tailwind CSS 4 styling

### Key Features

✅ **Module-Based Architecture** - Feature-driven, scalable organization
✅ **Type-Safe** - TypeScript with strict mode enabled
✅ **Performance Optimized** - Turbopack for fast builds
✅ **React Query** - Server state management with automatic caching
✅ **Error Handling** - Comprehensive error boundaries & interceptors
✅ **Loading States** - Skeleton loaders for all async operations
✅ **Responsive UI** - Tailwind CSS 4 with Lucide icons
✅ **Testing Ready** - Jest + Vitest + React Testing Library configured

---

## 🛠️ Technology Stack

### Framework & Runtime
- **Next.js 16.2.2** - React framework with App Router
- **React 19.2.4** - UI library with latest features
- **TypeScript 5** - Type-safe development

### State & Data Fetching
- **React Query 5.96.2** - Server state management
- **Axios 1.14.0** - HTTP client with interceptors

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Lucide React** - Comprehensive icon library
- **Recharts** - Data visualization charts

### Build & Development
- **Turbopack** - Next-generation bundler (7-8s builds)
- **ESLint 9** - Code linting
- **TypeScript Compiler** - Type checking

### Testing
- **Jest** - Unit test framework
- **Vitest** - Alternative test runner
- **React Testing Library 15** - Component testing

### Development Tools
- **PostCSS** - CSS processing
- **next-env** - TypeScript environment types

---

## 🏗️ Architecture Pattern

### Module-Based Architecture

The application follows a **feature-driven, module-based architecture** that organizes code by functionality rather than technical layers.

```
src/
├── app/                    # Next.js App Router
├── features/               # Feature modules
├── modules/                # Shared modules
├── entities/               # Domain entities & types
├── shared/                 # Shared utilities & components
└── components/             # Reusable components (legacy)
```

### Design Principles

1. **Feature Isolation** - Each feature is self-contained with API, queries, mutations
2. **Single Responsibility** - Modules focus on one business domain
3. **Dependency Inversion** - Shared utilities injected via types/interfaces
4. **Type-First** - Types define contracts before implementation
5. **Error Handling** - Comprehensive try-catch with user-friendly messages
6. **Loading States** - Always show loading/skeleton during async operations
7. **Scalability** - Easy to add new features without affecting existing code

### Layering Strategy

```
┌─────────────────────────────────────┐
│       Pages & Layouts (app/)        │ - Route definitions
├─────────────────────────────────────┤
│     Features (with hooks)           │ - Business logic
├─────────────────────────────────────┤
│  Components & Loading States        │ - UI components
├─────────────────────────────────────┤
│  API Client & Interceptors          │ - HTTP layer
├─────────────────────────────────────┤
│  Types, Constants, Utils            │ - Shared resources
└─────────────────────────────────────┘
```

---

## 📁 Directory Structure

### Root Level

```
client/
├── src/                       # Source code
├── public/                    # Static assets
├── .next/                     # Build output (gitignored)
├── node_modules/              # Dependencies (gitignored)
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.mjs          # PostCSS configuration
├── eslint.config.mjs           # ESLint configuration
├── jest.config.ts             # Jest configuration
├── vitest.config.ts           # Vitest configuration
├── .npmrc                      # NPM configuration
└── PROJECT_README.md          # This file
```

### Source Structure

```
src/
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   ├── globals.css            # Global styles
│   ├── (auth)/                # Authentication routes
│   │   └── login/
│   ├── (public)/              # Public routes
│   │   ├── shop/              # Product listing
│   │   └── product/[slug]/    # Product detail
│   ├── (customer-dashboard)/  # Customer routes (protected)
│   │   ├── checkout/
│   │   ├── my-orders/
│   │   └── profile/
│   └── (staff-dashboard)/     # Staff routes (protected)
│       └── dashboard/
│
├── features/                  # Feature modules
│   ├── products/
│   │   ├── api.ts             # API endpoints
│   │   ├── queries.ts         # React Query hooks
│   │   ├── mutations.ts       # Mutations
│   │   └── index.ts           # Barrel exports
│   ├── customers/
│   ├── orders/
│   ├── cart/
│   ├── categories/
│   ├── inventory/
│   ├── analytics/
│   └── homepage/
│
├── modules/                   # Shared modules
│   ├── customers/             # Customer business logic
│   ├── dashboard/             # Dashboard logic
│   └── homepage/              # Homepage logic
│
├── entities/                  # Domain types (backward compatibility)
│   ├── customer.ts
│   ├── order.ts
│   ├── product.ts
│   ├── payment.ts
│   ├── inventory.ts
│   └── types.ts               # Barrel export
│
├── shared/                    # Shared resources
│   ├── lib/
│   │   └── apiClient.ts       # Axios instance with interceptors
│   ├── types/                 # Domain type definitions
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── customer.ts
│   │   ├── payment.ts
│   │   ├── inventory.ts
│   │   ├── common.ts
│   │   └── index.ts           # Barrel export
│   ├── constants/             # Global constants & enums
│   │   ├── config.ts
│   │   ├── patterns.ts
│   │   ├── enums.ts
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── formatters.ts      # Date, price formatting
│   │   ├── string.ts          # String utilities
│   │   ├── storage.ts         # localStorage helpers
│   │   ├── helpers.ts         # Object, array utilities
│   │   ├── errors.ts          # Error parsing
│   │   └── index.ts           # Barrel export
│   ├── components/            # Shared components
│   │   ├── ErrorBoundary.tsx
│   │   ├── Skeletons.tsx
│   │   ├── LoadingStates.tsx
│   │   └── index.ts
│   └── providers/             # Context providers
│
├── components/                # Reusable components (legacy)
├── test/                      # Test utilities
│   ├── test-utils.tsx
│   └── utils.test.ts
└── index.ts                   # Entry point
```

---

## 🧩 Core Modules

### 1. Products Module

**Location**: `src/features/products/`

Handles all product-related operations.

```typescript
// API Endpoints
productAPI.listProducts(params)        // GET /products
productAPI.getProductBySlug(slug)      // GET /products/{slug}
productAPI.getFeaturedProducts(limit)  // GET /products?featured=true

// React Query Hooks
const { data, isLoading, error } = useListProducts(params)
const { data: product } = useProductBySlug(slug)
const { data: featured } = useFeaturedProducts(8)

// Mutations
const { mutate: createProduct } = useCreateProduct()
const { mutate: updateProduct } = useUpdateProduct()
const { mutate: deleteProduct } = useDeleteProduct()
```

**Query Keys Pattern**:
```typescript
PRODUCTS_QUERY_KEYS = {
  all: ['products'],
  lists: () => [..., 'list'],
  list: (params) => [..., params],
  details: () => [..., 'detail'],
  detail: (slug) => [..., slug],
  featured: () => [..., 'featured'],
}
```

### 2. Customers Module

**Location**: `src/features/customers/`

Customer management and authentication flow.

```typescript
// API Endpoints
customersAPI.listCustomers()           // GET /customers
customersAPI.getCustomerDetails(id)    // GET /customers/{id}
customersAPI.updateCustomer(id, data)  // PUT /customers/{id}

// Hooks
const { data: customers } = useListCustomers()
const { data: customer } = useCustomerDetails(id)
const { mutate: updateProfile } = useUpdateCustomerProfile()
```

### 3. Orders Module

**Location**: `src/features/orders/`

Order management and tracking.

```typescript
// Queries
const { data: orders } = useListOrders()
const { data: order } = useOrderDetail(id)

// Mutations
const { mutate: createOrder } = useCreateOrder()
const { mutate: cancelOrder } = useCancelOrder()
```

### 4. Cart Module

**Location**: `src/features/cart/`

Shopping cart management using localStorage.

```typescript
// Utilities
const cart = getCart()
addToCart(product)
removeFromCart(productId)
clearCart()
```

### 5. Categories Module

**Location**: `src/features/categories/`

Product categories and filtering.

```typescript
const { data: categories } = useListCategories()
const { data: products } = useProductsByCategory(categoryId)
```

---

## 🔤 Type System

### Type Organization

All types are centralized in `src/shared/types/` with domain-driven organization:

#### Domain Types

**`product.ts`** - Product related types
```typescript
interface Category { id, name, slug, description, imageUrl, ... }
interface Product { id, name, slug, price, sku, categoryId, images, ... }
interface ListProductsParams { category?, search?, featured?, minPrice?, maxPrice?, ... }
```

**`order.ts`** - Order related types
```typescript
enum OrderStatus { PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED }
enum PaymentStatus { PENDING, PAID, FAILED, REFUNDED }
interface Order { id, customerId, items, totalAmount, status, ... }
interface OrderItem { id, productId, quantity, price, ... }
```

**`customer.ts`** - Customer related types
```typescript
enum UserRole { ADMIN, STAFF, CUSTOMER }
enum CustomerSegment { VIP, REGULAR, NEW }
interface Customer { id, name, email, phone, addresses, ... }
interface User { id, email, name, role, ... }
```

**`payment.ts`** - Payment types
```typescript
enum PaymentMethod { CREDIT_CARD, DEBIT_CARD, MOBILE_BANKING }
enum PaymentProvider { SSLCOMMERZ, STRIPE, PAYPAL }
interface Payment { id, orderId, amount, method, status, ... }
```

**`inventory.ts`** - Inventory types
```typescript
enum InventoryTransactionType { IN, OUT, ADJUSTMENT, TRANSFER }
interface Inventory { id, productId, quantity, reorderLevel, ... }
interface LowStockAlert { productId, currentStock, reorderLevel, ... }
```

**`common.ts`** - Common types
```typescript
interface PaginatedResponse<T> { success, data, pagination, message }
interface ApiResponse<T> { success, data, message, error, errorCode }
interface ApiError { success, message, error, errorCode, statusCode, details }
enum HTTP_STATUS { OK, CREATED, BAD_REQUEST, UNAUTHORIZED, ..., GATEWAY_TIMEOUT }
```

### Type Exports

All types are re-exported through:
1. **`src/shared/types/index.ts`** - Primary import source
2. **`src/entities/types.ts`** - Backward compatibility layer

### Enums

Global enums in `src/shared/constants/enums.ts`:
```typescript
HTTP_METHOD, HTTP_STATUS_CODE, REQUEST_STATUS, QUERY_STATUS, 
NOTIFICATION_TYPE, THEME, LAYOUT, SORT_DIRECTION
```

---

## 🔌 API Integration

### API Client Configuration

**Location**: `src/shared/lib/apiClient.ts`

Configured with Axios with interceptors for:

```typescript
import apiClient from '@/shared/lib/apiClient'

// Request Interceptor
- Adds Authorization token
- Request logging in development
- Sets Content-Type headers

// Response Interceptor
- Handles all HTTP status codes
- 401: Token refresh or redirect to login
- 403: Permission denied message
- 404: Not found handling
- 429: Rate limit handling
- 500+: Server error handling
- Network errors: Automatic retry logic
- Timeout: Graceful error messages
```

### Usage Pattern

```typescript
// Simple GET
const response = await apiClient.get<Product[]>('/products')

// With params
const response = await apiClient.get('/products', {
  params: { page: 1, limit: 10 }
})

// POST with data
const response = await apiClient.post('/orders', {
  items: [...],
  totalAmount: 5000
})

// Error handling
try {
  const data = await apiClient.get('/products')
} catch (error) {
  const userMessage = parseApiError(error)
  // Show user-friendly message
}
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=mouchak
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=client
```

---

## 📊 State Management

### React Query Setup

Configured for optimal performance with custom hooks in each feature:

```typescript
// useListProducts hook
useQuery({
  queryKey: PRODUCTS_QUERY_KEYS.list(params),
  queryFn: () => productAPI.listProducts(params),
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 10 * 60 * 1000,        // 10 minutes (garbage collection)
})

// useProductBySlug hook
useQuery({
  queryKey: PRODUCTS_QUERY_KEYS.detail(slug),
  queryFn: () => productAPI.getProductBySlug(slug),
  enabled: !!slug,               // Wait until slug exists
  staleTime: 10 * 60 * 1000,     // 10 minutes
})

// Mutations with invalidation
useMutation({
  mutationFn: productAPI.updateProduct,
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: PRODUCTS_QUERY_KEYS.lists()
    })
  }
})
```

### Query Key Pattern

```typescript
// Hierarchical query keys for smart invalidation
PRODUCTS_QUERY_KEYS = {
  all: ['products'],                    // Invalidate all
  lists: () => ['products', 'list'],   // Invalidate all lists
  list: (params) => ['products', 'list', params],  // Specific list
  details: () => ['products', 'detail'],           // All details
  detail: (slug) => ['products', 'detail', slug],  // Specific detail
  featured: () => ['products', 'featured'],        // Featured products
}
```

### Local Storage

```typescript
import { getCart, addToCart, removeFromCart } from '@/shared/utils/storage'

// Get cart (with default)
const cart = getCart()

// Add to cart
addToCart({ id: 1, name: 'Product', quantity: 1 })

// Remove from cart
removeFromCart(1)

// Clear cart
clearCart()

// Persistent preferences
setPreference('theme', 'dark')
const theme = getPreference('theme')
```

---

## ⚠️ Error Handling

### Error Boundary Component

**Location**: `src/shared/components/ErrorBoundary.tsx`

Wraps components to catch React errors:

```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

Displays user-friendly UI with:
- Error message
- Refresh button
- Stack trace in development

### API Error Parsing

**Location**: `src/shared/utils/errors.ts`

```typescript
import { parseApiError, getUserErrorMessage } from '@/shared/utils/errors'

try {
  await apiClient.get('/products')
} catch (error) {
  const userMessage = getUserErrorMessage(error)
  // "Unable to load products. Please try again."
  
  // Check error type
  if (isNetworkError(error)) { /* Handle offline */ }
  if (isAuthError(error)) { /* Handle 401/403 */ }
  if (isValidationError(error)) { /* Handle 422 */ }
  if (isRateLimitError(error)) { /* Show rate limit */ }
  if (isServerError(error)) { /* Show server error */ }
}
```

### HTTP Status Handling

```typescript
HTTP_STATUS = {
  OK: 200,              // Success
  CREATED: 201,         // Created
  BAD_REQUEST: 400,     // Invalid input
  UNAUTHORIZED: 401,    // Not authenticated
  FORBIDDEN: 403,       // Not authorized
  NOT_FOUND: 404,       // Resource not found
  CONFLICT: 409,        // Duplicate resource
  UNPROCESSABLE_ENTITY: 422,  // Validation error
  RATE_LIMIT: 429,      // Too many requests
  INTERNAL_SERVER_ERROR: 500, // Server error
  SERVICE_UNAVAILABLE: 503,   // Server down
  GATEWAY_TIMEOUT: 504,       // Timeout
}
```

---

## 🎨 Loading States & Components

### Skeleton Components

**Location**: `src/shared/components/Skeletons.tsx`

Pre-built skeleton loaders for common patterns:

```typescript
import { 
  SkeletonLoader,
  SkeletonCard,
  SkeletonProductCard,
  SkeletonTable,
  SkeletonList,
  SkeletonGrid,
  SkeletonHero,
  SkeletonButton,
  SkeletonText,
  SkeletonHeader
} from '@/shared/components'

// Grid of product skeletons
<SkeletonGrid count={6} />

// Table skeleton
<SkeletonTable rows={5} cols={4} />

// Header skeleton
<SkeletonHeader />
```

### Loading State Components

**Location**: `src/shared/components/LoadingStates.tsx`

```typescript
import {
  LoadingSpinner,
  LoadingOverlay,
  LoadingPage,
  ErrorMessage,
  EmptyState,
  SuccessMessage,
  WarningMessage
} from '@/shared/components'

// Loading spinner
<LoadingSpinner />

// Overlay during operation
<LoadingOverlay isLoading={isLoading} message="Processing..." />

// Error message
<ErrorMessage 
  error={error} 
  onRetry={refetch}
/>

// Empty state
<EmptyState 
  title="No products found"
  message="Try adjusting your filters"
/>
```

### Usage Pattern in Pages

```typescript
export default function ShopPage() {
  const { data, isLoading, isError, error, refetch } = useListProducts()

  if (isLoading) return <SkeletonGrid count={6} />
  if (isError) return <ErrorMessage error={error} onRetry={refetch} />
  if (!data?.length) return <EmptyState title="No products" />

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

## 🛣️ Routing & Layouts

### App Router Structure

Next.js App Router with route groups for organization:

```
app/
├── layout.tsx                 # Root layout (all routes)
├── page.tsx                   # Home route /
├── (auth)/
│   ├── login/                 # /login
│   └── page.tsx
├── (public)/                  # Public routes
│   ├── shop/                  # /shop
│   │   └── page.tsx
│   ├── product/[slug]/        # /product/:slug
│   │   └── page.tsx
│   └── layout.tsx             # Shared layout for public
├── (customer-dashboard)/      # Protected customer routes
│   ├── checkout/              # /checkout
│   ├── my-orders/             # /my-orders
│   ├── profile/               # /profile
│   ├── wishlist/              # /wishlist
│   └── layout.tsx             # With auth check
├── (staff-dashboard)/         # Protected staff routes
│   ├── dashboard/             # /dashboard
│   ├── analytics/
│   ├── inventory/
│   └── layout.tsx             # With staff auth check
└── api/                       # API routes
    └── payment/
        └── ipn/               # /api/payment/ipn
```

### Layout Pattern

```typescript
// app/layout.tsx - Root layout
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <QueryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  )
}

// app/(customer-dashboard)/layout.tsx - Protected layout
async function CustomerLayout({
  children
}: {
  children: React.ReactNode
}) {
  // Check authentication
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  )
}
```

### Dynamic Routes

```typescript
// app/product/[slug]/page.tsx
interface Params {
  slug: string
}

export default function ProductPage({ params }: { params: Params }) {
  const { data: product, isLoading } = useProductBySlug(params.slug)

  if (isLoading) return <SkeletonProductDetail />
  if (!product) return <NotFound />

  return <ProductDetail product={product} />
}
```

---

## 💻 Development Workflow

### Starting Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server (Turbopack)
npm run dev

# Visit http://localhost:3001
```

### Code Organization

1. **Create Feature**: `src/features/my-feature/`
2. **Add API**: `api.ts` - Endpoint definitions
3. **Add Queries**: `queries.ts` - React Query hooks
4. **Add Mutations**: `mutations.ts` - Create/Update/Delete
5. **Export**: `index.ts` - Barrel export
6. **Use in Pages**: Import and use in route handlers

### Component Creation

```typescript
// src/features/products/components/ProductCard.tsx
interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart
}) => {
  return (
    <div className="border rounded-lg p-4">
      <img src={product.images[0]} alt={product.name} />
      <h3>{product.name}</h3>
      <p className="text-lg font-bold">${product.price}</p>
      <button onClick={() => onAddToCart?.(product)}>
        Add to Cart
      </button>
    </div>
  )
}
```

### Hook Usage Pattern

```typescript
// Using a feature hook in a page
import { useListProducts, useFeaturedProducts } from '@/features/products'

export default function HomePage() {
  const { data: featured, isLoading } = useFeaturedProducts(8)

  if (isLoading) return <SkeletonGrid count={8} />

  return (
    <section>
      <h2>Featured Products</h2>
      <Grid>
        {featured?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Grid>
    </section>
  )
}
```

---

## 🧪 Testing

### Test Setup

Configured with Jest + Vitest + React Testing Library.

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Utilities

**Location**: `src/test/test-utils.tsx`

```typescript
import { render, screen } from '@/test/test-utils'

// Wraps with QueryProvider automatically
render(<MyComponent />)

const element = screen.getByText('Hello')
expect(element).toBeInTheDocument()
```

### Example Test

```typescript
// src/shared/utils/__tests__/formatters.test.ts
import { formatPrice, formatDate } from '@/shared/utils/formatters'

describe('formatters', () => {
  it('should format price with currency', () => {
    expect(formatPrice(5000)).toBe('৳5,000')
  })

  it('should format date correctly', () => {
    const date = new Date('2026-04-10')
    expect(formatDate(date, 'short')).toMatch(/Apr 10/)
  })
})
```

### Component Testing

```typescript
import { render, screen } from '@/test/test-utils'
import { Product Card } from '@/features/products'

describe('ProductCard', () => {
  const mockProduct = {
    id: 1,
    name: 'Test Product',
    price: 5000,
    slug: 'test-product',
    // ... other fields
  }

  it('should render product name', () => {
    render(<ProductCard product={mockProduct} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('should call onAddToCart when button clicked', () => {
    const onAddToCart = jest.fn()
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />)
    
    const button = screen.getByText('Add to Cart')
    button.click()
    
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct)
  })
})
```

---

## 🏗️ Building & Deployment

### Production Build

```bash
# Create optimized production build
npm run build

# Output: .next/ directory
# Size: ~200KB (gzipped)
# Time: ~9s (Turbopack)
```

### Build Output

```
✓ Compiled successfully in 9.0s
✓ Finished TypeScript: 14.3s
✓ Collecting page data: 3.1s
✓ Generating static pages: 1.2s

Routes Generated:
  ○ /                    (static)
  ○ /shop                (static)
  ○ /checkout            (static)
  ○ /login               (static)
  ○ /dashboard           (static)
  ✓ /product/[slug]      (dynamic)
  ✓ /my-orders/[id]      (dynamic)
  ✓ /api/payment/ipn     (API route)
```

### Deployment

#### Option 1: Vercel (Recommended)

```bash
# Connect GitHub repo
# Auto-deploys on push to main
# Environment variables via Vercel dashboard
```

#### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY .next ./
COPY public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t mouchak-client .
docker run -p 3000:3000 mouchak-client
```

#### Option 3: Traditional Server

```bash
# Build
npm run build

# Deploy .next/ and public/ to server
# Run: npm start (or node .next/standalone/server.js)
```

### Environment Variables

```env
# Production (.env.production)
NEXT_PUBLIC_API_URL=https://api.mouchak.com
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.mouchak.com
NEXT_PUBLIC_KEYCLOAK_REALM=mouchak
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=cosmetics-app
NEXT_PUBLIC_ENVIRONMENT=production

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
ANALYTICS_ID=G-XXXXXXX
```

---

## 📚 Best Practices

### 1. Type Safety

Always define types upfront:

```typescript
// ✅ Good
interface Product {
  id: number
  name: string
  price: number
  // ...
}

const product: Product = { /* ... */ }

// ❌ Avoid
const product: any = { /* ... */ }
```

### 2. Error Handling

Always handle errors gracefully:

```typescript
// ✅ Good
try {
  const data = await apiClient.get('/products')
  return data
} catch (error) {
  const message = getUserErrorMessage(error)
  showToast(message, 'error')
  return null
}

// ❌ Avoid
const data = await apiClient.get('/products')  // Can crash
return data
```

### 3. Loading States

Always show loading state:

```typescript
// ✅ Good
if (isLoading) return <SkeletonProductCard />
if (isError) return <ErrorMessage error={error} onRetry={refetch} />
if (!data) return <EmptyState />

return <ProductCard product={data} />

// ❌ Avoid
if (!data) return <ProductCard product={data} />  // Crashes when loading
```

### 4. Query Key Management

Use hierarchical query keys:

```typescript
// ✅ Good - Can selectively invalidate
PRODUCTS_QUERY_KEYS = {
  all: ['products'],
  lists: () => ['products', 'list'],
  list: (params) => ['products', 'list', params],
}

// ❌ Avoid - Can't selectively invalidate
['products', productId, 'comments']
```

### 5. Component Organization

Keep components focused:

```typescript
// ✅ Good - Single responsibility
const ProductCard = ({ product }) => {
  // Just render UI
}

const useProductData = (id) => {
  // Just fetch data
}

// ❌ Avoid - Mixed concerns
const Product = ({ id }) => {
  // Fetch, format, render all in one
  const data = useQuery(...)
  const formatted = data.map(...)
  return <div>...</div>
}
```

### 6. Naming Conventions

```typescript
// Components
ProductCard.tsx            // PascalCase
ProductCard.props.ts       // Props interface

// Hooks
useListProducts.ts         // use prefix
useProductBySlug.ts

// Utilities
formatPrice.ts             // camelCase
calculateDiscount.ts

// Types
interface Product { }      // PascalCase
type ProductProps = { }
enum OrderStatus { }       // PascalCase

// Constants
STORAGE_KEYS.CART          // UPPER_CASE
API_CONFIG.BASE_URL
```

### 7. Code Splitting

Use dynamic imports for heavy components:

```typescript
// ✅ Good - Code splits
const HeavyChart = dynamic(
  () => import('@/components/Chart'),
  { loading: () => <LoadingSpinner /> }
)

// ❌ Heavy in initial bundle
import HeavyChart from '@/components/Chart'
```

### 8. Performance

```typescript
// ✅ Good - Memoized
const ProductList = React.memo(({ products }) => {
  return products.map(p => <ProductCard key={p.id} product={p} />)
})

// ✅ Good - Lazy queries
useQuery({
  queryKey: ['product', slug],
  queryFn: () => api.getProduct(slug),
  enabled: !!slug  // Don't fetch until slug exists
})

// ✅ Good - Optimistic updates
useMutation({
  mutationFn: api.updateProduct,
  onMutate: async (newData) => {
    // Update cache before server response
    queryClient.setQueryData(['product'], newData)
  }
})
```

---

## 🔑 Key Files Reference

| File | Purpose |
|------|---------|
| `src/shared/lib/apiClient.ts` | API client with interceptors |
| `src/shared/types/index.ts` | Central type exports |
| `src/shared/constants/index.ts` | Global constants |
| `src/shared/utils/index.ts` | Utility functions |
| `src/shared/components/index.ts` | Shared components |
| `src/features/*/index.ts` | Feature barrel exports |
| `app/layout.tsx` | Root layout |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |

---

## 🚨 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### Runtime Errors

```bash
# Check TypeScript
npm run typecheck

# Run linter
npm run lint

# Check error logs
tail -f .next/logs/build.log
```

### Network Issues

```typescript
// Check if API is running
curl http://localhost:5000/api/health

// Check CORS headers
curl -H "Access-Control-Request-Headers: *" http://localhost:5000/api/products
```

---

## 📞 Support & Documentation

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **React Query**: https://tanstack.com/query/latest
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📄 License

This project is part of the Mouchak Cosmetics platform. All rights reserved.

---

**Last Updated**: April 10, 2026
**Next.js Version**: 16.2.2
**React Version**: 19.2.4
**TypeScript Version**: 5.0+
