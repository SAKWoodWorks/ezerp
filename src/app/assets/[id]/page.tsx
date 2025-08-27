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

  // ดึงข้อมูลทรัพย์สินชิ้นเดียว พร้อมกับประวัติการเบิกจ่ายและชื่อพนักงานที่เกี่ยวข้องทั้งหมด
  const { data: asset, error } = await supabase
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
    .single()

  if (error || !asset) {
    notFound()
  }

  // ส่งข้อมูลที่ดึงได้ไปให้ Client Component เพื่อแสดงผล
  return <AssetDetailPageClient asset={asset} />
}
