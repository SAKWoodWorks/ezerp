import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UserManagementClient from "./UserManagementClient";

export default async function UsersPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with role
  const { data: currentUserProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = currentUserProfile?.role;

  // Check if user is admin or director
  if (!userRole || !["director", "admin"].includes(userRole)) {
    redirect("/?message=Access denied");
  }

  // Fetch all user profiles
  const { data: users, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return <p className="p-8">Error loading users</p>;
  }

  return (
    <UserManagementClient
      initialUsers={users || []}
      currentUserRole={userRole}
    />
  );
}
