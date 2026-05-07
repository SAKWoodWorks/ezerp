"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import * as XLSX from "@e965/xlsx"

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
  tax_id: string | null
  address: string | null
  phone: string | null
  line_id: string | null
  responsible_person: string | null
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

    let data: CustomerData[]

    if (isCSVData(buffer)) {
      // Parse as CSV
      data = parseCSVData(buffer)
    } else {
      // Parse as Excel (existing logic)
      const workbook = XLSX.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = XLSX.utils.sheet_to_json(worksheet)

      // Map Excel data (existing mapping)
      data = data.map((row: any) => ({
        name: row.name,
        tax_id: row.tax_id || null,
        phone: row.phone ? String(row.phone) : null,
        line_id: row.line_id || null,
        address: row.address || null,
        responsible_person: row.responsible_person || null,
      }))
    }

    if (data.length === 0) {
      return { error: "File is empty or has incorrect format." }
    }

    // Map to insertion format
    const customersToInsert = data.map((row) => ({
      name: row.name,
      tax_id: row.tax_id || null,
      phone: row.phone || null,
      line_id: row.line_id || null,
      address: row.address || null,
      responsible_person: row.responsible_person || null,
    }))

    // Insert data into the database
    const { error, count } = await supabase
      .from("customers")
      .insert(customersToInsert)

    if (error) {
      console.error("Error inserting customers:", error)
      return { error: "Failed to import customers to the database." }
    }

    revalidatePath("/customers")
    return { success: true, count: count ?? 0 }
  } catch (e) {
    console.error("Error processing file:", e)
    return { error: e instanceof Error ? e.message : "Invalid file format or data." }
  }
}

// Helper function to parse CSV line properly handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes ""
        current += '"'
        i += 2
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
        i++
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator outside quotes
      result.push(current.trim())
      current = ''
      i++
    } else {
      current += char
      i++
    }
  }

  result.push(current.trim())
  return result
}

// Helper function to detect if data is CSV
function isCSVData(buffer: Buffer): boolean {
  const str = buffer.toString('utf8', 0, Math.min(2048, buffer.length))
  const lines = str.split('\n')

  if (lines.length < 1) return false

  const firstLine = lines[0]
  // Check for CSV characteristics: commas and customer_name header
  return firstLine.includes(',') &&
         firstLine.includes('customer_name') &&
         !firstLine.includes('<?xml') && // Not XML (Excel)
         !str.includes('PK') // Not ZIP-based format (Excel)
}

// Helper function to parse CSV data
function parseCSVData(buffer: Buffer): CustomerData[] {
  const csvText = buffer.toString('utf8')
  const lines = csvText.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }

  const headers = parseCSVLine(lines[0])
  const dataLines = lines.slice(1)

  return dataLines.map((line, index) => {
    const values = parseCSVLine(line)
    const row: Record<string, string> = {}

    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })

    // Map CSV columns to our schema
    const mapped: CustomerData = {
      name: row.customer_name || '',
      tax_id: row.customer_tax_id || '',
      address: row.customer_address || '',
      phone: row.customer_phone || '',
      line_id: '', // Not available in CSV
      responsible_person: row.customer_branch || '',
    }

    if (!mapped.name) {
      throw new Error(`Row ${index + 2}: missing required field: name`)
    }

    return mapped
  })
}
