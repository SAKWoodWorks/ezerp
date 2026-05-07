import { createClient } from "@/lib/supabase/server"
import PurchaseOrdersClientPage from "./PurchaseOrdersClientPage"

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()

  const { data: purchaseOrders, error } = await supabase
    .from("purchase_orders")
    .select("*, suppliers ( name )")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching purchase orders:", error)
    return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลใบสั่งซื้อ</p>
  }

  return <PurchaseOrdersClientPage initialPurchaseOrders={purchaseOrders || []} />
}
