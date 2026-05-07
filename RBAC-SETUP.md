# Role-Based Access Control (RBAC) Setup Guide

This guide explains the comprehensive role-based access control system implemented in EZ-ERP.

## Overview

The EZ-ERP system includes a complete RBAC implementation with:
- 10 predefined user roles
- Granular permissions system
- Automatic user profile creation
- Role management UI for admins
- Helper functions for permission checks

## User Roles

### 1. Director
- **Access Level**: Full system access
- **Permissions**: All permissions
- **Use Case**: CEO, Owner, Top management
- **Can Do**:
  - Everything in the system
  - Manage all users including admins
  - Change system settings
  - View all reports and financial data

### 2. Admin
- **Access Level**: Administrative access (except some director-only functions)
- **Permissions**: Almost all permissions except user deletion and some settings
- **Use Case**: System administrators, IT managers
- **Can Do**:
  - Manage users (except directors)
  - Configure most system settings
  - Access all modules
  - View all reports

### 3. Accountant
- **Access Level**: Financial and reporting access
- **Permissions**: Invoices, reports, customers, purchase orders (read products)
- **Use Case**: Finance team, accounting department
- **Can Do**:
  - Manage invoices and payments
  - View and create financial reports
  - Manage customer records
  - View purchase orders
  - Cannot: Modify inventory directly

### 4. Warehouse Manager
- **Access Level**: Full inventory and warehouse access
- **Permissions**: Inventory, warehouses, products, shipments, inventory reports
- **Use Case**: Warehouse supervisors, inventory managers
- **Can Do**:
  - Manage all inventory operations
  - Stock adjustments and transfers
  - Warehouse management
  - Import/export shipments
  - View inventory reports
  - Cannot: Access financial data

### 5. Sales Manager
- **Access Level**: Full sales operations + reporting
- **Permissions**: Customers, invoices, products, sales reports, invoice approval
- **Use Case**: Sales team leaders
- **Can Do**:
  - Manage customers and invoices
  - Approve invoices
  - View sales reports
  - Export reports
  - View product information
  - Cannot: Modify inventory or access other departments' data

### 6. Sales
- **Access Level**: Basic sales operations
- **Permissions**: Create/read/update customers, invoices, view products, view sales reports
- **Use Case**: Sales representatives
- **Can Do**:
  - Create and manage customer records
  - Create and update invoices
  - View products and prices
  - View sales reports
  - Cannot: Delete records, approve invoices, access inventory

### 7. Purchasing
- **Access Level**: Purchase orders and suppliers
- **Permissions**: Purchase orders, view products/inventory/warehouses
- **Use Case**: Procurement team
- **Can Do**:
  - Manage purchase orders
  - View inventory levels
  - View warehouse information
  - View product details
  - Cannot: Modify inventory, access sales or financial data

### 8. Shipping
- **Access Level**: Import/export shipments
- **Permissions**: Shipments, view products/inventory/warehouses/customers
- **Use Case**: Shipping coordinators, logistics team
- **Can Do**:
  - Manage import/export shipments
  - View inventory for shipping
  - View customer information
  - Cannot: Modify inventory, access financial data

### 9. HR
- **Access Level**: Employee management
- **Permissions**: Employees module (full access)
- **Use Case**: Human resources department
- **Can Do**:
  - Manage employee records
  - Track leave history
  - View department information
  - Cannot: Access other modules

### 10. Viewer
- **Access Level**: Read-only access
- **Permissions**: Read-only across all modules
- **Use Case**: Auditors, observers, temporary access
- **Can Do**:
  - View data across all modules
  - Cannot: Create, update, or delete anything

## Setup Instructions

### Step 1: Run Database Migration

Execute the SQL migration file in your Supabase SQL editor:

```bash
# File: database-roles-permissions.sql
```

This will:
- Create `user_role` enum type
- Create `user_profiles` table
- Create `permissions` and `role_permissions` tables
- Insert default permissions
- Assign permissions to roles
- Create helper functions
- Set up Row Level Security (RLS)
- Create triggers for automatic profile creation

### Step 2: Verify Tables Created

Check in Supabase Dashboard > Table Editor:
- ✓ `user_profiles`
- ✓ `permissions`
- ✓ `role_permissions`

### Step 3: Assign First Admin

After running the migration, you need to manually set your first admin user:

