"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
}

// --- แก้ไขฟังก์ชันนี้ทั้งหมด ---
// ฟังก์ชันสำหรับหาเลขที่ใบแจ้งหนี้ล่าสุดของปีปัจจุบันและคำนวณเลขถัดไป
export async function generateNextInvoiceNumber() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear().toString().slice(-2) // e.g., "25" for 2025

  // ค้นหาใบแจ้งหนี้ล่าสุดที่ขึ้นต้นด้วย 'INVNo' และปีปัจจุบัน (เช่น 'INVNo25...')
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `INVNo${currentYear}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    // ถ้าไม่เจอ หรือมี Error (อาจจะเพราะเป็นใบแรกของปี) ให้เริ่มนับที่ 1
    return 1
  }

  try {
    // ดึงเฉพาะตัวเลข Running Number 3 หลักออกมา
    // จาก "INVNo25001PW..." -> จะได้ "001"
    const runningNumberStr = data.invoice_number.substring(7, 10)
    const nextNumber = parseInt(runningNumberStr, 10) + 1

    return isNaN(nextNumber) ? 1 : nextNumber
  } catch {
    return 1 // กรณีเกิดข้อผิดพลาดอื่นๆ ให้เริ่มที่ 1
  }
}

// --- แก้ไขฟังก์ชันนี้: รับ invoiceNumber เข้ามาโดยตรง ---
export async function addInvoice(invoiceNumber: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const customerId = formData.get("customerId")
  if (!customerId) {
    return redirect("/invoices/new?message=Error: Please select a customer.")
  }

  const itemsString = formData.get("items") as string
  let items: InvoiceItem[]
  try {
    items = JSON.parse(itemsString)
  } catch (e) {
    console.error("Error parsing items data:", e)
    return redirect("/invoices/new?message=Error: Invalid items data.")
  }

  const invoiceData = {
    customer_id: Number(customerId),
    responsible_person_id: Number(formData.get("responsiblePersonId")),
    price_tier: formData.get("priceTier") as string,
    invoice_number: invoiceNumber, // ใช้เลขที่สร้างจาก Client
    issue_date: formData.get("issueDate") as string,
    due_date: formData.get("dueDate") as string,
    status: "Draft",
    items: items,
  }

  const { data, error } = await supabase
    .from("invoices")
    .insert(invoiceData)
    .select()
    .single()

  if (error) {
    console.error("Error adding invoice:", error)
    return redirect("/invoices/new?message=Error: Could not add invoice.")
  }

  await revalidatePath("/invoices")
  await revalidatePath("/dashboard")
  if (invoiceData.customer_id) {
    await revalidatePath(`/customers/${invoiceData.customer_id}`)
  }

  redirect(`/invoices/${data.id}`)
}

// --- แก้ไขฟังก์ชันนี้ ---
export async function updateInvoiceStatus(
  invoiceId: number,
  newStatus: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { message: "Authentication required" }

  // 1. อัปเดตสถานะของ Invoice ก่อน
  const { error: statusUpdateError } = await supabase
    .from("invoices")
    .update({ status: newStatus })
    .eq("id", invoiceId)

  if (statusUpdateError) {
    console.error("Error updating invoice status:", statusUpdateError)
    return { message: "Error updating status." }
  }

  // 2. ถ้าสถานะที่อัปเดตคือ "Paid" ให้ทำการตัดสต็อก
  if (newStatus === "Paid") {
    const { error: rpcError } = await supabase.rpc(
      "deduct_stock_from_invoice",
      {
        p_invoice_id: invoiceId,
      }
    )

    if (rpcError) {
      console.error("Error deducting stock:", rpcError)
      // Optional: แจ้งเตือนผู้ใช้ว่าตัดสต็อกไม่สำเร็จ แต่สถานะเปลี่ยนแล้ว
      return { message: "Status updated, but failed to deduct stock." }
    }
  }

  // 3. Revalidate path ที่เกี่ยวข้องทั้งหมด
  const { data: invoice } = await supabase
    .from("invoices")
    .select("customer_id")
    .eq("id", invoiceId)
    .single()
  await Promise.all([
    revalidatePath("/reports"),
    revalidatePath("/invoices"),
    revalidatePath(`/invoices/${invoiceId}`),
    revalidatePath("/dashboard"),
    revalidatePath("/products"), // เพิ่มการ revalidate หน้าสินค้า
    invoice?.customer_id
      ? revalidatePath(`/customers/${invoice.customer_id}`)
      : Promise.resolve(),
  ])

  return { message: "Success" }
}

// --- เพิ่มฟังก์ชันนี้ ---
// ฟังก์ชันสำหรับ "แก้ไข" เนื้อหาใบแจ้งหนี้
export async function updateInvoice(invoiceId: number, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const itemsString = formData.get("items") as string
  let items: InvoiceItem[]
  try {
    items = JSON.parse(itemsString)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return redirect(
      `/invoices/${invoiceId}/edit?message=Error: Invalid items data.`
    )
  }

  const invoiceData = {
    customer_id: Number(formData.get("customerId")),
    // --- เพิ่มข้อมูลผู้รับผิดชอบ ---
    responsible_person_id: Number(formData.get("responsiblePersonId")),
    invoice_number: formData.get("invoiceNumber") as string,
    issue_date: formData.get("issueDate") as string,
    due_date: formData.get("dueDate") as string,
    items: items,
    price_tier: formData.get("priceTier") as string,
  }

  const { error } = await supabase
    .from("invoices")
    .update(invoiceData)
    .eq("id", invoiceId)

  if (error) {
    console.error("Error updating invoice:", error)
    return redirect(
      `/invoices/${invoiceId}/edit?message=Error: Could not update invoice.`
    )
  }

  await revalidatePath("/invoices")
  await revalidatePath(`/invoices/${invoiceId}`)
  await revalidatePath(`/customers/${invoiceData.customer_id}`)
  await revalidatePath("/dashboard")

  redirect(`/invoices/${invoiceId}`)
}

// --- เพิ่มฟังก์ชันนี้ ---
// ฟังก์ชันสำหรับ "ลบ" ใบแจ้งหนี้
export async function deleteInvoice(invoiceId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId)

  if (error) {
    console.error("Error deleting invoice:", error)
    return redirect(`/invoices?message=Error: Could not delete invoice.`)
  }

  await revalidatePath("/invoices")
  await revalidatePath("/dashboard")

  redirect("/invoices")
}

// --- ฟังก์ชันสำหรับแปลงใบเสนอราคาเป็นใบแจ้งหนี้ ---
export async function createInvoiceFromQuotation(quotationId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  // 1. ดึงข้อมูลจากใบเสนอราคาต้นทาง
  const { data: quotation, error: quotationError } = await supabase
    .from("quotations")
    .select("*")
    .eq("id", quotationId)
    .single()

  if (quotationError || !quotation) {
    return { error: "Quotation not found." }
  }

  // 2. เตรียมข้อมูลสำหรับสร้าง Invoice ใหม่
  // --- แก้ไขที่นี่: สร้างเลขที่ใบแจ้งหนี้ใหม่จากเลขที่ใบเสนอราคาเดิม ---
  const newInvoiceNumber = `INV${quotation.quotation_number}`

  const today = new Date()
  const dueDate = new Date()
  dueDate.setDate(today.getDate() + 30) // กำหนดวันครบกำหนดชำระ +30 วัน

  const invoiceData = {
    customer_id: quotation.customer_id,
    responsible_person_id: quotation.responsible_person_id,
    invoice_number: newInvoiceNumber, // ใช้เลขที่ใหม่ที่สร้างขึ้น
    issue_date: today.toISOString().split("T")[0],
    due_date: dueDate.toISOString().split("T")[0],
    status: "Draft",
    items: quotation.items,
    price_tier: quotation.price_tier, // อย่าลืมนำ price_tier มาด้วย
  }

  // 3. บันทึก Invoice ใหม่ลงฐานข้อมูล
  const { data: newInvoice, error: insertError } = await supabase
    .from("invoices")
    .insert(invoiceData)
    .select()
    .single()

  if (insertError) {
    console.error("Error creating invoice from quotation:", insertError)
    return { error: "Could not create invoice." }
  }

  // 4. ล้าง Cache หน้าที่เกี่ยวข้อง
  await revalidatePath("/invoices")
  await revalidatePath("/dashboard")

  // 5. ส่งกลับ ID ของ Invoice ที่สร้างใหม่เพื่อ Redirect
  return { success: true, newInvoiceId: newInvoice.id }
}

// ฟังก์ชันใหม่สำหรับสร้างใบเสร็จจากใบแจ้งหนี้
export async function createReceiptFromInvoiceAction(invoiceId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const { data, error } = await supabase.rpc("create_receipt_from_invoice", {
    p_invoice_id: invoiceId,
  })

  if (error) {
    console.error("Error from RPC create_receipt_from_invoice:", error)
    return { error: error.message || "Failed to create receipt." }
  }

  revalidatePath("/cash-bills")

  return { success: true, newReceiptId: data }
}
