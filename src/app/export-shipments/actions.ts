"use server"

/**
 * Export Shipments Actions
 * การจัดการการส่งออกสินค้า (ไม้สักไปต่างประเทศ)
 *
 * This file contains server actions for managing export shipments
 * ไฟล์นี้ประกอบด้วย server actions สำหรับจัดการการส่งออกสินค้า
 */

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Type definition for Export Shipment
// ประเภทข้อมูลสำหรับการส่งออกสินค้า
export type ExportShipment = {
  id: number
  shipment_number: string
  customer_id: number | null
  destination_country: string
  destination_port: string | null
  origin_port: string | null
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
  export_duty: number | null
  other_charges: number | null
  total_cost: number | null
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
  delivery_confirmation_date: string | null
  status: string
  export_permit_status: string
  permit_number: string | null
  tracking_url: string | null
  documents: unknown
  notes: string | null
  internal_notes: string | null
  warehouse_id: number | null
  packed_by: number | null
  packing_date: string | null
  invoice_id: number | null
  created_at: string
  updated_at: string
  customers?: { name: string; contact_person?: string; email?: string; phone?: string; id?: number }
  products?: { name: string; sku: string; stock_quantity?: number; id?: number }
  warehouses?: { name: string; id?: number }
  employees?: { full_name: string; id?: number }
  invoices?: { invoice_number: string; id?: number }
}

/**
 * Get all export shipments
 * ดึงข้อมูลการส่งออกสินค้าทั้งหมด
 */
export async function getExportShipments() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("export_shipments")
    .select(`
      *,
      customers (name),
      products (name, sku),
      warehouses (name),
      employees:packed_by (full_name),
      invoices (invoice_number)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching export shipments:", error)
    return []
  }

  return data as ExportShipment[]
}

/**
 * Get single export shipment by ID
 * ดึงข้อมูลการส่งออกสินค้าตาม ID
 */
export async function getExportShipmentById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("export_shipments")
    .select(`
      *,
      customers (id, name, contact_person, email, phone),
      products (id, name, sku, stock_quantity),
      warehouses (id, name),
      employees:packed_by (id, full_name),
      invoices (id, invoice_number)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching export shipment:", error)
    return null
  }

  return data as ExportShipment
}

/**
 * Create new export shipment
 * สร้างรายการส่งออกสินค้าใหม่
 */
export async function createExportShipment(formData: FormData) {
  const supabase = await createClient()

  // Get current user / ดึงข้อมูลผู้ใช้ปัจจุบัน
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  // Generate shipment number / สร้างเลขที่การส่งออก
  const { data: shipmentNumber } = await supabase.rpc(
    "generate_export_shipment_number"
  )

  const shipmentData = {
    shipment_number: shipmentNumber,
    customer_id: formData.get("customer_id")
      ? Number(formData.get("customer_id"))
      : null,
    destination_country: formData.get("destination_country"),
    destination_port: formData.get("destination_port"),
    origin_port: formData.get("origin_port") || "Thailand",
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
    export_duty: formData.get("export_duty")
      ? Number(formData.get("export_duty"))
      : null,
    other_charges: formData.get("other_charges")
      ? Number(formData.get("other_charges"))
      : null,
    incoterm: formData.get("incoterm") || "FOB",
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
    invoice_id: formData.get("invoice_id")
      ? Number(formData.get("invoice_id"))
      : null,
    status: "pending",
    export_permit_status: "pending",
    created_by: user.id,
  }

  const { error } = await supabase.from("export_shipments").insert(shipmentData)

  if (error) {
    console.error("Error creating export shipment:", error)
    return redirect("/export-shipments?message=Error creating shipment")
  }

  revalidatePath("/export-shipments")
  redirect("/export-shipments")
}

/**
 * Update export shipment
 * อัปเดตข้อมูลการส่งออกสินค้า
 */
export async function updateExportShipment(id: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const updateData = {
    customer_id: formData.get("customer_id")
      ? Number(formData.get("customer_id"))
      : null,
    destination_country: formData.get("destination_country"),
    destination_port: formData.get("destination_port"),
    origin_port: formData.get("origin_port"),
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
    export_duty: formData.get("export_duty")
      ? Number(formData.get("export_duty"))
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
    permit_number: formData.get("permit_number"),
    order_date: formData.get("order_date"),
    estimated_departure_date: formData.get("estimated_departure_date"),
    actual_departure_date: formData.get("actual_departure_date"),
    estimated_arrival_date: formData.get("estimated_arrival_date"),
    actual_arrival_date: formData.get("actual_arrival_date"),
    delivery_confirmation_date: formData.get("delivery_confirmation_date"),
    packing_date: formData.get("packing_date"),
    status: formData.get("status"),
    export_permit_status: formData.get("export_permit_status"),
    tracking_url: formData.get("tracking_url"),
    notes: formData.get("notes"),
    internal_notes: formData.get("internal_notes"),
    warehouse_id: formData.get("warehouse_id")
      ? Number(formData.get("warehouse_id"))
      : null,
    packed_by: formData.get("packed_by")
      ? Number(formData.get("packed_by"))
      : null,
    invoice_id: formData.get("invoice_id")
      ? Number(formData.get("invoice_id"))
      : null,
  }

  const { error } = await supabase
    .from("export_shipments")
    .update(updateData)
    .eq("id", id)

  if (error) {
    console.error("Error updating export shipment:", error)
    return redirect(`/export-shipments/${id}?message=Error updating shipment`)
  }

  revalidatePath(`/export-shipments/${id}`)
  revalidatePath("/export-shipments")
  redirect(`/export-shipments/${id}`)
}

/**
 * Delete export shipment
 * ลบรายการส่งออกสินค้า
 */
export async function deleteExportShipment(id: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase.from("export_shipments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting export shipment:", error)
    return redirect(`/export-shipments?message=Error deleting shipment`)
  }

  revalidatePath("/export-shipments")
  redirect("/export-shipments")
}

/**
 * Update shipment status
 * อัปเดตสถานะการส่งออกสินค้า
 */
export async function updateShipmentStatus(id: number, status: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase
    .from("export_shipments")
    .update({ status })
    .eq("id", id)

  if (error) {
    console.error("Error updating shipment status:", error)
    return
  }

  revalidatePath(`/export-shipments/${id}`)
  revalidatePath("/export-shipments")
}

/**
 * Update export permit status
 * อัปเดตสถานะใบอนุญาตส่งออก
 */
export async function updatePermitStatus(id: number, permitStatus: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase
    .from("export_shipments")
    .update({ export_permit_status: permitStatus })
    .eq("id", id)

  if (error) {
    console.error("Error updating permit status:", error)
    return
  }

  revalidatePath(`/export-shipments/${id}`)
  revalidatePath("/export-shipments")
}
