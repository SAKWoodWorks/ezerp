"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import ExcelJS from "exceljs"

/**
 * ฟังก์ชันสำหรับเพิ่มซัพพลายเออร์ใหม่เข้าระบบ
 * Function to add a new supplier to the system
 */
export async function addSupplier(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const supplierData = {
    name: formData.get("name") as string,
    tax_id: formData.get("taxId") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    line_id: formData.get("lineId") as string,
    contact_person: formData.get("contactPerson") as string,
    notes: formData.get("notes") as string,
  }

  const { error } = await supabase.from("suppliers").insert(supplierData)

  if (error) {
    console.error("Supabase error adding supplier:", error)
    return redirect("/suppliers?message=Error: Could not add supplier.")
  }

  await revalidatePath("/suppliers")
  redirect("/suppliers")
}

/**
 * ฟังก์ชันสำหรับแก้ไขข้อมูลซัพพลายเออร์ที่มีอยู่แล้ว
 * Function to update existing supplier information
 */
export async function updateSupplier(supplierId: number, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login?message=Authentication required")
  }

  const supplierData = {
    name: formData.get("name") as string,
    tax_id: formData.get("taxId") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    line_id: formData.get("lineId") as string,
    contact_person: formData.get("contactPerson") as string,
    notes: formData.get("notes") as string,
  }

  const { error } = await supabase
    .from("suppliers")
    .update(supplierData)
    .eq("id", supplierId)

  if (error) {
    console.error("Supabase error updating supplier:", error)
    return redirect(
      `/suppliers/${supplierId}?message=Error: Could not update supplier.`
    )
  }

  await revalidatePath(`/suppliers`)
  await revalidatePath(`/suppliers/${supplierId}`)
  redirect(`/suppliers`)
}

/**
 * ฟังก์ชันสำหรับลบข้อมูลซัพพลายเออร์
 * Function to delete supplier
 */
export async function deleteSupplier(supplierId: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", supplierId)

  if (error) {
    console.error("Supabase error deleting supplier:", error)
    redirect(`/suppliers?message=Error deleting supplier`)
  }

  await revalidatePath("/suppliers")
  redirect("/suppliers")
}

interface SupplierData {
  name: string
  tax_id: string
  address: string
  phone: string
  email: string
  line_id: string
  contact_person: string
  notes: string
}

/**
 * ฟังก์ชันสำหรับนำเข้าข้อมูลซัพพลายเออร์จากไฟล์ Excel
 * Function to import suppliers from Excel file
 */
export async function importSuppliers(fileBase64: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  try {
    const buffer = Buffer.from(fileBase64, "base64")
    const workbook = new ExcelJS.Workbook()
    // @ts-expect-error: Buffer<ArrayBufferLike> vs Buffer mismatch between @types/node and exceljs types
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return { error: "File is empty or has no worksheets." }
    }

    const data: SupplierData[] = []
    const headers: string[] = []

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => {
          headers.push(String(cell.value).toLowerCase().trim())
        })
      } else {
        const rowData: any = {}
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1]
          rowData[header] = cell.value
        })
        data.push(rowData as SupplierData)
      }
    })

    if (data.length === 0) {
      return { error: "File is empty or has incorrect format." }
    }

    const suppliersToInsert = data.map((row) => ({
      name: row.name,
      tax_id: row.tax_id || null,
      phone: row.phone ? String(row.phone) : null,
      email: row.email || null,
      line_id: row.line_id || null,
      address: row.address || null,
      contact_person: row.contact_person || null,
      notes: row.notes || null,
    }))

    const { error, count } = await supabase
      .from("suppliers")
      .insert(suppliersToInsert)

    if (error) {
      console.error("Error inserting suppliers:", error)
      return { error: "Failed to import suppliers to the database." }
    }

    revalidatePath("/suppliers")
    return { success: true, count: count ?? 0 }
  } catch (e) {
    console.error("Error processing file:", e)
    return { error: "Invalid file format or data." }
  }
}
