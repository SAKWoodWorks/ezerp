import { createPublicServerClient } from "@/lib/supabase/public-server"
import { notFound } from "next/navigation"
import AssetPublicView from "./AssetPublicView"

// บรรทัดนี้จะสั่งให้ Next.js ไม่ใช้ Cache กับหน้านี้เด็ดขาด
// และดึงข้อมูลใหม่ทุกครั้งที่มีการเรียกเข้ามา
export const revalidate = 0

// interface PageProps {
//   params: { id: string }
// }

export default async function AssetPublicPage(props: {
  params: Promise<{ id: string }>
}) {
  //export default async function AssetPublicPage({ params }: PageProps) {
  const params = await props.params
  const { id } = params
  const supabase = createPublicServerClient()

  const { data: asset, error } = await supabase
    .from("office_assets")
    .select(
      `
      *,
      warehouses ( name ),
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
    console.error("Public asset page fetch error:", error)
    notFound()
  }

  return <AssetPublicView asset={asset} />
}
