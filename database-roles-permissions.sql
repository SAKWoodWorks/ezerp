-- User Roles and Permissions System for EZ-ERP
-- This script creates a comprehensive RBAC (Role-Based Access Control) system

-- =====================================================
-- 1. Create ENUM for user roles
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'director',           -- Full system access, can manage everything
  'admin',              -- Administrative access, can manage users and settings
  'accountant',         -- Financial access, invoices, payments, reports
  'warehouse_manager',  -- Inventory management, stock adjustments, warehouses
  'sales_manager',      -- Sales operations, customers, quotations, invoices
  'sales',              -- Basic sales, create quotations and invoices
  'purchasing',         -- Purchase orders, suppliers
  'shipping',           -- Import/export shipments
  'hr',                 -- Employee management, leave tracking
  'viewer'              -- Read-only access to reports and data
);

-- =====================================================
-- 2. Create user_profiles table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Create permissions table (for granular control)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL, -- e.g., 'products', 'invoices', 'customers'
  action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Create role_permissions junction table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id SERIAL PRIMARY KEY,
  role user_role NOT NULL,
  permission_id INTEGER REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- =====================================================
-- 5. Insert default permissions
-- =====================================================

-- Products permissions
INSERT INTO public.permissions (name, description, module, action) VALUES
  ('products.create', 'Create new products', 'products', 'create'),
  ('products.read', 'View products', 'products', 'read'),
  ('products.update', 'Update product information', 'products', 'update'),
  ('products.delete', 'Delete products', 'products', 'delete'),

-- Customers permissions
  ('customers.create', 'Create new customers', 'customers', 'create'),
  ('customers.read', 'View customers', 'customers', 'read'),
  ('customers.update', 'Update customer information', 'customers', 'update'),
  ('customers.delete', 'Delete customers', 'customers', 'delete'),

-- Invoices permissions
  ('invoices.create', 'Create new invoices', 'invoices', 'create'),
  ('invoices.read', 'View invoices', 'invoices', 'read'),
  ('invoices.update', 'Update invoices', 'invoices', 'update'),
  ('invoices.delete', 'Delete invoices', 'invoices', 'delete'),
  ('invoices.approve', 'Approve invoices', 'invoices', 'approve'),

-- Inventory permissions
  ('inventory.create', 'Create inventory adjustments', 'inventory', 'create'),
  ('inventory.read', 'View inventory', 'inventory', 'read'),
  ('inventory.update', 'Update inventory', 'inventory', 'update'),
  ('inventory.delete', 'Delete inventory records', 'inventory', 'delete'),
  ('inventory.transfer', 'Transfer stock between warehouses', 'inventory', 'transfer'),

-- Warehouse permissions
  ('warehouses.create', 'Create new warehouses', 'warehouses', 'create'),
  ('warehouses.read', 'View warehouses', 'warehouses', 'read'),
  ('warehouses.update', 'Update warehouse information', 'warehouses', 'update'),
  ('warehouses.delete', 'Delete warehouses', 'warehouses', 'delete'),

-- Purchase Orders permissions
  ('purchase_orders.create', 'Create purchase orders', 'purchase_orders', 'create'),
  ('purchase_orders.read', 'View purchase orders', 'purchase_orders', 'read'),
  ('purchase_orders.update', 'Update purchase orders', 'purchase_orders', 'update'),
  ('purchase_orders.delete', 'Delete purchase orders', 'purchase_orders', 'delete'),
  ('purchase_orders.approve', 'Approve purchase orders', 'purchase_orders', 'approve'),

-- Shipments permissions
  ('shipments.create', 'Create shipments', 'shipments', 'create'),
  ('shipments.read', 'View shipments', 'shipments', 'read'),
  ('shipments.update', 'Update shipments', 'shipments', 'update'),
  ('shipments.delete', 'Delete shipments', 'shipments', 'delete'),

-- Employees permissions
  ('employees.create', 'Create employee records', 'employees', 'create'),
  ('employees.read', 'View employees', 'employees', 'read'),
  ('employees.update', 'Update employee information', 'employees', 'update'),
  ('employees.delete', 'Delete employees', 'employees', 'delete'),

