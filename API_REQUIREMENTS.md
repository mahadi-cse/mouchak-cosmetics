# API Requirements & Specification

**Total Endpoints:** 47  
**Format:** REST API with JSON  
**Authentication:** Bearer Token (Keycloak JWT)  
**Base URL:** `/api`

---

## Table of Contents

1. [Common Response Format](#common-response-format)
2. [Authentication & Authorization](#authentication--authorization)
3. [Error Handling](#error-handling)
4. [Products API](#products-api)
5. [Inventory API](#inventory-api)
6. [Orders API](#orders-api)
7. [Customers API](#customers-api)
8. [POS API](#pos-api)
9. [Analytics API](#analytics-api)
10. [Reports API](#reports-api)
11. [Categories API](#categories-api)
12. [Admin API](#admin-api)

---

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-04-07T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "timestamp": "2024-04-07T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-04-07T10:30:00Z"
}
```

---

## Authentication & Authorization

### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Roles
- **CUSTOMER** - Read-only access to own data
- **STAFF** - Can view and manage products, inventory, orders (own)
- **ADMIN** - Full access to all resources

---

## Error Handling

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| UNAUTHORIZED | 401 | Invalid/missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| INVALID_INPUT | 400 | Invalid request parameters |
| CONFLICT | 409 | Duplicate resource |
| SERVER_ERROR | 500 | Internal server error |

---

## Products API

### 1. List Products ✅ (Implemented)
```
GET /api/products
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| category | string | Filter by category slug |
| search | string | Search in name/description |
| featured | boolean | Show only featured |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| sortBy | string | Sort field (price, name, date) |
| sortOrder | string | ASC or DESC |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "slug": "product-name",
      "price": 1500.00,
      "costPrice": 800.00,
      "compareAtPrice": 1800.00,
      "sku": "SKU-001",
      "category": { "id": 1, "name": "Skincare" },
      "images": ["url1", "url2"],
      "isFeatured": true,
      "isActive": true,
      "tags": ["tag1"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

### 2. Get Product by ID/Slug ✅ (Implemented)
```
GET /api/products/:slug
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name",
    "slug": "product-name",
    "description": "Long description",
    "shortDescription": "Short desc",
    "price": 1500.00,
    "costPrice": 800.00,
    "compareAtPrice": 1800.00,
    "sku": "SKU-001",
    "barcode": "1234567890",
    "category": { "id": 1, "name": "Skincare" },
    "images": ["url1", "url2"],
    "isFeatured": true,
    "isActive": true,
    "tags": ["tag1", "tag2"],
    "weight": 100,
    "inventory": {
      "quantity": 50,
      "reservedQty": 10,
      "lowStockThreshold": 10
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-04-07T10:30:00Z"
  }
}
```

---

### 3. Create Product ❌
```
POST /api/products
Content-Type: application/json
```

**Authorization:** ADMIN, STAFF

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Description",
  "shortDescription": "Short desc",
  "price": 1500.00,
  "costPrice": 800.00,
  "compareAtPrice": 1800.00,
  "sku": "SKU-001",
  "barcode": "1234567890",
  "categoryId": 1,
  "images": ["url1", "url2"],
  "isFeatured": false,
  "tags": ["tag1"],
  "weight": 100
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": { "id": 2, "name": "New Product", ... },
  "message": "Product created successfully"
}
```

---

### 4. Update Product ❌
```
PUT /api/products/:id
```

**Authorization:** ADMIN, STAFF

**Request Body:** Same as Create (partial updates allowed)

**Response:** 200 OK

---

### 5. Delete Product ❌
```
DELETE /api/products/:id
```

**Authorization:** ADMIN

**Response:** 204 No Content

---

### 6. Bulk Import Products ❌
```
POST /api/products/bulk
Content-Type: application/json
```

**Authorization:** ADMIN

**Request Body:**
```json
{
  "products": [
    { "name": "Product 1", "sku": "SKU-001", ... },
    { "name": "Product 2", "sku": "SKU-002", ... }
  ]
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "failed": 0,
    "errors": []
  }
}
```

---

### 7. Update Product Status ❌
```
PATCH /api/products/:id/status
```

**Authorization:** ADMIN

**Request Body:**
```json
{ "isActive": true, "isFeatured": false }
```

---

## Inventory API

### 1. Get Inventory Summary ❌
```
GET /api/inventory
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| warehouseId | number |
| lowStockOnly | boolean |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product": { "id": 1, "name": "Product", "sku": "SKU-001" },
      "quantity": 50,
      "reservedQty": 10,
      "availableQty": 40,
      "lowStockThreshold": 10,
      "reorderPoint": 20,
      "warehouse": "Main Warehouse",
      "lastCountedAt": "2024-04-07T10:30:00Z"
    }
  ],
  "pagination": {}
}
```

---

### 2. Get Product Stock Details ❌
```
GET /api/inventory/:productId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": 1,
    "product": { "name": "Product", "sku": "SKU-001" },
    "totalQuantity": 100,
    "totalReserved": 20,
    "availableQty": 80,
    "warehouses": [
      { "warehouseId": 1, "name": "Main", "quantity": 60, "reserved": 10 },
      { "warehouseId": 2, "name": "Branch", "quantity": 40, "reserved": 10 }
    ],
    "lowStockThreshold": 10,
    "reorderPoint": 20,
    "reorderQuantity": 50
  }
}
```

---

### 3. Adjust Stock ❌
```
POST /api/inventory/adjust
```

**Authorization:** ADMIN, STAFF (Warehouse)

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 10,
  "type": "ADJUSTMENT",
  "reason": "Recount adjustment",
  "reference": "INV-001",
  "notes": "Manual adjustment",
  "warehouseId": 1
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": 1,
    "inventoryId": 1,
    "type": "ADJUSTMENT",
    "quantity": 10,
    "balanceBefore": 50,
    "balanceAfter": 60,
    "timestamp": "2024-04-07T10:30:00Z"
  }
}
```

---

### 4. Transfer Stock Between Warehouses ❌
```
POST /api/inventory/transfer
```

**Authorization:** ADMIN, STAFF (Warehouse Manager)

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 10,
  "fromWarehouseId": 1,
  "toWarehouseId": 2,
  "notes": "Rebalancing"
}
```

**Response:** 201 Created

---

### 5. Get Low Stock Items ❌
```
GET /api/inventory/low-stock
```

**Query Parameters:**
| Param | Type |
|-------|------|
| warehouseId | number |
| page | number |
| limit | number |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": 1,
      "name": "Product Name",
      "sku": "SKU-001",
      "currentStock": 5,
      "lowStockThreshold": 10,
      "reorderPoint": 20,
      "warehouse": "Main"
    }
  ]
}
```

---

### 6. Get Inventory History ❌
```
GET /api/inventory/:productId/history
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| startDate | ISO date |
| endDate | ISO date |
| type | PURCHASE,SALE,RETURN,ADJUSTMENT |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "SALE",
      "quantity": 10,
      "balanceBefore": 60,
      "balanceAfter": 50,
      "reference": "ORDER-001",
      "notes": "Order fulfillment",
      "createdAt": "2024-04-07T10:30:00Z"
    }
  ],
  "pagination": {}
}
```

---

### 7. Stock Reconciliation ❌
```
POST /api/inventory/reconcile
```

**Authorization:** ADMIN

**Request Body:**
```json
{
  "warehouseId": 1,
  "items": [
    { "productId": 1, "physicalCount": 45 },
    { "productId": 2, "physicalCount": 30 }
  ],
  "notes": "Physical count reconciliation"
}
```

**Response:** 200 OK

---

### 8. Inventory Reports ❌
```
GET /api/inventory/reports
```

**Query Parameters:**
| Param | Type |
|-------|------|
| reportType | summary, detailed, valuation |
| startDate | ISO date |
| endDate | ISO date |
| warehouseId | number |

---

## Orders API

### 1. List Orders ❌
```
GET /api/orders
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| status | PENDING,CONFIRMED,PROCESSING,SHIPPED,DELIVERED |
| channel | ONLINE,POS |
| customerId | number |
| startDate | ISO date |
| endDate | ISO date |
| search | Order number or name |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-2024-001",
      "customer": { "id": 1, "name": "Customer Name" },
      "status": "PENDING",
      "channel": "ONLINE",
      "total": 5000.00,
      "itemCount": 3,
      "createdAt": "2024-04-07T10:30:00Z",
      "updatedAt": "2024-04-07T10:30:00Z"
    }
  ],
  "pagination": {}
}
```

---

### 2. Get Order Details ❌
```
GET /api/orders/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "orderNumber": "ORD-2024-001",
    "customer": { "id": 1, "name": "Customer", "email": "email@example.com" },
    "processedBy": { "id": 1, "name": "Staff Name" },
    "status": "PENDING",
    "channel": "ONLINE",
    "items": [
      { "id": 1, "productName": "Product", "quantity": 2, "unitPrice": 1500, "totalPrice": 3000 }
    ],
    "shipping": {
      "name": "Customer Name",
      "phone": "01711111111",
      "address": "Address",
      "city": "Dhaka",
      "postalCode": "1000",
      "country": "Bangladesh"
    },
    "financial": {
      "subtotal": 3000,
      "discountAmount": 0,
      "shippingCharge": 100,
      "tax": 0,
      "total": 3100
    },
    "payment": {
      "id": 1,
      "method": "SSLCOMMERZ",
      "status": "PENDING",
      "amount": 3100
    },
    "timeline": [
      { "status": "PENDING", "timestamp": "2024-04-07T10:00:00Z", "note": "Order created" }
    ],
    "notes": "Order notes",
    "createdAt": "2024-04-07T10:30:00Z"
  }
}
```

---

### 3. Update Order ❌
```
PUT /api/orders/:id
```

**Authorization:** ADMIN, STAFF

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "shippingAddress": "New address",
  "notes": "Updated notes"
}
```

---

### 4. Update Order Status ❌
```
PUT /api/orders/:id/status
```

**Authorization:** ADMIN, STAFF

**Request Body:**
```json
{
  "status": "SHIPPED",
  "note": "Shipped via DHL"
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "SHIPPED",
    "timeline": [...]
  }
}
```

---

### 5. Add Order Notes ❌
```
POST /api/orders/:id/notes
```

**Authorization:** ADMIN, STAFF

**Request Body:**
```json
{
  "note": "Note text here"
}
```

---

### 6. Create Return ❌
```
POST /api/orders/:id/return
```

**Authorization:** CUSTOMER, ADMIN, STAFF

**Request Body:**
```json
{
  "reason": "Damaged product",
  "items": [
    { "orderItemId": 1, "quantity": 1, "reason": "Damaged" }
  ],
  "notes": "Additional notes"
}
```

---

### 7. Process Refund ❌
```
PUT /api/orders/:id/refund
```

**Authorization:** ADMIN

**Request Body:**
```json
{
  "amount": 1500.00,
  "reason": "Customer return",
  "method": "ORIGINAL_PAYMENT"
}
```

---

### 8. Generate Invoice ❌
```
GET /api/orders/:id/invoice
```

**Query Parameters:**
| Param | Type |
|-------|------|
| format | pdf, html |

**Response:** PDF/HTML file or JSON

---

### 9. Mark as Shipped ❌
```
POST /api/orders/:id/ship
```

**Authorization:** ADMIN, STAFF

**Request Body:**
```json
{
  "trackingNumber": "TRK-123456",
  "carrier": "DHL",
  "estimatedDelivery": "2024-04-10T00:00:00Z"
}
```

---

### 10. Cancel Order ❌
```
DELETE /api/orders/:id
```

**Authorization:** ADMIN, STAFF (own), CUSTOMER (own)

**Request Body:**
```json
{
  "reason": "Customer request",
  "restockItems": true
}
```

---

## Customers API

### 1. List Customers ❌
```
GET /api/customers
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| search | name, email, phone |
| segment | VIP, REGULAR, NEW, INACTIVE |
| sortBy | totalSpent, loyaltyPoints, dateJoined |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Customer Name",
      "email": "email@example.com",
      "phone": "01711111111",
      "segment": "VIP",
      "totalOrders": 5,
      "totalSpent": 50000.00,
      "loyaltyPoints": 5000,
      "lastOrderDate": "2024-04-07T10:30:00Z",
      "joinedDate": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {}
}
```

---

### 2. Get Customer Details ❌
```
GET /api/customers/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user": { "id": 1, "name": "Customer", "email": "email@example.com", "phone": "01711111111" },
    "segment": "VIP",
    "dateOfBirth": "1990-01-01",
    "gender": "Female",
    "address": "Address",
    "city": "Dhaka",
    "postalCode": "1000",
    "country": "Bangladesh",
    "loyaltyPoints": 5000,
    "totalSpent": 50000.00,
    "totalOrders": 5,
    "lastOrderDate": "2024-04-07T10:30:00Z",
    "orders": [ { "id": 1, "orderNumber": "ORD-001", "total": 10000 } ]
  }
}
```

---

### 3. Update Customer ❌
```
PUT /api/customers/:id
```

**Authorization:** CUSTOMER (own), ADMIN

**Request Body:**
```json
{
  "dateOfBirth": "1990-01-01",
  "gender": "Female",
  "defaultAddress": "New Address",
  "city": "Dhaka",
  "postalCode": "1000"
}
```

---

### 4. Get Customer Orders ❌
```
GET /api/customers/:id/orders
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| status | PENDING,DELIVERED,CANCELLED |

