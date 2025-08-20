"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type CashBillItem = {
  description: string
  quantity: number
  unitPrice: number
}

export async function addCashBill(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const itemsString = formData.get("items") as string
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

  const customerIdStr = formData.get("customerId") as string | null
  const responsiblePersonIdStr = formData.get("responsiblePersonId") as
    | string
    | null
  const warehouseIdStr = formData.get("warehouseId") as string | null

  if (!warehouseIdStr) {
    return { error: "Please select a warehouse to deduct stock from." }
  }

  const billData = {
    p_customer_id: customerIdStr ? Number(customerIdStr) : null,
    p_responsible_person_id: responsiblePersonIdStr
      ? Number(responsiblePersonIdStr)
      : null,
    p_issue_date: formData.get("issueDate") as string,
    p_items: items,
    p_warehouse_id: Number(warehouseIdStr),
  }

  const { data: newBillId, error } = await supabase.rpc(
    "create_cash_bill_and_process",
    billData
  )

  if (error) {
    console.error("Error creating cash bill:", error)
    return { error: error.message || "Could not create cash bill." }
  }

  revalidatePath("/cash-bills")
  revalidatePath("/products")
  revalidatePath("/accounting")
  revalidatePath("/dashboard")

  redirect(`/cash-bills/${newBillId}`)
}
