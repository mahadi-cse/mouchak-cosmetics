-- CreateEnum BranchType
CREATE TYPE "BranchType" AS ENUM ('WAREHOUSE', 'RETAIL', 'OFFICE', 'DISTRIBUTION');

-- CreateTable branches
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "branchCode" VARCHAR(20) NOT NULL,
    "branchType" "BranchType" NOT NULL DEFAULT 'WAREHOUSE',
    "address" VARCHAR(500),
    "city" VARCHAR(100),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(100),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "managerName" VARCHAR(255),
    "managerPhone" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable roles
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canBeDeleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable permissions
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "module" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable role_permissions
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_roles
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "branchId" INTEGER,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_branches
CREATE TABLE "user_branches" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable sku_settings
CREATE TABLE "sku_settings" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "prefix" VARCHAR(10) NOT NULL,
    "currentCounter" INTEGER NOT NULL DEFAULT 0,
    "enableAutoGeneration" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sku_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable sku_history
CREATE TABLE "sku_history" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "oldSku" VARCHAR(100),
    "newSku" VARCHAR(100) NOT NULL,
    "changeReason" VARCHAR(100),
    "changedBy" INTEGER,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sku_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable role_assignments
CREATE TABLE "role_assignments" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "actionType" VARCHAR(50) NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" INTEGER,
    "reason" TEXT,

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex branches
CREATE UNIQUE INDEX "branches_name_key" ON "branches"("name");
CREATE UNIQUE INDEX "branches_branchCode_key" ON "branches"("branchCode");
CREATE INDEX "branches_isActive_idx" ON "branches"("isActive");

-- CreateIndex roles
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE INDEX "roles_isActive_idx" ON "roles"("isActive");

-- CreateIndex permissions
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");
CREATE INDEX "permissions_action_idx" ON "permissions"("action");
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex role_permissions
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- CreateIndex user_roles
CREATE UNIQUE INDEX "user_roles_userId_roleId_branchId_key" ON "user_roles"("userId", "roleId", "branchId");
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");
CREATE INDEX "user_roles_branchId_idx" ON "user_roles"("branchId");
CREATE INDEX "user_roles_isActive_idx" ON "user_roles"("isActive");

-- CreateIndex user_branches
CREATE UNIQUE INDEX "user_branches_userId_branchId_key" ON "user_branches"("userId", "branchId");
CREATE INDEX "user_branches_userId_idx" ON "user_branches"("userId");
CREATE INDEX "user_branches_branchId_idx" ON "user_branches"("branchId");
CREATE INDEX "user_branches_isPrimary_idx" ON "user_branches"("isPrimary");

-- CreateIndex sku_settings
CREATE UNIQUE INDEX "sku_settings_categoryId_key" ON "sku_settings"("categoryId");
CREATE UNIQUE INDEX "sku_settings_prefix_key" ON "sku_settings"("prefix");

-- CreateIndex sku_history
CREATE INDEX "sku_history_productId_idx" ON "sku_history"("productId");
CREATE INDEX "sku_history_changedAt_idx" ON "sku_history"("changedAt" DESC);

-- AddForeignKey role_permissions
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey user_roles
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey user_branches
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey sku_settings
ALTER TABLE "sku_settings" ADD CONSTRAINT "sku_settings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey sku_history
ALTER TABLE "sku_history" ADD CONSTRAINT "sku_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey role_assignments
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update inventory table to add branch reference
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create PostgreSQL functions for permission checking

-- Function: Get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INT)
RETURNS TABLE (permission_name VARCHAR, resource VARCHAR, action VARCHAR)
LANGUAGE SQL
STABLE
AS $$
SELECT DISTINCT p.name, p.resource, p.action
FROM "users" u
JOIN "user_roles" ur ON u.id = ur."userId" AND ur."isActive" = true
JOIN "role_permissions" rp ON ur."roleId" = rp."roleId"
JOIN "permissions" p ON rp."permissionId" = p.id
WHERE u.id = p_user_id
  AND p."isActive" = true
ORDER BY p.resource, p.action;
$$;

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(p_user_id INT, p_resource VARCHAR, p_action VARCHAR)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
SELECT EXISTS (
  SELECT 1
  FROM "users" u
  JOIN "user_roles" ur ON u.id = ur."userId" AND ur."isActive" = true
  JOIN "role_permissions" rp ON ur."roleId" = rp."roleId"
  JOIN "permissions" p ON rp."permissionId" = p.id
  WHERE u.id = p_user_id
    AND p.resource = p_resource
    AND p.action = p_action
    AND p."isActive" = true
);
$$;

-- Function: Get user branches
CREATE OR REPLACE FUNCTION get_user_branches(p_user_id INT)
RETURNS TABLE (branch_id INT, branch_name VARCHAR, branch_code VARCHAR)
LANGUAGE SQL
STABLE
AS $$
SELECT DISTINCT b.id, b.name, b."branchCode"
FROM "users" u
JOIN "user_branches" ub ON u.id = ub."userId" AND ub."isActive" = true
JOIN "branches" b ON ub."branchId" = b.id
WHERE u.id = p_user_id
ORDER BY ub."isPrimary" DESC, b.name;
$$;

