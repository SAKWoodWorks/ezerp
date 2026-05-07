"use server"

/**
 * Import Shipments Actions
 * การจัดการการนำเข้าสินค้า (ไม้สนจากรัสเซีย)
 *
 * This file contains server actions for managing import shipments
 * ไฟล์นี้ประกอบด้วย server actions สำหรับจัดการการนำเข้าสินค้า
 */

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Type definition for Import Shipment
// ประเภทข้อมูลสำหรับการนำเข้าสินค้า
export type ImportShipment = {
  id: number
  shipment_number: string
  supplier_id: number | null
  origin_country: string
  origin_port: string | null
  destination_port: string | null
  product_id: number | null
  product_name: string | null
  product_description: string | null
  quantity: number
  unit: string
  weight_kg: number | null
  volume_m3: number | null
  currency: string
  unit_price: number | null
  total_value: number | null
  freight_cost: number | null
  insurance_cost: number | null
  customs_duty: number | null
  other_charges: number | null
  total_landed_cost: number | null
  incoterm: string
  container_number: string | null
  container_type: string | null
  seal_number: string | null
  vessel_name: string | null
  voyage_number: string | null
  shipping_line: string | null
  bl_number: string | null
  order_date: string | null
  estimated_departure_date: string | null
  actual_departure_date: string | null
  estimated_arrival_date: string | null
  actual_arrival_date: string | null
  customs_clearance_date: string | null
  warehouse_receipt_date: string | null
  status: string
  customs_status: string
  tracking_url: string | null
  documents: unknown
  notes: string | null
  internal_notes: string | null
  warehouse_id: number | null
  received_by: number | null
  created_at: string
  updated_at: string
  suppliers?: { name: string; contact_person?: string; email?: string; phone?: string; id?: number }
  products?: { name: string; sku: string; stock_quantity?: number; id?: number }
  warehouses?: { name: string; id?: number }
  employees?: { full_name: string; id?: number }
}

/**
 * Get all import shipments
 * ดึงข้อมูลการนำเข้าสินค้าทั้งหมด
 */
export async function getImportShipments() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("import_shipments")
    .select(`
      *,
      suppliers (name),
      products (name, sku),
      warehouses (name),
      employees:received_by (full_name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching import shipments:", error)
    return []
  }

  return data as ImportShipment[]
}

/**
 * Get single import shipment by ID
 * ดึงข้อมูลการนำเข้าสินค้าตาม ID
 */
export async function getImportShipmentById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("import_shipments")
    .select(`
      *,
      suppliers (id, name, contact_person, email, phone),
      products (id, name, sku, stock_quantity),
      warehouses (id, name),
      employees:received_by (id, full_name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching import shipment:", error)
    return null
  }

  return data as ImportShipment
}

/**
 * Create new import shipment
 * สร้างรายการนำเข้าสินค้าใหม่
 */
export async function createImportShipment(formData: FormData) {
  const supabase = await createClient()

  // Get current user / ดึงข้อมูลผู้ใช้ปัจจุบัน
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  // Generate shipment number / สร้างเลขที่การนำเข้า
  const { data: shipmentNumber } = await supabase.rpc(
    "generate_import_shipment_number"
  )

  const shipmentData = {
    shipment_number: shipmentNumber,
    supplier_id: formData.get("supplier_id")
      ? Number(formData.get("supplier_id"))
      : null,
    origin_country: formData.get("origin_country") || "Russia",
    origin_port: formData.get("origin_port"),
    destination_port: formData.get("destination_port") || "Thailand",
    product_id: formData.get("product_id")
      ? Number(formData.get("product_id"))
      : null,
    product_name: formData.get("product_name"),
    product_description: formData.get("product_description"),
    quantity: Number(formData.get("quantity")),
    unit: formData.get("unit") || "m³",
    weight_kg: formData.get("weight_kg")
      ? Number(formData.get("weight_kg"))
      : null,
    volume_m3: formData.get("volume_m3")
      ? Number(formData.get("volume_m3"))
      : null,
    currency: formData.get("currency") || "USD",
    unit_price: formData.get("unit_price")
      ? Number(formData.get("unit_price"))
      : null,
    total_value: formData.get("total_value")
      ? Number(formData.get("total_value"))
      : null,
    freight_cost: formData.get("freight_cost")
      ? Number(formData.get("freight_cost"))
      : null,
    insurance_cost: formData.get("insurance_cost")
      ? Number(formData.get("insurance_cost"))
      : null,
    customs_duty: formData.get("customs_duty")
      ? Number(formData.get("customs_duty"))
      : null,
    other_charges: formData.get("other_charges")
      ? Number(formData.get("other_charges"))
      : null,
    incoterm: formData.get("incoterm") || "CIF",
    container_number: formData.get("container_number"),
    container_type: formData.get("container_type"),
    seal_number: formData.get("seal_number"),
    vessel_name: formData.get("vessel_name"),
    voyage_number: formData.get("voyage_number"),
    shipping_line: formData.get("shipping_line"),
    bl_number: formData.get("bl_number"),
    order_date: formData.get("order_date"),
    estimated_departure_date: formData.get("estimated_departure_date"),
    estimated_arrival_date: formData.get("estimated_arrival_date"),
    tracking_url: formData.get("tracking_url"),
    notes: formData.get("notes"),
    internal_notes: formData.get("internal_notes"),
    warehouse_id: formData.get("warehouse_id")
      ? Number(formData.get("warehouse_id"))
      : null,
    status: "pending",
    customs_status: "pending",
    created_by: user.id,
  }

  const { error } = await supabase.from("import_shipments").insert(shipmentData)

  if (error) {
    console.error("Error creating import shipment:", error)
    return redirect("/import-shipments?message=Error creating shipment")
  }

  revalidatePath("/import-shipments")
  redirect("/import-shipments")
}

