import { createClient } from "@/lib/supabase/server"
import CustomerClientPage from "./CustomerClientPage"

// เปลี่ยนให้ฟังก์ชันเป็น async เพื่อให้สามารถ await การดึงข้อมูลได้
export default async function CustomersPage() {
  const supabase = await createClient()

  // ดึงข้อมูลลูกค้าทั้งหมดจากตาราง 'customers'
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    // ในระบบจริง ควรแสดง UI สำหรับแจ้งข้อผิดพลาด
    console.error("Error fetching customers:", error)
    return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>
  }

  // ส่งข้อมูลที่ดึงได้จริง (customers) ไปให้ Client Component
  return <CustomerClientPage initialCustomers={customers || []} />
}
