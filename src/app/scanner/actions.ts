"use server"

import { createClient } from "@/lib/supabase/server"

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stock_quantity: number
  barcode: string | null
  width: number | null
  length: number | null
  thickness: number | null
  supplier_id: number | null
}

export async function findProductByBarcode(barcode: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .single()

  if (error) {
    console.error("Error finding product by barcode:", error)
    return { success: false, error: "Product not found", product: null }
  }

  return { success: true, product: data as Product, error: null }
}

export async function searchProductByBarcode(barcode: string) {
  const supabase = await createClient()

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .single()

  if (exactMatch) {
    return { success: true, products: [exactMatch as Product], error: null }
  }

  // Try partial match
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("barcode", `%${barcode}%`)
    .limit(10)

  if (error) {
    console.error("Error searching products by barcode:", error)
    return { success: false, products: [], error: "No products found" }
  }

  return { success: true, products: data as Product[], error: null }
}

export async function getAllProducts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name")

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data as Product[]
}

export async function updateProductBarcode(productId: number, barcode: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("products")
    .update({ barcode })
    .eq("id", productId)

  if (error) {
    console.error("Error updating product barcode:", error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
