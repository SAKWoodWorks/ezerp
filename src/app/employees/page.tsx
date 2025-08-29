import { createClient } from "@/lib/supabase/server"
import EmployeeClientPage from "./EmployeeClientPage"

export default async function EmployeesPage() {
  const supabase = await createClient()

  // Fetch employees and warehouses in parallel for better performance
  const [employeesRes, warehousesRes] = await Promise.all([
    supabase
      .from("employees")
      .select("*, warehouses(name)") // Also fetch the related warehouse name
      .order("created_at", { ascending: false }),
    supabase
      .from("warehouses")
      .select("id, name")
      .order("name", { ascending: true }),
  ])

  const { data: employees, error: employeesError } = employeesRes
  const { data: warehouses, error: warehousesError } = warehousesRes

  if (employeesError || warehousesError) {
    console.error({ employeesError, warehousesError })
    return (
      <p className="p-8">
        เกิดข้อผิดพลาดในการโหลดข้อมูล:{" "}
        {employeesError?.message || warehousesError?.message}
      </p>
    )
  }

  return (
    <EmployeeClientPage
      initialEmployees={employees || []}
      warehouses={warehouses || []}
    />
  )
}
