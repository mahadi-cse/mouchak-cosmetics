# Role & Permission System Implementation

**Purpose:** Replace hardcoded UserRole enum with flexible, dynamic role-based access control (RBAC) system  
**Status:** Implementation Plan  
**Date:** April 7, 2026

---

## Current Problems

### 1. Hardcoded Roles (❌ Not Flexible)
```prisma
enum UserRole {
  CUSTOMER
  STAFF
  ADMIN
}
```
- Admin can't create new roles (e.g., "Branch Manager", "Supervisor")
- All STAFF have same permissions (not true)
- Can't add custom roles without code change + migration
- Can't change permissions without changing code

### 2. No Branches/Warehouses Management (❌ Missing)
- Current schema has `warehouseId` INT in inventory but no warehouses table
- Can't manage multiple branches
- No branch-specific user assignments
- Can't restrict staff to specific branches

### 3. No SKU System (⚠️ Partial)
- SKU exists and is unique, which is good
- But no SKU auto-generation
- No SKU format validation
- No SKU prefix by category

### 4. No Permission Tracking (❌ Missing)
- Role name is just a label
- No way to know what permissions each role has
- Can't audit permission changes
- Can't define custom permissions

---

## Solution: Flexible RBAC System

### New Tables Structure

```
┌─────────────────┐
│ Role (dynamic)  │──────────────┐
│                 │              │
│ id              │          ┌───────────────┐
│ name            │          │ RolePermission│
│ description     │          │               │
│ isSystem        │          │ roleId        │
│ isActive        │          │ permissionId  │
└─────────────────┘          └───────────────┘
        │                            │
        │                    ┌───────▼────────┐
        │                    │Permission      │
        │                    │                │
        │                    │ id             │
        │                    │ name           │
        │                    │ description    │
        │                    │ resource       │
        │                    │ action         │
        │                    └────────────────┘
        │
    ┌───┴───────────────┐
    │                   │
┌───▼────────┐  ┌──────────────────┐
│User        │  │Branch            │
│            │  │                  │
│id          │  │id                │
│roleId ─────┼──→ name              │
│branchId ───┼──→ branchCode        │
│            │  │location          │
└────────────┘  │phone             │
                │isActive          │
                └──────────────────┘
```

---

## Database Schema - New Tables

### Table 1: Branches (Warehouses/Locations)
```sql
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    branch_code VARCHAR(20) NOT NULL UNIQUE,
    branch_type VARCHAR(50) DEFAULT 'WAREHOUSE',
    
    -- Location Info
    address VARCHAR(500),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    
    -- Operations
    manager_name VARCHAR(255),
    manager_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_type CHECK (branch_type IN ('WAREHOUSE', 'RETAIL', 'OFFICE', 'DISTRIBUTION'))
);

CREATE UNIQUE INDEX idx_branches_code ON branches(branch_code);
CREATE INDEX idx_branches_is_active ON branches(is_active);
```

**Branch Types & Purpose:**
- **WAREHOUSE:** Storage facility, stock management
- **RETAIL:** Physical store for POS
- **OFFICE:** Administrative office
- **DISTRIBUTION:** Distribution center for logistics

---

### Table 2: Roles (Dynamic, Customizable)
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- System vs Custom
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Default roles CANNOT be deleted
    can_be_deleted BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active);