1. Sign in to your ERP system (you'll be created as a "viewer" by default)
2. Go to Supabase Dashboard > SQL Editor
3. Run this query to make yourself a director:

```sql
UPDATE public.user_profiles
SET role = 'director'
WHERE email = 'your-email@sakww.com';
```

### Step 4: Access User Management

Once you're a director or admin:
1. Navigate to **User Management** in the sidebar (shield icon)
2. You can now manage all user roles

## Using Permissions in Code

### Server-Side Permission Checks

```typescript
import { hasPermission, requirePermission, hasRole } from "@/lib/permissions"

// Check if user has permission
export async function myServerAction() {
  const canCreate = await hasPermission("products.create")
  if (!canCreate) {
    return { error: "Permission denied" }
  }
  // ... proceed
}

// Require permission (throws error if not allowed)
export async function createProduct() {
  await requirePermission("products.create")
  // ... proceed
}

// Check role
export async function adminAction() {
  const isAdmin = await hasRole(["director", "admin"])
  if (!isAdmin) {
    redirect("/?message=Access denied")
  }
  // ... proceed
}
```

### Page-Level Protection

```typescript
// src/app/my-page/page.tsx
import { getUserRole } from "@/lib/permissions"
import { redirect } from "next/navigation"

export default async function MyPage() {
  const userRole = await getUserRole()
  
  if (!userRole || !["director", "admin"].includes(userRole)) {
    redirect("/?message=Access denied")
  }
  
  // ... render page
}
```

### Client Component Checks

For client components, fetch the user's permissions in the server component and pass them down:

```typescript
// Server Component
export default async function Page() {
  const permissions = await getUserPermissions()
  return <ClientComponent permissions={permissions} />
}

// Client Component
"use client"
export function ClientComponent({ permissions }) {
  const canCreate = permissions.some(p => p.name === "products.create")
  
  return (
    <div>
      {canCreate && <CreateButton />}
    </div>
  )
}
```

## Permission Naming Convention

Permissions follow the pattern: `{module}.{action}`

### Modules:
- `products`, `customers`, `invoices`, `inventory`, `warehouses`
- `purchase_orders`, `shipments`, `employees`, `users`
- `reports`, `settings`

### Actions:
- `create`, `read`, `update`, `delete`
- Special: `approve`, `transfer`, `export`, `manage_roles`

### Examples:
- `products.create` - Can create new products
- `invoices.approve` - Can approve invoices
- `inventory.transfer` - Can transfer stock between warehouses
- `users.manage_roles` - Can change user roles

## Adding Custom Permissions

### 1. Add Permission to Database

```sql
INSERT INTO public.permissions (name, description, module, action)
VALUES ('invoices.cancel', 'Cancel invoices', 'invoices', 'cancel');
```

### 2. Assign to Roles

```sql
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'director'::user_role, id 
FROM public.permissions 
WHERE name = 'invoices.cancel';
```

### 3. Use in Code

```typescript
await requirePermission("invoices.cancel")
```

## Helper Functions Reference

### `getUserProfile()`
Returns the full user profile including role.

### `getUserRole()`
Returns just the user's role.

### `hasPermission(permissionName: string)`
Checks if user has a specific permission.

### `hasRole(roles: UserRole | UserRole[])`
Checks if user has one of the specified roles.

### `hasRoleLevel(minRole: UserRole)`
Checks if user's role is equal to or higher than specified role.

### `requirePermission(permissionName: string)`
Throws error if user doesn't have permission (use in server actions).

### `requireRole(roles: UserRole | UserRole[])`
Throws error if user doesn't have role (use in server actions).

## Security Best Practices

### 1. Always Check Permissions on Server
Never rely on client-side permission checks alone:

```typescript
// ❌ Bad - client only
"use client"
function DeleteButton({ canDelete }) {
  if (!canDelete) return null
  return <button onClick={handleDelete}>Delete</button>
}

// ✓ Good - server action checks
"use server"
async function deleteItem() {
  await requirePermission("items.delete")
  // ... delete
}
```

### 2. Use Row Level Security (RLS)
The migration automatically sets up RLS policies. Ensure all tables have appropriate policies.

### 3. Audit User Role Changes
User role changes are logged via the `updated_at` timestamp. Consider adding an audit log for role changes:

```sql
CREATE TABLE user_role_audit (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  old_role user_role,
  new_role user_role,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Regular Permission Reviews
Periodically review and update permissions to ensure they align with business needs.

## Troubleshooting

### Issue: "Access Denied" for all users

**Solution**: Check that user_profiles table has records. Run:
```sql
SELECT * FROM public.user_profiles;
```

If empty, the trigger might not be working. Manually insert profile:
```sql
INSERT INTO public.user_profiles (id, email, role)
SELECT id, email, 'viewer'::user_role
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.users.id
);
```

### Issue: User role changes not reflecting

**Solution**: 
1. Clear browser cache
2. Sign out and sign back in
3. Check that RLS policies allow reading user_profiles

### Issue: Cannot see User Management page

**Solution**: You need to be Director or Admin. Update your role:
```sql
UPDATE public.user_profiles 
SET role = 'director' 
WHERE email = 'your-email@sakww.com';
```

## Extending the System

### Adding New Roles

1. **Add to enum**:
```sql
ALTER TYPE user_role ADD VALUE 'new_role';
```

2. **Define permissions**:
```sql
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'new_role'::user_role, id 
FROM public.permissions 
WHERE module IN ('specific_modules');
```

3. **Update TypeScript types** in `src/lib/permissions.ts`

4. **Add translations** in `messages/*.json`

## Credits

**Developed by**: BK-SAK Woodworks  
**Version**: 1.0  
**Last Updated**: 2025