-- Users permissions
  ('users.create', 'Create new users', 'users', 'create'),
  ('users.read', 'View users', 'users', 'read'),
  ('users.update', 'Update user information', 'users', 'update'),
  ('users.delete', 'Delete users', 'users', 'delete'),
  ('users.manage_roles', 'Manage user roles', 'users', 'manage_roles'),

-- Reports permissions
  ('reports.view_financial', 'View financial reports', 'reports', 'read'),
  ('reports.view_inventory', 'View inventory reports', 'reports', 'read'),
  ('reports.view_sales', 'View sales reports', 'reports', 'read'),
  ('reports.export', 'Export reports', 'reports', 'export'),

-- Settings permissions
  ('settings.read', 'View system settings', 'settings', 'read'),
  ('settings.update', 'Update system settings', 'settings', 'update')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. Assign permissions to roles
-- =====================================================

-- DIRECTOR: Full access to everything
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'director'::user_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- ADMIN: All except some director-only permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::user_role, id FROM public.permissions
WHERE name NOT IN ('users.delete', 'settings.update')
ON CONFLICT DO NOTHING;

-- ACCOUNTANT: Financial and reporting access
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'accountant'::user_role, id FROM public.permissions
WHERE module IN ('invoices', 'reports', 'customers', 'purchase_orders')
   OR name IN ('customers.read', 'products.read')
ON CONFLICT DO NOTHING;

-- WAREHOUSE_MANAGER: Full inventory and warehouse access
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'warehouse_manager'::user_role, id FROM public.permissions
WHERE module IN ('inventory', 'warehouses', 'products', 'shipments')
   OR name IN ('reports.view_inventory')
ON CONFLICT DO NOTHING;

-- SALES_MANAGER: Full sales access + read reports
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'sales_manager'::user_role, id FROM public.permissions
WHERE module IN ('customers', 'invoices', 'products')
   OR name IN ('reports.view_sales', 'reports.export', 'invoices.approve')
ON CONFLICT DO NOTHING;

-- SALES: Basic sales operations
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'sales'::user_role, id FROM public.permissions
WHERE name IN (
  'customers.create', 'customers.read', 'customers.update',
  'invoices.create', 'invoices.read', 'invoices.update',
  'products.read',
  'reports.view_sales'
)
ON CONFLICT DO NOTHING;

-- PURCHASING: Purchase orders and suppliers
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'purchasing'::user_role, id FROM public.permissions
WHERE module IN ('purchase_orders')
   OR name IN ('products.read', 'inventory.read', 'warehouses.read')
ON CONFLICT DO NOTHING;

-- SHIPPING: Import/export shipments
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'shipping'::user_role, id FROM public.permissions
WHERE module IN ('shipments')
   OR name IN ('products.read', 'inventory.read', 'warehouses.read', 'customers.read')
ON CONFLICT DO NOTHING;

-- HR: Employee management
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'hr'::user_role, id FROM public.permissions
WHERE module IN ('employees')
ON CONFLICT DO NOTHING;

-- VIEWER: Read-only access
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer'::user_role, id FROM public.permissions
WHERE action = 'read'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. Create helper functions
-- =====================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val FROM public.user_profiles WHERE id = user_id;

  IF user_role_val IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role = user_role_val
      AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name TEXT, module TEXT, action TEXT) AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val FROM public.user_profiles WHERE id = user_id;

  RETURN QUERY
  SELECT p.name, p.module, p.action
  FROM public.role_permissions rp
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE rp.role = user_role_val;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- 8. Create trigger to auto-create user profile
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    'viewer'::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Admins and directors can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('director', 'admin', 'hr')
    )
  );

-- Only directors and admins can update user roles
CREATE POLICY "Admins can update profiles" ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('director', 'admin')
    )
  );

-- Everyone can read permissions (to check their own)
CREATE POLICY "All users can view permissions" ON public.permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All users can view role permissions" ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 10. Create indexes for performance
-- =====================================================

CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX idx_permissions_module ON public.permissions(module);
CREATE INDEX idx_permissions_name ON public.permissions(name);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);

-- =====================================================
-- 11. Create updated_at trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.user_profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE public.permissions IS 'System permissions for granular access control';
COMMENT ON TABLE public.role_permissions IS 'Mapping of roles to permissions';
COMMENT ON FUNCTION public.has_permission IS 'Check if a user has a specific permission';
COMMENT ON FUNCTION public.get_user_permissions IS 'Get all permissions for a user';
