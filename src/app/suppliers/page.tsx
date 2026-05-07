import { createClient } from "@/lib/supabase/server"
import SupplierClientPage from "./SupplierClientPage"

export default async function SuppliersPage() {
  const supabase = await createClient()

  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching suppliers:", error)
    return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลซัพพลายเออร์</p>
  }

  return <SupplierClientPage initialSuppliers={suppliers || []} />
}