```

**Pre-loaded Default Roles:**
- ADMIN (is_system=true, can_be_deleted=false)
- MANAGER (is_system=true, can_be_deleted=false)
- SUPERVISOR (is_system=true)
- CASHIER (is_system=true)
- WAREHOUSE_STAFF (is_system=true)
- CUSTOMER (is_system=true, can_be_deleted=false)

**Custom Roles (Admin can create):**
- BRANCH_MANAGER
- SALES_EXECUTIVE
- DELIVERY_PARTNER
- ACCOUNTANT
- INVENTORY_MANAGER
- etc.

---

### Table 3: Permissions (Granular Access Control)
```sql
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Resource.Action format
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    
    -- Module grouping
    module VARCHAR(50),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(resource, action)
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_module ON permissions(module);
```

**Permission Format: RESOURCE.ACTION**

Examples:
```
products.read
products.create
products.update
products.delete
orders.read
orders.create
orders.confirm
orders.cancel
orders.refund
customers.read
customers.create
customers.update
inventory.read
inventory.adjust
inventory.transfer
reports.read
users.manage
roles.manage
branches.manage
```

---

### Table 4: Role Permissions (Junction Table)
```sql
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_perms_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_perms_permission_id ON role_permissions(permission_id);
```

---

### Table 5: User Roles (Support Multiple Roles)
```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Optional: Role scope (e.g., Manager of Branch X)
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    
    -- When role becomes effective
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    
    UNIQUE(user_id, role_id, branch_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_branch_id ON user_roles(branch_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
```

**Example User Role Assignments:**
- User1 (customer) → CUSTOMER role, all branches
- User2 (admin) → ADMIN role, all branches
- User3 (branch mgr) → MANAGER role, branch_id=2 (restricted to Branch 2)
- User4 (cashier) → CASHIER role, branch_id=1 (POS at Branch 1)
- User5 (supervisor) → SUPERVISOR role, branch_id=2 + MANAGER role, branch_id=3 (multiple locations)

---

### Table 6: User Branches (User ↔ Branch Assignments)
```sql
CREATE TABLE user_branches (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    
    -- Primary branch for this user
    is_primary BOOLEAN DEFAULT FALSE,
    
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(user_id, branch_id)
);

CREATE INDEX idx_user_branches_user_id ON user_branches(user_id);
CREATE INDEX idx_user_branches_branch_id ON user_branches(branch_id);
CREATE INDEX idx_user_branches_is_primary ON user_branches(is_primary);
```

---

### Table 7: SKU Settings (SKU Management & Generation)
```sql
CREATE TABLE sku_settings (
    id SERIAL PRIMARY KEY,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    
    -- SKU prefix (auto-generated)
    prefix VARCHAR(10) NOT NULL UNIQUE,
    
    -- SKU format: {PREFIX}-{COUNTER}
    -- Example: LIPSTICK-001, LIPSTICK-002
    current_counter INT DEFAULT 0,
    
    -- SKU validation
    enable_auto_generation BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_sku_settings_category ON sku_settings(category_id);
CREATE INDEX idx_sku_settings_prefix ON sku_settings(prefix);
```

**Example SKU Settings:**
- Category: Lipstick → Prefix: LIPS → SKU: LIPS-001, LIPS-002, LIPS-003
- Category: Concealer → Prefix: CONC → SKU: CONC-001, CONC-002
- Category: Foundation → Prefix: FOUN → SKU: FOUN-001, FOUN-002

---

### Table 8: SKU History (Audit Trail)
```sql
CREATE TABLE sku_history (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_sku VARCHAR(100),
    new_sku VARCHAR(100) NOT NULL,
    change_reason VARCHAR(100),
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sku_history_product_id ON sku_history(product_id);
CREATE INDEX idx_sku_history_changed_at ON sku_history(changed_at DESC);
```

---

## Updated Prisma Schema (Changes to User Model)

### BEFORE (Hardcoded)
```prisma
model User {
  id          Int       @id @default(autoincrement())
  role        UserRole  @default(CUSTOMER)  // ❌ Hardcoded enum
  // ... rest of fields
}
```

### AFTER (Flexible)
```prisma
model User {
  id          Int       @id @default(autoincrement())
  keycloakId  String    @unique
  email       String    @unique
  firstName   String
  lastName    String
  phone       String?
  
  // NO HARDCODED ROLE!
  // Role is now in user_roles table (many-to-many)
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relationships
  customer      Customer?
  orders        Order[]
  auditLogs     AuditLog[]
  stockTransfers StockTransfer[]
  
  // NEW: Dynamic role assignments
  userRoles   UserRole[]
  userBranches UserBranch[]
  assignedRoles RoleAssignment[]
  createdAuditLogs AuditLog[] @relation("CreatedBy")

  @@map("users")
}

// NEW MODELS
model Role {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  isSystem    Boolean   @default(false)
  isActive    Boolean   @default(true)
  canBeDeleted Boolean  @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  userRoles   UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  resource    String
  action      String
  module      String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  roles       RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id            Int       @id @default(autoincrement())
  roleId        Int
  role          Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permissionId  Int
  permission    Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt     DateTime  @default(now())

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model UserRole {
  id          Int       @id @default(autoincrement())
  userId      Int
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId      Int
  role        Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  // Role scope (optional - can restrict to branch)
  branchId    Int?
  branch      Branch?   @relation(fields: [branchId], references: [id], onDelete: SetNull)
  
  assignedAt  DateTime  @default(now())
  assignedBy  Int?
  isActive    Boolean   @default(true)
  expiresAt   DateTime?

  @@unique([userId, roleId, branchId])
  @@map("user_roles")
}

model Branch {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  branchCode  String    @unique
  branchType  String    @default("WAREHOUSE")
  
  address     String?
  city        String?
  postalCode  String?
  country     String?
  phone       String?
  email       String?
  
  managerName String?
  managerPhone String?
  
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  userRoles   UserRole[]
  userBranches UserBranch[]
  inventory   Inventory[]

  @@map("branches")
}

model UserBranch {
  id          Int       @id @default(autoincrement())
  userId      Int
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  branchId    Int
  branch      Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
  
  isPrimary   Boolean   @default(false)
  assignedAt  DateTime  @default(now())
  isActive    Boolean   @default(true)

  @@unique([userId, branchId])
  @@map("user_branches")
}

model SKUSetting {
  id          Int       @id @default(autoincrement())
  categoryId  Int       @unique
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  prefix      String    @unique
  currentCounter Int    @default(0)
  enableAutoGeneration Boolean @default(true)
  isActive    Boolean   @default(true)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("sku_settings")
}

model SKUHistory {
  id          Int       @id @default(autoincrement())
  productId   Int
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  oldSku      String?
  newSku      String
  changeReason String?
  changedBy   Int?
  changedAt   DateTime  @default(now())

  @@map("sku_history")
}
```

---

## Implementation Steps

### Step 1: Create Migration File
Create: `server/prisma/migrations/20260407_add_rbac_system/migration.sql`

### Step 2: Insert Default Data
```sql
-- Insert default roles
INSERT INTO roles (name, description, is_system, can_be_deleted) VALUES
('ADMIN', 'System administrator with full access', true, false),
('MANAGER', 'Branch manager with operational control', true, false),
('SUPERVISOR', 'Team supervisor', true, true),
('CASHIER', 'Point of sale cashier', true, true),
('WAREHOUSE_STAFF', 'Warehouse and inventory staff', true, true),
('CUSTOMER', 'Customer account', true, false);

-- Insert permissions (examples - can be expanded)
INSERT INTO permissions (name, description, resource, action, module) VALUES
('products.read', 'View products', 'products', 'read', 'products'),
('products.create', 'Create new product', 'products', 'create', 'products'),
('products.update', 'Edit product', 'products', 'update', 'products'),
('products.delete', 'Delete product', 'products', 'delete', 'products'),

('orders.read', 'View orders', 'orders', 'read', 'orders'),
('orders.create', 'Create order', 'orders', 'create', 'orders'),
('orders.confirm', 'Confirm order', 'orders', 'confirm', 'orders'),
('orders.cancel', 'Cancel order', 'orders', 'cancel', 'orders'),

('customers.read', 'View customers', 'customers', 'read', 'customers'),
('customers.create', 'Create customer', 'customers', 'create', 'customers'),
('customers.update', 'Edit customer', 'customers', 'update', 'customers'),

('inventory.read', 'View inventory', 'inventory', 'read', 'inventory'),
('inventory.adjust', 'Adjust stock', 'inventory', 'adjust', 'inventory'),
('inventory.transfer', 'Transfer between warehouses', 'inventory', 'transfer', 'inventory'),

('reports.read', 'View reports', 'reports', 'read', 'reports'),
('reports.export', 'Export reports', 'reports', 'export', 'reports'),

('users.manage', 'Manage users', 'users', 'manage', 'admin'),
('roles.manage', 'Manage roles', 'roles', 'manage', 'admin'),
('branches.manage', 'Manage branches', 'branches', 'manage', 'admin');

-- Assign permissions to ADMIN role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'ADMIN'),
  id
FROM permissions;

-- Assign permissions to CASHIER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'CASHIER'),
  id
FROM permissions
WHERE resource IN ('orders', 'customers') AND action IN ('read', 'create') OR resource = 'products' AND action = 'read';

-- Assign permissions to WAREHOUSE_STAFF role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'WAREHOUSE_STAFF'),
  id
FROM permissions
WHERE resource IN ('orders', 'inventory') AND action IN ('read', 'adjust');
```

### Step 3: Key Functions to Create

**Get User Permissions:**
```sql
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INT)
RETURNS TABLE (permission_name VARCHAR, resource VARCHAR, action VARCHAR)
AS $$
SELECT DISTINCT p.name, p.resource, p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = p_user_id
  AND p.is_active = true
ORDER BY p.resource, p.action;
$$ LANGUAGE SQL;
```

**Check User Has Permission:**
```sql
CREATE OR REPLACE FUNCTION has_permission(p_user_id INT, p_resource VARCHAR, p_action VARCHAR)
RETURNS BOOLEAN AS $$
SELECT EXISTS (
  SELECT 1
  FROM users u
  JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = p_user_id
    AND p.resource = p_resource
    AND p.action = p_action
    AND p.is_active = true
    AND ur.is_active = true
);
$$ LANGUAGE SQL;
```

**Get User Branches:**
```sql
CREATE OR REPLACE FUNCTION get_user_branches(p_user_id INT)
RETURNS TABLE (branch_id INT, branch_name VARCHAR, branch_code VARCHAR)
AS $$
SELECT DISTINCT b.id, b.name, b.branch_code
FROM users u
JOIN user_branches ub ON u.id = ub.user_id AND ub.is_active = true
JOIN branches b ON ub.branch_id = b.id
WHERE u.id = p_user_id
ORDER BY ub.is_primary DESC, b.name;
$$ LANGUAGE SQL;
```

---

## Backend Implementation Examples

### Express Middleware: Check Permission
```typescript
// middleware/checkPermission.ts
export const checkPermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    
    const hasPermission = await db.query(
      'SELECT has_permission($1, $2, $3)',
      [userId, resource, action]
    );
    
    if (!hasPermission.rows[0].has_permission) {
      return res.status(403).json({ 
        error: `User does not have ${resource}.${action} permission` 
      });
    }
    
    next();
  };
};