---

### 5. Update Loyalty Points ❌
```
PUT /api/customers/:id/loyalty
```

**Authorization:** ADMIN, STAFF

**Request Body:**
```json
{
  "points": 500,
  "action": "ADD",
  "reason": "Order reward",
  "reference": "ORD-001"
}
```

---

### 6. Send Customer Message ❌
```
POST /api/customers/:id/messages
```

**Authorization:** ADMIN, STAFF, SUPPORT

**Request Body:**
```json
{
  "subject": "Order Update",
  "message": "Message content",
  "channel": "EMAIL",
  "template": "ORDER_UPDATE"
}
```

---

### 7. Delete Customer ❌
```
DELETE /api/customers/:id
```

**Authorization:** ADMIN

---

## POS API

### 1. Create POS Transaction ❌
```
POST /api/pos/transactions
```

**Authorization:** STAFF, Admin

**Request Body:**
```json
{
  "items": [
    { "productId": 1, "quantity": 2, "price": 1500 }
  ],
  "discount": 0,
  "paymentMethod": "CASH",
  "customerId": 1,
  "notes": "Transaction notes"
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transactionNumber": "POS-2024-001",
    "total": 3000,
    "paymentMethod": "CASH",
    "status": "COMPLETED",
    "receipt": "receipt_content",
    "timestamp": "2024-04-07T10:30:00Z"
  }
}
```

