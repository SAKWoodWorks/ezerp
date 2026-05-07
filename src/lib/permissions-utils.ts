// Shared utilities for roles and permissions (can be used in both client and server components)

export type UserRole =
  | "director"
  | "admin"
  | "accountant"
  | "warehouse_manager"
  | "sales_manager"
  | "sales"
  | "purchasing"
  | "shipping"
  | "hr"
  | "viewer"

export type Permission = {
  name: string
  module: string
  action: string
}

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  department: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  director: 100,
  admin: 90,
  accountant: 70,
  warehouse_manager: 70,
  sales_manager: 70,
  purchasing: 60,
  shipping: 60,
  hr: 60,
  sales: 50,
  viewer: 10,
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    director: "Director",
    admin: "Administrator",
    accountant: "Accountant",
    warehouse_manager: "Warehouse Manager",
    sales_manager: "Sales Manager",
    sales: "Sales",
    purchasing: "Purchasing",
    shipping: "Shipping",
    hr: "HR",
    viewer: "Viewer",
  }
  return displayNames[role]
}