-- Function: Check if user has branch access
CREATE OR REPLACE FUNCTION has_branch_access(p_user_id INT, p_branch_id INT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
SELECT EXISTS (
  SELECT 1
  FROM "user_branches" ub
  WHERE ub."userId" = p_user_id
    AND ub."branchId" = p_branch_id
    AND ub."isActive" = true
);
$$;

-- Insert default branches
INSERT INTO "branches" ("name", "branchCode", "branchType", "city", "country", "isActive", "createdAt", "updatedAt")
VALUES
  ('Main Warehouse', 'WH-001', 'WAREHOUSE', 'Dhaka', 'Bangladesh', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Retail Store', 'RS-001', 'RETAIL', 'Dhaka', 'Bangladesh', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Head Office', 'OFF-001', 'OFFICE', 'Dhaka', 'Bangladesh', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert default roles
INSERT INTO "roles" ("name", "description", "isSystem", "isActive", "canBeDeleted", "createdAt", "updatedAt")
VALUES
  ('ADMIN', 'System administrator with full access', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MANAGER', 'Branch manager with operational control', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SUPERVISOR', 'Team supervisor with team management', true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CASHIER', 'Point of sale cashier', true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('WAREHOUSE_STAFF', 'Warehouse and inventory staff', true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CUSTOMER', 'Customer account', true, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert permissions (Products, Orders, Customers, Inventory, etc.)
INSERT INTO "permissions" ("name", "description", "resource", "action", "module", "isActive", "createdAt", "updatedAt")
VALUES
  ('products.read', 'View products', 'products', 'read', 'products', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('products.create', 'Create new product', 'products', 'create', 'products', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('products.update', 'Edit product', 'products', 'update', 'products', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('products.delete', 'Delete product', 'products', 'delete', 'products', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('orders.read', 'View orders', 'orders', 'read', 'orders', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('orders.create', 'Create order', 'orders', 'create', 'orders', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('orders.confirm', 'Confirm order', 'orders', 'confirm', 'orders', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('orders.cancel', 'Cancel order', 'orders', 'cancel', 'orders', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('orders.refund', 'Refund order', 'orders', 'refund', 'orders', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('customers.read', 'View customers', 'customers', 'read', 'customers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customers.create', 'Create customer', 'customers', 'create', 'customers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customers.update', 'Edit customer', 'customers', 'update', 'customers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('customers.delete', 'Delete customer', 'customers', 'delete', 'customers', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('inventory.read', 'View inventory', 'inventory', 'read', 'inventory', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('inventory.adjust', 'Adjust stock quantity', 'inventory', 'adjust', 'inventory', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('inventory.transfer', 'Transfer stock between warehouses', 'inventory', 'transfer', 'inventory', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('reports.read', 'View reports', 'reports', 'read', 'reports', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('reports.export', 'Export reports', 'reports', 'export', 'reports', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  
  ('users.manage', 'Manage users and assignments', 'users', 'manage', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('roles.manage', 'Manage roles and permissions', 'roles', 'manage', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('branches.manage', 'Manage branches and warehouses', 'branches', 'manage', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dashboard.access', 'Access admin dashboard', 'dashboard', 'access', 'dashboard', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('analytics.read', 'View analytics and metrics', 'analytics', 'read', 'analytics', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign ALL permissions to ADMIN role
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT (SELECT id FROM "roles" WHERE name = 'ADMIN'), id, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "isActive" = true;

-- Assign permissions to MANAGER role (operational control)
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT (SELECT id FROM "roles" WHERE name = 'MANAGER'), id, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "isActive" = true AND ("module" IN ('products', 'orders', 'customers', 'inventory', 'analytics', 'dashboard') OR action IN ('read', 'create', 'confirm'));

-- Assign permissions to CASHIER role (POS operations)
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT (SELECT id FROM "roles" WHERE name = 'CASHIER'), id, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "isActive" = true AND ("name" IN ('orders.create', 'orders.read', 'products.read', 'customers.read', 'customers.create', 'analytics.read'));

-- Assign permissions to WAREHOUSE_STAFF role (inventory management)
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT (SELECT id FROM "roles" WHERE name = 'WAREHOUSE_STAFF'), id, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "isActive" = true AND ("name" IN ('inventory.read', 'inventory.adjust', 'inventory.transfer', 'products.read', 'orders.read', 'analytics.read'));

-- Assign permissions to SUPERVISOR role (team oversight)
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT (SELECT id FROM "roles" WHERE name = 'SUPERVISOR'), id, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "isActive" = true AND ("module" IN ('orders', 'customers', 'products', 'analytics', 'dashboard') OR action = 'read');

-- Assign LIMITED permissions to CUSTOMER role (self-service)
INSERT INTO "role_permissions" ("roleId", "permissionId", "createdAt")
SELECT (SELECT id FROM "roles" WHERE name = 'CUSTOMER'), id, CURRENT_TIMESTAMP
FROM "permissions"
WHERE "isActive" = true AND "name" IN ('orders.read', 'products.read', 'customers.read');