---

### 2. List POS Transactions ❌
```
GET /api/pos/transactions
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| startDate | ISO date |
| endDate | ISO date |
| paymentMethod | CASH,CARD,BKASH,NAGAD,ROCKET |

---

### 3. Get Register Status ❌
```
GET /api/pos/register
```

**Response:**
```json
{
  "success": true,
  "data": {
    "registerId": 1,
    "status": "OPEN",
    "openedAt": "2024-04-07T08:00:00Z",
    "openingAmount": 5000,
    "currentAmount": 15000,
    "totalTransactions": 10
  }
}
```

---

### 4. Open Register ❌
```
POST /api/pos/register/open
```

**Request Body:**
```json
{
  "openingAmount": 5000
}
```

---

### 5. Close Register ❌
```
POST /api/pos/register/close
```

**Request Body:**
```json
{
  "closingAmount": 15000
}
```

---

### 6. Get POS Products ❌
```
GET /api/pos/products
```

**Query Parameters:**
| Param | Type |
|-------|------|
| search | string |

---

## Analytics API

### 1. Revenue Analytics ❌
```
GET /api/analytics/revenue
```

**Query Parameters:**
| Param | Type |
|-------|------|
| period | TODAY, WEEK, MONTH, YEAR, CUSTOM |
| startDate | ISO date |
| endDate | ISO date |
| groupBy | DAY, WEEK, MONTH |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "MONTH",
    "totalRevenue": 500000,
    "previousPeriod": 450000,
    "growth": 11.11,
    "breakdown": [
      { "date": "2024-04-01", "revenue": 16667 }
    ]
  }
}
```

