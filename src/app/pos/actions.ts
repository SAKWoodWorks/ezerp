"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type POSItem = {
  productId: number | null
  description: string
  quantity: number
  unitPrice: number
  ecommerce_size: number | null
}

export async function createPOSSale(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const warehouseIdStr = formData.get("warehouseId") as string | null
  if (!warehouseIdStr) return { error: "Please select a warehouse." }

  let items: POSItem[]
  try {
    items = JSON.parse(formData.get("items") as string)
    if (items.length === 0) return { error: "Please add at least one item." }
  } catch {
    return { error: "Invalid items data." }
  }

  const paymentMethod = formData.get("paymentMethod") as string
  const slipUrl = formData.get("slipUrl") as string | null

  const billData = {
    p_customer_id: Number(formData.get("customerId")) || null,
    p_responsible_person_id:
      Number(formData.get("responsiblePersonId")) || null,
    p_issue_date: formData.get("issueDate") as string,
    p_items: items,
    p_warehouse_id: Number(warehouseIdStr),
    p_sales_channel: "POS",
  }

  const { data: newBillId, error } = await supabase.rpc(
    "create_cash_bill_and_process",
    billData
  )

  if (error) {
    console.error("Error creating POS sale:", error)
    return { error: error.message || "Could not create sale." }
  }

  if (paymentMethod || slipUrl) {
    await supabase
      .from("cash_bills")
      .update({
        payment_method: paymentMethod,
        ...(slipUrl ? { payment_slip_url: slipUrl } : {}),
      })
      .eq("id", newBillId)
  }

  revalidatePath("/cash-bills")
  revalidatePath("/products")
  redirect(`/cash-bills/${newBillId}`)
}

export async function uploadPaymentSlip(
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { url: null, error: "Authentication required" }

  const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
  const { error: uploadError } = await supabase.storage
    .from("payment-slips")
    .upload(fileName, file, { upsert: false, contentType: file.type })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage
    .from("payment-slips")
    .getPublicUrl(fileName)
  return { url: data.publicUrl, error: null }
}