export const checkBranchAccess = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const branchId = req.body.branchId || req.query.branchId;
  
  const result = await db.query(
    'SELECT 1 FROM user_branches WHERE user_id = $1 AND branch_id = $2 AND is_active = true',
    [userId, branchId]
  );
  
  if (result.rows.length === 0) {
    return res.status(403).json({ error: 'User does not have access to this branch' });
  }
  
  next();
};
```

### Usage in Routes
```typescript
// routes/products.ts
router.get('/products', 
  checkPermission('products', 'read'),
  getProducts
);

router.post('/products',
  checkPermission('products', 'create'),
  createProduct
);

router.post('/orders',
  checkPermission('orders', 'create'),
  checkBranchAccess,
  createOrder
);
```

### Get SKU Generator
```typescript
// services/skuGenerator.ts
export async function generateSKU(categoryId: number): Promise<string> {
  const setting = await prisma.sKUSetting.findUnique({
    where: { categoryId },
  });
  
  if (!setting || !setting.enableAutoGeneration) {
    throw new Error('SKU auto-generation not enabled for this category');
  }
  
  const newCounter = setting.currentCounter + 1;
  const sku = `${setting.prefix}-${String(newCounter).padStart(3, '0')}`;
  
  // Update counter
  await prisma.sKUSetting.update({
    where: { id: setting.id },
    data: { currentCounter: newCounter },
  });
  
  return sku;
}
```

---

## Benefits vs Current System

| Feature | Current (Hardcoded) | New (Flexible) |
|---|---|---|
| **Add New Role** | Code change + migration | Admin UI |
| **Custom Permissions** | Not possible | Can be created freely |
| **Branch Restriction** | Not supported | Full support |
| **Role per User** | 1 role | Multiple roles (different branches) |
| **Permission Audit** | No tracking | Full history |
| **SKU Management** | Manual | Auto-generation + validation |
| **Scalability** | Limited | Enterprise-ready |
| **Multi-location** | Not supported | Full support |

---

## Example Scenarios

### Scenario 1: Cosmetics Company with 5 Branches
```
Admin → Can create roles, manage branches, assign staff
Branch Manager (Branch 1) → Manage orders, inventory, staff in Branch 1; can't see Branch 2 data
Supervisor (Branch 2) → Approve transfers, view reports for Branch 2
Cashier (Branch 1) → Ring up sales at POS only
Warehouse Staff (Branch 1) → Manage inventory, stock transfers in Branch 1
Customer → Purchase products online, view wishlist
```

### Scenario 2: Creating New Role
```
Admin creates role "Sales Executive":
- Can read products, customers, orders
- Can create orders
- Can view their branch reports only
- Cannot manage users or create new roles

