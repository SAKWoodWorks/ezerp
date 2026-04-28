import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import POSTerminal from "./POSTerminal"

export default async function POSPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const t = await getTranslations("POS")

  const [productsRes, customersRes, warehousesRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, barcode, price")
      .order("name"),
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("warehouses").select("id, name").order("name"),
  ])

  return (
    <POSTerminal
      products={productsRes.data ?? []}
      customers={customersRes.data ?? []}
      warehouses={warehousesRes.data ?? []}
      title={t("title")}
    />
  )
}
