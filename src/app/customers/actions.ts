"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as XLSX from "xlsx" // 1. Import xlsx library

// ฟังก์ชันสำหรับเพิ่มลูกค้าใหม่
export async function addCustomer(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const customerData = {
    name: formData.get("name") as string,
    tax_id: formData.get("taxId") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    line_id: formData.get("lineId") as string,
    responsible_person: formData.get("responsiblePerson") as string,
  }

  const { error } = await supabase.from("customers").insert(customerData)

  if (error) {
    console.error("Supabase error adding customer:", error)
    return redirect("/customers?message=Error: Could not add customer.")
  }

  await revalidatePath("/customers")
  redirect("/customers")
}

// ฟังก์ชันสำหรับแก้ไขข้อมูลลูกค้า
export async function updateCustomer(customerId: number, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login?message=Authentication required")
  }

  const customerData = {
    name: formData.get("name") as string,
    tax_id: formData.get("taxId") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    line_id: formData.get("lineId") as string,
    responsible_person: formData.get("responsiblePerson") as string,
  }

  const { error } = await supabase
    .from("customers")
    .update(customerData)
    .eq("id", customerId)

  if (error) {
    console.error("Supabase error updating customer:", error)
    return redirect(
      `/customers/${customerId}?message=Error: Could not update customer.`
    )
  }

  // Revalidate Paths เพื่อล้าง Cache
  await revalidatePath(`/customers`)
  await revalidatePath(`/customers/${customerId}`)

  // --- แก้ไขที่นี่ ---
  // Redirect กลับไปหน้ารายชื่อลูกค้าทั้งหมด
  redirect(`/customers`)
}

// ฟังก์ชันสำหรับลบข้อมูลลูกค้า
export async function deleteCustomer(customerId: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId)

  if (error) {
    console.error("Supabase error deleting customer:", error)
    redirect(`/customers?message=Error deleting customer`)
  }

  await revalidatePath("/customers")
  redirect("/customers")
}
interface CustomerData {
  name: string
  tax_id: string
  address: string
  phone: string
  line_id: string
  responsible_person: string
}
// 2. Add the new import function
export async function importCustomers(fileBase64: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  try {
    // Decode the base64 string to a buffer
    const buffer = Buffer.from(fileBase64, "base64")

    // Read the workbook from the buffer
    const workbook = XLSX.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    // Convert sheet to JSON. Assumes first row is headers.
    // Headers should be: name, tax_id, phone, line_id, address
    const data: CustomerData[] = XLSX.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return { error: "File is empty or has incorrect format." }
    }

    // Map JSON data to the format expected by Supabase
    const customersToInsert = data.map((row) => ({
      name: row.name,
      tax_id: row.tax_id || null,
      phone: row.phone ? String(row.phone) : null,
      line_id: row.line_id || null,
      address: row.address || null,
      // You might want to set a default responsible person or leave it null
      // responsible_person_id: 1
    }))

    // Insert data into the database
    const { error, count } = await supabase
      .from("customers")
      .insert(customersToInsert)
    //.select("*", { count: "exact" })

    if (error) {
      console.error("Error inserting customers:", error)
      return { error: "Failed to import customers to the database." }
    }

    revalidatePath("/customers")
    return { success: true, count: count ?? 0 }
  } catch (e) {
    console.error("Error processing file:", e)
    return { error: "Invalid file format or data." }
  }
}