---

### 2. Sales by Category ❌
```
GET /api/analytics/sales-by-category
```

**Query Parameters:**
| Param | Type |
|-------|------|
| period | TODAY, WEEK, MONTH, YEAR |
| limit | number |

---

### 3. Top Products ❌
```
GET /api/analytics/top-products
```

**Query Parameters:**
| Param | Type |
|-------|------|
| metric | QUANTITY, REVENUE |
| period | WEEK, MONTH, YEAR |
| limit | number |

---

### 4. Customer Analytics ❌
```
GET /api/analytics/customers
```

**Query Parameters:**
| Param | Type |
|-------|------|
| metric | NEW, RETURNING, VIP |
| period | MONTH, YEAR |

---

### 5. Invoice Data ❌
```
GET /api/analytics/invoices
```

For report generation and reconciliation

---

### 6. Custom Report Query ❌
```
GET /api/analytics/custom
```

For flexible analytics queries with custom filters

---

## Reports API

### 1. Sales Report ❌
```
GET /api/reports/sales
```

**Query Parameters:**
| Param | Type |
|-------|------|
| startDate | ISO date |
| endDate | ISO date |
| format | JSON, PDF, EXCEL |

---

### 2. Inventory Report ❌
```
GET /api/reports/inventory
```

---

### 3. Customer Report ❌
```
GET /api/reports/customers
```

