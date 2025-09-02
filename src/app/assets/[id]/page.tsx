import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import AssetDetailPageClient from "./AssetDetailPageClient"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch asset, warehouses, user data and repair history concurrently
  const [assetData, warehousesData, userData] = await Promise.all([
    supabase
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
        ),
        asset_repairs ( * )
      `
      )
      .eq("id", id)
      .single(), // Simplified query by removing ordering here
    supabase.from("warehouses").select("id, name"),
    supabase.auth.getUser(),
  ])

  const { data: asset, error: assetError } = assetData
  const { data: warehouses, error: warehousesError } = warehousesData
  const {
    data: { user },
    error: userError,
  } = userData

  // Handle errors - include user error in error checking
  if (assetError || !asset || warehousesError || userError) {
    console.error({ assetError, warehousesError, userError })
    notFound()
  }

  return (
    <AssetDetailPageClient
      asset={asset}
      warehouses={warehouses || []}
      user={user}
    />
  )
}
