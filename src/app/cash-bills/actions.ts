"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// กำหนด Type ของข้อมูลรายการสินค้าให้ตรงกับที่ส่งมาจาก Client
type CashBillItem = {
  productId: number | null
  description: string
  quantity: number
  unitPrice: number
  ecommerce_size: number | null
}

export async function addCashBill(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  // --- 1. ดึงข้อมูลจาก FormData ---
  const itemsString = formData.get("items") as string
  const salesChannel = formData.get("salesChannel") as string
  const warehouseIdStr = formData.get("warehouseId") as string | null

  // --- 2. ตรวจสอบข้อมูลเบื้องต้น ---
  if (!warehouseIdStr) {
    return { error: "Please select a warehouse to deduct stock from." }
  }

  let items: CashBillItem[]
  try {
    items = JSON.parse(itemsString)
    if (items.length === 0) {
      return { error: "Please add at least one item." }
    }
  } catch (e) {
    console.error("Error parsing items data:", e)
    return { error: "Invalid items data." }
  }

  // --- 3. เตรียมข้อมูลเพื่อส่งให้ฟังก์ชัน RPC ใน Supabase ---
  const billData = {
    p_customer_id: Number(formData.get("customerId")) || null,
    p_responsible_person_id:
      Number(formData.get("responsiblePersonId")) || null,
    p_issue_date: formData.get("issueDate") as string,
    p_items: items, // ส่งข้อมูล items ทั้ง Array ที่มี productId และ ecommerce_size
    p_warehouse_id: Number(warehouseIdStr),
    p_sales_channel: salesChannel,
  }

  // --- 4. เรียกใช้ฟังก์ชัน RPC ที่เราอัปเดตแล้วใน Supabase ---
  const { data: newBillId, error } = await supabase.rpc(
    "create_cash_bill_and_process",
    billData
  )

  if (error) {
    console.error("Error creating cash bill:", error)
    return { error: error.message || "Could not create cash bill." }
  }

  // --- 5. Revalidate Path เพื่อให้หน้าเว็บแสดงข้อมูลล่าสุด ---
  revalidatePath("/cash-bills")
  revalidatePath("/products") // สำคัญ: ต้อง revalidate หน้าสินค้าเพื่อให้เห็นสต็อกที่อัปเดต
  revalidatePath("/dashboard")

  // --- 6. Redirect ไปยังหน้ารายละเอียดใบเสร็จที่เพิ่งสร้าง ---
  redirect(`/cash-bills/${newBillId}`)
}