---

### 4. Financial Report ❌
```
GET /api/reports/financial
```

---

### 5. Schedule Report ❌
```
POST /api/reports/schedule
```

**Request Body:**
```json
{
  "reportType": "sales",
  "frequency": "DAILY, WEEKLY, MONTHLY",
  "recipients": ["email1@example.com"],
  "format": "PDF"
}
```

---

### 6. Export Report ❌
```
GET /api/reports/:id/export
```

**Query Parameters:**
| Param | Type |
|-------|------|
| format | PDF, EXCEL, CSV |

---

### 7. Download Report ❌
```
GET /api/reports/:id/download
```

---

## Categories API

### 1. List Categories ❌
```
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Skincare",
      "slug": "skincare",
      "description": "Skincare products",
      "imageUrl": "url",
      "parentId": null,
      "isActive": true,
      "sortOrder": 1,
      "productCount": 25
    }
  ]
}
```

---

### 2. Get Category ❌
```
GET /api/categories/:id
```

---

### 3. Create Category ❌
```
POST /api/categories
```

**Authorization:** ADMIN

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Description",
  "parentId": null,
  "imageUrl": "url"
}
```

---

### 4. Update Category ❌
```
PUT /api/categories/:id
```

---

### 5. Delete Category ❌
```
DELETE /api/categories/:id
```

---

## Admin API

### 1. List Users ❌
```
GET /api/admin/users
```

**Query Parameters:**
| Param | Type |
|-------|------|
| page | number |
| limit | number |
| role | CUSTOMER, STAFF, ADMIN |
| isActive | boolean |

---

### 2. Create User ❌
```
POST /api/admin/users
```

**Authorization:** ADMIN

---

### 3. Update User ❌
```
PUT /api/admin/users/:id
```

---

### 4. Delete User ❌
```
DELETE /api/admin/users/:id
```

---

### 5. List Roles ❌
```
GET /api/admin/roles
```

---

### 6. View Audit Logs ❌
```
GET /api/admin/audit-logs
```

**Query Parameters:**
| Param | Type |
|-------|------|
| entity | users, orders, products |
| action | CREATE, UPDATE, DELETE |
| startDate | ISO date |
| endDate | ISO date |

---

### 7. Get Settings ❌
```
GET /api/admin/settings
```

---

### 8. Update Settings ❌
```
PUT /api/admin/settings
```

**Authorization:** ADMIN

---

## Summary

| Module | Endpoints | Status |
|--------|-----------|--------|
| Products | 7 | 3 Implemented |
| Inventory | 8 | 0 Implemented |
| Orders | 10 | 0 Implemented |
| Customers | 7 | 0 Implemented |
| POS | 6 | 0 Implemented |
| Analytics | 6 | 0 Implemented |
| Reports | 7 | 0 Implemented |
| Categories | 5 | 0 Implemented |
| Admin | 8 | 0 Implemented |
| **Total** | **47** | **3 Implemented** |

