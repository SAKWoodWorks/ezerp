"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ... (โค้ดฟังก์ชันอื่นๆ เช่น addAsset, updateAsset) ...
export async function addAsset(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const { data: nextAssetTag, error: rpcError } = await supabase
    .rpc("generate_next_asset_tag")
    .single()

  if (rpcError || !nextAssetTag) {
    console.error("Error generating asset tag:", rpcError)
    return { error: "Could not generate a new asset tag." }
  }

  const serialNumber = formData.get("serial_number") as string
  const warehouseId = formData.get("warehouseId") as string
  const type = formData.get("type") as string

  // *** CORRECTED VALIDATION LOGIC HERE ***
  // Check for the presence of required fields directly from the form data.
  if (!type || !warehouseId) {
    return { error: "Type and Warehouse are required." }
  }

  const assetData = {
    asset_tag: nextAssetTag,
    type: type,
    model: formData.get("model") as string,
    serial_number: serialNumber || null,
    purchase_date: (formData.get("purchase_date") as string) || null,
    purchase_price: Number(formData.get("purchase_price")),
    notes: formData.get("notes") as string,
    warehouse_id: Number(warehouseId),
  }

  const { error } = await supabase.from("office_assets").insert(assetData)

  if (error) {
    console.error("Error adding asset:", error)
    return { error: "Could not add asset." }
  }

  revalidatePath("/assets")
  return { success: true }
}

// Action to update an existing asset's details
export async function updateAsset(assetId: number, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const serialNumber = formData.get("serial_number") as string
  const warehouseId = formData.get("warehouseId") as string
  const type = formData.get("type") as string

  // *** CORRECTED VALIDATION LOGIC HERE ***
  if (!type || !warehouseId) {
    return { error: "Type and Warehouse are required." }
  }

  const assetData = {
    type: type,
    model: formData.get("model") as string,
    serial_number: serialNumber || null,
    purchase_date: (formData.get("purchase_date") as string) || null,
    purchase_price: Number(formData.get("purchase_price")),
    notes: formData.get("notes") as string,
    warehouse_id: Number(warehouseId),
  }

  const { error } = await supabase
    .from("office_assets")
    .update(assetData)
    .eq("id", assetId)

  if (error) {
    console.error("Error updating asset:", error)
    return { error: "Could not update asset details." }
  }

  revalidatePath("/assets")
  revalidatePath(`/assets/${assetId}`)
  return { success: true }
}

// ... (assignAsset, returnAsset, updateAssetStatus functions remain the same)
export async function assignAsset(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const assetId = Number(formData.get("assetId"))
  const employeeId = Number(formData.get("employeeId"))

  if (!assetId || !employeeId) {
    return { error: "Asset and Employee are required." }
  }

  const { error: assignmentError } = await supabase
    .from("asset_assignments")
    .insert({
      asset_id: assetId,
      employee_id: employeeId,
      assignment_date: new Date().toISOString(),
    })

  if (assignmentError) {
    console.error("Error creating assignment:", assignmentError)
    return { error: "Could not create assignment record." }
  }

  const { error: assetUpdateError } = await supabase
    .from("office_assets")
    .update({ status: "Assigned" })
    .eq("id", assetId)

  if (assetUpdateError) {
    console.error("Error updating asset status:", assetUpdateError)
    return { error: "Assignment created, but failed to update asset status." }
  }

  revalidatePath("/assets")
  revalidatePath(`/assets/${assetId}`)
  revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}

export async function returnAsset(assignmentId: number, assetId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const { error: assignmentError } = await supabase
    .from("asset_assignments")
    .update({ return_date: new Date().toISOString() })
    .eq("id", assignmentId)

  if (assignmentError) {
    console.error("Error updating assignment:", assignmentError)
    return { error: "Could not update assignment record." }
  }

  const { error: assetUpdateError } = await supabase
    .from("office_assets")
    .update({ status: "In Stock" })
    .eq("id", assetId)

  if (assetUpdateError) {
    console.error("Error updating asset status:", assetUpdateError)
    return { error: "Assignment updated, but failed to update asset status." }
  }

  revalidatePath("/assets")
  revalidatePath(`/assets/${assetId}`)
  return { success: true }
}

export async function updateAssetStatus(assetId: number, newStatus: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const allowedStatuses = ["In Stock", "In Repair", "Retired"]
  if (!allowedStatuses.includes(newStatus)) {
    return { error: "Invalid status provided." }
  }

  const { data: activeAssignment, error: checkError } = await supabase
    .from("asset_assignments")
    .select("id")
    .eq("asset_id", assetId)
    .is("return_date", null)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking assignment:", checkError)
    return { error: "Could not verify asset assignment status." }
  }

  if (activeAssignment) {
    return {
      error:
        "Cannot change status. Asset is currently assigned to an employee.",
    }
  }

  const { error } = await supabase
    .from("office_assets")
    .update({ status: newStatus })
    .eq("id", assetId)

  if (error) {
    console.error("Error updating asset status:", error)
    return { error: "Could not update asset status." }
  }

  revalidatePath("/assets")
  revalidatePath(`/assets/${assetId}`)
  return { success: true }
}

export async function addRepairHistory(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const assetId = Number(formData.get("assetId"))

  const repairData = {
    asset_id: assetId,
    repair_date_in: formData.get("repair_date_in") as string,
    repair_date_out: (formData.get("repair_date_out") as string) || null,
    description: formData.get("description") as string,
    repair_notes: formData.get("repair_notes") as string,
    repair_shop: (formData.get("repair_shop") as string) || null,
    cost: Number(formData.get("cost")),
  }

  if (!repairData.asset_id || !repairData.repair_date_in) {
    return { error: "Asset ID and repair date are required." }
  }

  const { error } = await supabase.from("asset_repairs").insert(repairData)

  if (error) {
    console.error("Error adding repair history:", error)
    return { error: "Could not add repair history." }
  }

  revalidatePath(`/assets/${assetId}`)
  return { success: true }
}