/**
 * Update import shipment
 * อัปเดตข้อมูลการนำเข้าสินค้า
 */
export async function updateImportShipment(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const updateData = {
    supplier_id: formData.get("supplier_id")
      ? Number(formData.get("supplier_id"))
      : null,
    origin_country: formData.get("origin_country"),
    origin_port: formData.get("origin_port"),
    destination_port: formData.get("destination_port"),
    product_id: formData.get("product_id")
      ? Number(formData.get("product_id"))
      : null,
    product_name: formData.get("product_name"),
    product_description: formData.get("product_description"),
    quantity: Number(formData.get("quantity")),
    unit: formData.get("unit"),
    weight_kg: formData.get("weight_kg")
      ? Number(formData.get("weight_kg"))
      : null,
    volume_m3: formData.get("volume_m3")
      ? Number(formData.get("volume_m3"))
      : null,
    currency: formData.get("currency"),
    unit_price: formData.get("unit_price")
      ? Number(formData.get("unit_price"))
      : null,
    total_value: formData.get("total_value")
      ? Number(formData.get("total_value"))
      : null,
    freight_cost: formData.get("freight_cost")
      ? Number(formData.get("freight_cost"))
      : null,
    insurance_cost: formData.get("insurance_cost")
      ? Number(formData.get("insurance_cost"))
      : null,
    customs_duty: formData.get("customs_duty")
      ? Number(formData.get("customs_duty"))
      : null,
    other_charges: formData.get("other_charges")
      ? Number(formData.get("other_charges"))
      : null,
    incoterm: formData.get("incoterm"),
    container_number: formData.get("container_number"),
    container_type: formData.get("container_type"),
    seal_number: formData.get("seal_number"),
    vessel_name: formData.get("vessel_name"),
    voyage_number: formData.get("voyage_number"),
    shipping_line: formData.get("shipping_line"),
    bl_number: formData.get("bl_number"),
    order_date: formData.get("order_date"),
    estimated_departure_date: formData.get("estimated_departure_date"),
    actual_departure_date: formData.get("actual_departure_date"),
    estimated_arrival_date: formData.get("estimated_arrival_date"),
    actual_arrival_date: formData.get("actual_arrival_date"),
    customs_clearance_date: formData.get("customs_clearance_date"),
    warehouse_receipt_date: formData.get("warehouse_receipt_date"),
    status: formData.get("status"),
    customs_status: formData.get("customs_status"),
    tracking_url: formData.get("tracking_url"),
    notes: formData.get("notes"),
    internal_notes: formData.get("internal_notes"),
    warehouse_id: formData.get("warehouse_id")
      ? Number(formData.get("warehouse_id"))
      : null,
    received_by: formData.get("received_by")
      ? Number(formData.get("received_by"))
      : null,
  }

  const { error } = await supabase
    .from("import_shipments")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("Error updating import shipment:", error)
    return redirect(`/import-shipments/${id}?message=Error updating shipment`)
  }

  revalidatePath(`/import-shipments/${id}`)
  revalidatePath("/import-shipments")
  redirect(`/import-shipments/${id}`)
}

/**
 * Delete import shipment
 * ลบรายการนำเข้าสินค้า
 */
export async function deleteImportShipment(id: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase.from("import_shipments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting import shipment:", error)
    return redirect(`/import-shipments?message=Error deleting shipment`)
  }

  revalidatePath("/import-shipments")
  redirect("/import-shipments")
}

/**
 * Update shipment status
 * อัปเดตสถานะการนำเข้าสินค้า
 */
export async function updateShipmentStatus(id: number, status: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase
    .from("import_shipments")
    .update({ status })
    .eq("id", id)

  if (error) {
    console.error("Error updating shipment status:", error)
    return
  }

  revalidatePath(`/import-shipments/${id}`)
  revalidatePath("/import-shipments")
}

/**
 * Update customs status
 * อัปเดตสถานะศุลกากร
 */
export async function updateCustomsStatus(id: number, customsStatus: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase
    .from("import_shipments")
    .update({ customs_status: customsStatus })
    .eq("id", id)

  if (error) {
    console.error("Error updating customs status:", error)
    return
  }

  revalidatePath(`/import-shipments/${id}`)
  revalidatePath("/import-shipments")
}
