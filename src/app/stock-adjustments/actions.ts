"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AdjustmentType =
  | "damage"
  | "loss"
  | "found"
  | "count_correction"
  | "return"
  | "other";

export interface StockAdjustment {
  id: string;
  adjustment_number: string;
  product_id: string;
  warehouse_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  adjusted_by: string;
  adjustment_date: string;
  created_at: string;
  product?: {
    id?: string;
    name: string;
    stock_quantity?: number;
  };
  warehouse?: {
    id?: string;
    name: string;
  };
  employee?: {
    id?: string;
    full_name: string;
  };
}

export async function getStockAdjustments() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_adjustments")
    .select(
      `
      *,
      product:products(name),
      warehouse:warehouses(name),
      employee:employees!stock_adjustments_adjusted_by_fkey(full_name)
    `,
    )
    .order("adjustment_date", { ascending: false });

  if (error) {
    console.error("Error fetching stock adjustments:", error);
    return [];
  }

  return data as StockAdjustment[];
}

export async function getStockAdjustmentById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_adjustments")
    .select(
      `
      *,
      product:products(id, name, stock_quantity),
      warehouse:warehouses(id, name),
      employee:employees!stock_adjustments_adjusted_by_fkey(id, full_name)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching stock adjustment:", error);
    return null;
  }

  return data as StockAdjustment;
}

export async function createStockAdjustment(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const product_id = formData.get("product_id") as string;
  const warehouse_id = formData.get("warehouse_id") as string;
  const adjustment_type = formData.get("adjustment_type") as AdjustmentType;
  const quantity = parseInt(formData.get("quantity") as string);
  const reason = formData.get("reason") as string;
  const notes = formData.get("notes") as string;
  const adjusted_by = formData.get("adjusted_by") as string;
  const adjustment_date = formData.get("adjustment_date") as string;

  // Validation
  if (
    !product_id ||
    !warehouse_id ||
    !adjustment_type ||
    !quantity ||
    !reason ||
    !adjusted_by
  ) {
    return { success: false, error: "Missing required fields" };
  }

  // Check if product exists and has sufficient stock for negative adjustments
  if (quantity < 0) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("stock_quantity")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return { success: false, error: "Product not found" };
    }

    if (product.stock_quantity + quantity < 0) {
      return {
        success: false,
        error: "Insufficient stock for this adjustment",
      };
    }
  }

  const { data, error } = await supabase
    .from("stock_adjustments")
    .insert({
      product_id,
      warehouse_id,
      adjustment_type,
      quantity,
      reason,
      notes: notes || null,
      adjusted_by,
      adjustment_date: adjustment_date || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating stock adjustment:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/stock-adjustments");
  revalidatePath("/products");
  return { success: true, data };
}

export async function deleteStockAdjustment(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Get the adjustment details before deleting to reverse the stock change
  const { data: adjustment, error: fetchError } = await supabase
    .from("stock_adjustments")
    .select("product_id, quantity")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { success: false, error: "Adjustment not found" };
  }

  // Reverse the stock adjustment
  const { error: updateError } = await supabase
    .from("products")
    .update({
      stock_quantity: supabase.rpc("decrement", { x: adjustment.quantity }),
    })
    .eq("id", adjustment.product_id);

  if (updateError) {
    console.error("Error reversing stock adjustment:", updateError);
  }

  // Delete the adjustment
  const { error: deleteError } = await supabase
    .from("stock_adjustments")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting stock adjustment:", deleteError);
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/stock-adjustments");
  revalidatePath("/products");
  return { success: true };
}

export async function getProducts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, stock_quantity")
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data;
}

export async function getWarehouses() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("warehouses")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching warehouses:", error);
    return [];
  }

  return data;
}

export async function getEmployees() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name")
    .order("full_name");

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return data;
}

export async function getStockAdjustmentsByProduct(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_adjustments")
    .select(
      `
      *,
      warehouse:warehouses(name),
      employee:employees!stock_adjustments_adjusted_by_fkey(full_name)
    `,
    )
    .eq("product_id", productId)
    .order("adjustment_date", { ascending: false });

  if (error) {
    console.error("Error fetching product adjustments:", error);
    return [];
  }

  return data as StockAdjustment[];
}