Assign to User4 in Branch 2
User4 can now only work with data from Branch 2
```

### Scenario 3: SKU Auto-generation
```
When admin creates new product in "Lipstick" category:
- System checks SKU settings for category
- Finds prefix "LIPS" with current_counter = 42
- Auto-generates SKU: LIPS-043
- Next product will be LIPS-044
```

---

## Migration Commands

```bash
# 1. Create migration file
npx prisma migrate create add_rbac_system

# 2. Apply migration
npx prisma migrate deploy

# 3. Generate Prisma client
npx prisma generate

# 4. Seed default roles and permissions
npx tsx prisma/seed-rbac.ts
```

---

## Files to Update

1. ✅ **schema.prisma** - Add new models
2. ✅ **migration SQL** - Create tables and functions
3. 📝 **seed-rbac.ts** - Insert default data
4. 📝 **middleware/checkPermission.ts** - Authorization middleware
5. 📝 **services/skuGenerator.ts** - SKU generation
6. 📝 **routes/** - Update route protections
7. 📝 **API docs** - Document new endpoints for role/permission management
8. 📝 **Frontend** - Create admin UI for role/permission management

---

**Next Step:** Ready to implement? Choose:
- A) Update Prisma schema + create migration
- B) Create seed script with default data
- C) Create middleware + helper functions
- D) All of the above

