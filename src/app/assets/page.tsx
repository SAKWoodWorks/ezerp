import { createClient } from "@/lib/supabase/server"
import AssetClientPage from "./AssetClientPage"

export default async function AssetsPage() {
  const supabase = await createClient()

  // Fetch assets and employees in parallel
  const [assetsData, employeesData, warehousesData] = await Promise.all([
    supabase
      .from("office_assets")
      .select(
        `
        *,
        asset_assignments (
          id,
          assignment_date,
          return_date,
          employee_id
        )
      `
      )
      .order("created_at", { ascending: false }),
    // *** CORRECTED: Select 'first_name', 'last_name' instead of 'name' ***
    supabase.from("employees").select("id, full_name"),
    supabase.from("warehouses").select("id, name"), // เพิ่มการดึงข้อมูลคลังสินค้า
  ])

  const { data: assets, error: assetsError } = assetsData
  const { data: employees, error: employeesError } = employeesData
  const { data: warehouses, error: warehousesError } = warehousesData // รับข้อมูลคลังสินค้า

  if (assetsError || employeesError || warehousesError) {
    console.error({ assetsError, employeesError })
    return <p className="p-8">Error loading asset data.</p>
  }

  return (
    <AssetClientPage
      initialAssets={assets || []}
      employees={employees || []}
      warehouses={warehouses || []} // ส่งข้อมูลคลังสินค้าไปให้ Client Component
    />
  )
}
