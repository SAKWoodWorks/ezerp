"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// ฟังก์ชันสำหรับเพิ่มสินค้าใหม่
export async function addProduct(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  // --- เพิ่มการดึงข้อมูล E-commerce จาก formData ---
  const isEcommerceProduct = formData.get("is_ecommerce_product") === "true"
  const ecommerceSizesString = formData.get("ecommerce_sizes") as string
  const ecommerceSizes = isEcommerceProduct
    ? JSON.parse(ecommerceSizesString)
    : null

  const productData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    stock_quantity: Number(formData.get("stock_quantity")),
    low_stock_threshold: Number(formData.get("low_stock_threshold")),
    // Add new dimension fields
    width: Number(formData.get("width")),
    length: Number(formData.get("length")),
    thickness: Number(formData.get("thickness")),
    // เพิ่มข้อมูล E-commerce ลงใน object ที่จะบันทึก
    is_ecommerce_product: isEcommerceProduct,
    ecommerce_sizes: ecommerceSizes,
  }

  const { error } = await supabase.from("products").insert(productData)

  if (error) {
    console.error("Supabase error adding product:", error)
    return redirect("/products?message=Error: Could not add product.")
  }

  await revalidatePath("/products")
  redirect("/products")
}

// ฟังก์ชันสำหรับแก้ไขข้อมูลสินค้า
export async function updateProduct(productId: number, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  // --- เพิ่มการดึงข้อมูล E-commerce จาก formData ---
  const isEcommerceProduct = formData.get("is_ecommerce_product") === "true"
  const ecommerceSizesString = formData.get("ecommerce_sizes") as string
  // แปลงข้อมูลขนาดจาก String (JSON) กลับมาเป็น Array ของตัวเลข
  // ถ้าไม่ได้ติ๊กขาย E-commerce ให้ค่าเป็น null
  const ecommerceSizes = isEcommerceProduct
    ? JSON.parse(ecommerceSizesString)
    : null

  const productData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    low_stock_threshold: Number(formData.get("low_stock_threshold")),
    width: Number(formData.get("width")),
    length: Number(formData.get("length")),
    thickness: Number(formData.get("thickness")),
    // เพิ่มข้อมูล E-commerce ลงใน object ที่จะอัปเดต
    is_ecommerce_product: isEcommerceProduct,
    ecommerce_sizes: ecommerceSizes,
  }

  // ทำการอัปเดตข้อมูลในฐานข้อมูล
  const { error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", productId)

  if (error) {
    console.error("Supabase error updating product:", error)
    return redirect(`/products/${productId}?message=Error updating product`)
  }

  // ล้าง Cache ของหน้าเว็บที่เกี่ยวข้องเพื่อให้แสดงผลข้อมูลล่าสุด
  await revalidatePath(`/products`)
  await revalidatePath(`/products/${productId}`)
  redirect(`/products/${productId}`) // Redirect กลับไปหน้ารายละเอียดสินค้า
}

// ฟังก์ชันสำหรับลบข้อมูลสินค้า
export async function deleteProduct(productId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  const { error } = await supabase.from("products").delete().eq("id", productId)

  if (error) {
    console.error("Supabase error deleting product:", error)
    return redirect(`/products?message=Error deleting product`)
  }

  await revalidatePath("/products")
  await revalidatePath("/dashboard") // Revalidate dashboard as well
  redirect("/products")
}

// ฟังก์ชันสำหรับปรับปรุงสต็อก
// *** Updated function to handle warehouse-specific stock adjustments ***
export async function adjustStock(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const productId = Number(formData.get("productId"))
  const warehouseId = Number(formData.get("warehouseId")) // Get warehouseId from form
  const type = formData.get("type") as string
  const quantityChange = Number(formData.get("quantityChange"))
  const notes = formData.get("notes") as string

  if (!productId || !warehouseId || isNaN(quantityChange)) {
    return {
      error:
        "Invalid data provided. Product, warehouse, and quantity are required.",
    }
  }

  // 1. Call RPC to adjust inventory in the specific warehouse
  const { error: updateError } = await supabase.rpc(
    "adjust_inventory_in_warehouse",
    {
      p_product_id: productId,
      p_warehouse_id: warehouseId,
      p_quantity_change: quantityChange,
    }
  )

  if (updateError) {
    console.error("Error adjusting inventory:", updateError)
    return { error: "Could not adjust inventory." }
  }

  // 2. Call RPC to record the movement
  const { error: recordError } = await supabase.rpc("record_stock_movement", {
    p_product_id: productId,
    p_invoice_id: null,
    p_type: type,
    p_quantity_change: quantityChange,
    p_notes: notes,
    p_warehouse_id: warehouseId, // Pass warehouseId to the recording function
  })

  if (recordError) {
    console.error("Error recording stock movement:", recordError)
    return { error: "Stock updated, but failed to record movement." }
  }

  // 3. Revalidate paths to show updated data
  revalidatePath("/products")
  revalidatePath(`/products/${productId}`)
  revalidatePath("/dashboard")

  return { success: true }
}
export async function transferStock(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const productId = Number(formData.get("productId"))
  const fromWarehouseId = Number(formData.get("fromWarehouseId"))
  const toWarehouseId = Number(formData.get("toWarehouseId"))
  const quantity = Number(formData.get("quantity"))
  const notes = formData.get("notes") as string

  if (!productId || !fromWarehouseId || !toWarehouseId || !quantity) {
    return { error: "ข้อมูลไม่ครบถ้วน" }
  }

  if (fromWarehouseId === toWarehouseId) {
    return { error: "คลังสินค้าต้นทางและปลายทางต้องแตกต่างกัน" }
  }

  const { error } = await supabase.rpc("transfer_stock", {
    p_product_id: productId,
    p_quantity: quantity,
    p_from_warehouse_id: fromWarehouseId,
    p_to_warehouse_id: toWarehouseId,
    p_notes: notes,
  })

  if (error) {
    console.error("Error transferring stock:", error)
    return { error: "ไม่สามารถย้ายสินค้าได้" }
  }

  revalidatePath("/products")
  revalidatePath(`/products/${productId}`)

  return { success: true }
}
