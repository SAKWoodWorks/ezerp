"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getUserRole } from "@/lib/permissions"
import { UserRole } from "@/lib/permissions"

export async function updateUserRole(userId: string, newRole: UserRole) {
  const supabase = await createClient()

  // Check if current user has permission
  const currentUserRole = await getUserRole()
  if (!currentUserRole || !["director", "admin"].includes(currentUserRole)) {
    throw new Error("Access denied: Insufficient permissions")
  }

  // Admins cannot change director roles
  if (currentUserRole === "admin") {
    const { data: targetUser } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (targetUser?.role === "director" || newRole === "director") {
      throw new Error("Admins cannot modify director roles")
    }
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (error) {
    console.error("Error updating user role:", error)
    throw new Error("Failed to update user role")
  }

  revalidatePath("/users")
  return { success: true }
}
