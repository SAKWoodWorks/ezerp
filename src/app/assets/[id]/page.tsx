import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import AssetDetailPageClient from "./AssetDetailPageClient"

// type Props = {
//   params: { id: string }
// }

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // *** แก้ไข: ดึงข้อมูล asset และ warehouses ทั้งหมดพร้อมกัน ***
  const [assetData, warehousesData] = await Promise.all([
    supabase
      .from("office_assets")
      .select(
        `
        *,
        asset_assignments (
          id,
          assignment_date,
          return_date,
          employees ( id, full_name )
        )
      `
      )
      .eq("id", id)
      .order("assignment_date", {
        referencedTable: "asset_assignments",
        ascending: false,
      })
      .single(),
    supabase.from("warehouses").select("id, name"), // เพิ่มการดึงข้อมูลคลังสินค้า
  ])

  const { data: asset, error: assetError } = assetData
  const { data: warehouses, error: warehousesError } = warehousesData

  if (assetError || !asset || warehousesError) {
    console.error({ assetError, warehousesError })
    notFound()
  }

  // ส่งข้อมูลทั้ง asset และ warehouses ไปให้ Client Component
  return <AssetDetailPageClient asset={asset} warehouses={warehouses || []} />
}
