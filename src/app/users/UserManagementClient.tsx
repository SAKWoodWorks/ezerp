"use client";

import { useState } from "react";
import {
  UserProfile,
  UserRole,
  getRoleDisplayName,
} from "@/lib/permissions-utils";
import { updateUserRole } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Shield, User, CheckCircle, XCircle } from "lucide-react";

interface Props {
  initialUsers: UserProfile[];
  currentUserRole: UserRole;
}

const ROLE_OPTIONS: UserRole[] = [
  "director",
  "admin",
  "accountant",
  "warehouse_manager",
  "sales_manager",
  "sales",
  "purchasing",
  "shipping",
  "hr",
  "viewer",
];

const ROLE_COLORS: Record<UserRole, string> = {
  director: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  accountant: "bg-green-100 text-green-800",
  warehouse_manager: "bg-orange-100 text-orange-800",
  sales_manager: "bg-pink-100 text-pink-800",
  sales: "bg-yellow-100 text-yellow-800",
  purchasing: "bg-cyan-100 text-cyan-800",
  shipping: "bg-indigo-100 text-indigo-800",
  hr: "bg-red-100 text-red-800",
  viewer: "bg-gray-100 text-gray-800",
};

export default function UserManagementClient({
  initialUsers,
  currentUserRole,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoading(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user,
        ),
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update user role");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    User
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Department
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Role
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium">
                    Change Role
                  </th>
                  <th className="h-12 px-4 text-center align-middle font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {user.full_name || "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className="text-sm text-muted-foreground">
                        {user.department || "-"}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge className={ROLE_COLORS[user.role]}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle">
                      {currentUserRole === "director" ||
                      (currentUserRole === "admin" &&
                        user.role !== "director") ? (
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value as UserRole)
                          }
                          disabled={loading === user.id}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No permission
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle text-center">
                      {user.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>Director:</strong> Full system access
            </div>
            <div>
              <strong>Admin:</strong> Administrative access
            </div>
            <div>
              <strong>Accountant:</strong> Financial & reporting
            </div>
            <div>
              <strong>Warehouse Manager:</strong> Inventory management
            </div>
            <div>
              <strong>Sales Manager:</strong> Sales operations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Users:</span>
              <strong>{users.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Active Users:</span>
              <strong>{users.filter((u) => u.is_active).length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Admins:</span>
              <strong>
                {
                  users.filter((u) => ["director", "admin"].includes(u.role))
                    .length
                }
              </strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Access</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={ROLE_COLORS[currentUserRole]}>
              {getRoleDisplayName(currentUserRole)}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              You can manage user roles and permissions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
