// User Roles and Permissions Utilities (Server-side only)
import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UserRole, Permission } from "./permissions-utils";
import { ROLE_HIERARCHY } from "./permissions-utils";

// Re-export types and utilities from shared module
export type { UserRole, Permission, UserProfile } from "./permissions-utils";

export { ROLE_HIERARCHY, getRoleDisplayName } from "./permissions-utils";

/**
 * Get the current user's profile with role information
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Get the current user's role
 */
export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getUserProfile();
  return profile?.role || null;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(permissionName: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase.rpc("has_permission", {
    user_id: user.id,
    permission_name: permissionName,
  });

  if (error) {
    console.error("Error checking permission:", error);
    return false;
  }

  return data as boolean;
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase.rpc("get_user_permissions", {
    user_id: user.id,
  });

  if (error) {
    console.error("Error fetching permissions:", error);
    return [];
  }

  return data as Permission[];
}

/**
 * Check if user has one of the specified roles
 */
export async function hasRole(roles: UserRole | UserRole[]): Promise<boolean> {
  const userRole = await getUserRole();
  if (!userRole) return false;

  const roleArray = Array.isArray(roles) ? roles : [roles];
  return roleArray.includes(userRole);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  permissions: string[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  permissions: string[],
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if user's role is equal to or higher than specified role
 */
export async function hasRoleLevel(minRole: UserRole): Promise<boolean> {
  const userRole = await getUserRole();
  if (!userRole) return false;

  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Check if user is active
 */
export async function isUserActive(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.is_active ?? false;
}

/**
 * Require permission - throws error if user doesn't have permission
 */
export async function requirePermission(permissionName: string): Promise<void> {
  const allowed = await hasPermission(permissionName);
  if (!allowed) {
    throw new Error(`Permission denied: ${permissionName}`);
  }
}

/**
 * Require role - throws error if user doesn't have role
 */
export async function requireRole(roles: UserRole | UserRole[]): Promise<void> {
  const allowed = await hasRole(roles);
  if (!allowed) {
    const roleList = Array.isArray(roles) ? roles.join(", ") : roles;
    throw new Error(`Role required: ${roleList}`);
  }
}
