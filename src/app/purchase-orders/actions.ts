"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

/**
 * ฟังก์ชันสำหรับสร้าง Purchase Order ใหม่
 * Function to create a new Purchase Order
 */
export async function createPurchaseOrder(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  try {
    // Generate PO number
    const { data: poNumberData, error: poNumberError } = await supabase.rpc(
      "generate_po_number"
    )

    if (poNumberError) {
      console.error("Error generating PO number:", poNumberError)
      return redirect("/purchase-orders?message=Error generating PO number")
    }

    // Get form data
    const supplierId = Number(formData.get("supplierId"))
    const orderDate = formData.get("orderDate") as string
    const expectedDeliveryDate = formData.get("expectedDeliveryDate") as string
    const notes = formData.get("notes") as string
    const status = formData.get("status") as string || "draft"
    const itemsJson = formData.get("items") as string

    if (!itemsJson || !supplierId) {
      return redirect("/purchase-orders?message=Missing required fields")
    }

    const items = JSON.parse(itemsJson)

    // Create purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: poNumberData,
        supplier_id: supplierId,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || null,
        status: status,
        notes: notes,
        created_by: user.id,
      })
      .select()
      .single()

    if (poError) {
      console.error("Error creating purchase order:", poError)
      return redirect("/purchase-orders?message=Error creating purchase order")
    }

    // Insert items
    const itemsToInsert = items.map((item: any) => ({
      purchase_order_id: purchaseOrder.id,
      product_id: item.productId || null,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }))

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert)

    if (itemsError) {
      console.error("Error inserting PO items:", itemsError)
      // Rollback: delete the purchase order
      await supabase.from("purchase_orders").delete().eq("id", purchaseOrder.id)
      return redirect("/purchase-orders?message=Error creating purchase order items")
    }

    await revalidatePath("/purchase-orders")
    redirect(`/purchase-orders/${purchaseOrder.id}`)
  } catch (error) {
    console.error("Error in createPurchaseOrder:", error)
    return redirect("/purchase-orders?message=Unexpected error occurred")
  }
}

/**
 * ฟังก์ชันสำหรับอัปเดต Purchase Order
 * Function to update a Purchase Order
 */
export async function updatePurchaseOrder(
  purchaseOrderId: number,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  try {
    const supplierId = Number(formData.get("supplierId"))
    const orderDate = formData.get("orderDate") as string
    const expectedDeliveryDate = formData.get("expectedDeliveryDate") as string
    const notes = formData.get("notes") as string
    const status = formData.get("status") as string
    const itemsJson = formData.get("items") as string

    if (!itemsJson || !supplierId) {
      return redirect(
        `/purchase-orders/${purchaseOrderId}?message=Missing required fields`
      )
    }

    const items = JSON.parse(itemsJson)

    // Update purchase order
    const { error: poError } = await supabase
      .from("purchase_orders")
      .update({
        supplier_id: supplierId,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || null,
        status: status,
        notes: notes,
      })
      .eq("id", purchaseOrderId)

    if (poError) {
      console.error("Error updating purchase order:", poError)
      return redirect(
        `/purchase-orders/${purchaseOrderId}?message=Error updating purchase order`
      )
    }

    // Delete existing items
    await supabase
      .from("purchase_order_items")
      .delete()
      .eq("purchase_order_id", purchaseOrderId)

    // Insert new items
    const itemsToInsert = items.map((item: any) => ({
      purchase_order_id: purchaseOrderId,
      product_id: item.productId || null,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unitPrice),
    }))

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert)

    if (itemsError) {
      console.error("Error updating PO items:", itemsError)
      return redirect(
        `/purchase-orders/${purchaseOrderId}?message=Error updating items`
      )
    }

    await revalidatePath("/purchase-orders")
    await revalidatePath(`/purchase-orders/${purchaseOrderId}`)
    redirect(`/purchase-orders/${purchaseOrderId}`)
  } catch (error) {
    console.error("Error in updatePurchaseOrder:", error)
    return redirect(
      `/purchase-orders/${purchaseOrderId}?message=Unexpected error occurred`
    )
  }
}

/**
 * ฟังก์ชันสำหรับลบ Purchase Order
 * Function to delete a Purchase Order
 */
export async function deletePurchaseOrder(purchaseOrderId: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", purchaseOrderId)

  if (error) {
    console.error("Error deleting purchase order:", error)
    redirect(`/purchase-orders?message=Error deleting purchase order`)
  }

  await revalidatePath("/purchase-orders")
  redirect("/purchase-orders")
}

/**
 * ฟังก์ชันสำหรับอัปเดตสถานะ Purchase Order
 * Function to update Purchase Order status
 */
export async function updatePurchaseOrderStatus(
  purchaseOrderId: number,
  newStatus: string
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: newStatus })
    .eq("id", purchaseOrderId)

  if (error) {
    console.error("Error updating status:", error)
    return { error: "Failed to update status" }
  }

  await revalidatePath("/purchase-orders")
  await revalidatePath(`/purchase-orders/${purchaseOrderId}`)

  return { success: true }
}

/**
 * ฟังก์ชันสำหรับรับสินค้าเข้าสต็อก
 * Function to receive items into inventory
 */
export async function receiveOrderItems(
  purchaseOrderId: number,
  warehouseId: number
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  try {
    // Get PO items with unit price for cost tracking
    const { data: items, error: itemsError } = await supabase
      .from("purchase_order_items")
      .select("product_id, quantity, unit_price, description")
      .eq("purchase_order_id", purchaseOrderId)

    if (itemsError) {
      console.error("Error fetching PO items:", itemsError)
      return { error: "Failed to fetch order items" }
    }

    // Add items to inventory
    for (const item of items) {
      if (item.product_id) {
        // Update warehouse inventory
        const { error: inventoryError } = await supabase.rpc(
          "adjust_inventory_in_warehouse",
          {
            p_product_id: item.product_id,
            p_warehouse_id: warehouseId,
            p_quantity_change: item.quantity,
          }
        )

        if (inventoryError) {
          console.error("Error updating inventory:", inventoryError)
          return { error: "Failed to update inventory" }
        }

        // Record stock movement
        await supabase.rpc("record_stock_movement", {
          p_product_id: item.product_id,
          p_invoice_id: null,
          p_type: "receive",
          p_quantity_change: item.quantity,
          p_notes: `Received from PO #${purchaseOrderId}`,
          p_warehouse_id: warehouseId,
        })

        // Record inventory cost for valuation tracking
        await supabase.rpc("record_inventory_cost", {
          p_product_id: item.product_id,
          p_warehouse_id: warehouseId,
          p_quantity: item.quantity,
          p_unit_cost: item.unit_price,
          p_purchase_order_id: purchaseOrderId,
        })
      }
    }

    // Update PO status to received
    const { error: statusError } = await supabase
      .from("purchase_orders")
      .update({ status: "received" })
      .eq("id", purchaseOrderId)

    if (statusError) {
      console.error("Error updating PO status:", statusError)
      return { error: "Items received but failed to update status" }
    }

    await revalidatePath("/purchase-orders")
    await revalidatePath(`/purchase-orders/${purchaseOrderId}`)
    await revalidatePath("/products")

    return { success: true }
  } catch (error) {
    console.error("Error in receiveOrderItems:", error)
    return { error: "Unexpected error occurred" }
  }
}
