-- ============================================================================
-- FIX: Invoice Status Update Error - Add Missing Stock Deduction Function
-- ============================================================================
-- This fixes the error when updating invoice status to "Paid"
-- The error occurs because deduct_stock_from_invoice function doesn't exist
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Option 1: Create the deduct_stock_from_invoice function
-- ----------------------------------------------------------------------------
-- This function deducts stock from inventory when an invoice is marked as Paid
CREATE OR REPLACE FUNCTION deduct_stock_from_invoice(p_invoice_id BIGINT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_items JSONB;
  item JSONB;
  product_id_val BIGINT;
  quantity_val DECIMAL;
BEGIN
  -- Get the invoice items
  SELECT items INTO invoice_items
  FROM invoices
  WHERE id = p_invoice_id;

  -- Check if items exist
  IF invoice_items IS NULL THEN
    RAISE EXCEPTION 'Invoice items not found for invoice ID %', p_invoice_id;
  END IF;

  -- Loop through each item and deduct from inventory
  FOR item IN SELECT * FROM jsonb_array_elements(invoice_items)
  LOOP
    -- Extract product_id and quantity from the item
    product_id_val := (item->>'productId')::BIGINT;
    quantity_val := (item->>'quantity')::DECIMAL;

    -- Only deduct if product_id exists (not null)
    IF product_id_val IS NOT NULL AND quantity_val > 0 THEN
      -- Note: This assumes you have a default warehouse or you track warehouse per invoice
      -- You may need to modify this based on your warehouse strategy

      -- Simple approach: Deduct from product quantity directly
      UPDATE products
      SET quantity = quantity - quantity_val
      WHERE id = product_id_val;

      -- If you use warehouse-based inventory (product_inventories table):
      -- You would need to know which warehouse to deduct from
      -- This might require adding a warehouse_id field to invoices table
    END IF;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION deduct_stock_from_invoice IS 'Deducts inventory when invoice status changes to Paid';

-- ----------------------------------------------------------------------------
-- Option 2: Remove stock deduction from status update (Simpler Approach)
-- ----------------------------------------------------------------------------
-- If you don't want automatic stock deduction when marking as "Paid",
-- you can modify the invoice update behavior instead.
--
-- In this case, you would:
-- 1. Comment out or remove the stock deduction code in src/app/invoices/actions.ts
-- 2. Handle stock deduction separately (e.g., when creating the invoice, or via a separate button)
--
-- This is often preferred because:
-- - Stock is typically reserved/deducted when invoice is created or sent
-- - Payment status shouldn't affect inventory (inventory was already shipped)
-- - Separates concerns: payment tracking vs inventory management

-- ============================================================================
-- RECOMMENDED APPROACH
-- ============================================================================
-- Since most businesses deduct stock when goods are SHIPPED (not when PAID),
-- I recommend REMOVING the deduct_stock_from_invoice call from your code.
--
-- If you still want to keep it, run Option 1 above.
-- If you want to remove it, edit src/app/invoices/actions.ts:
--
-- Comment out or remove lines 120-133 in updateInvoiceStatus function:
--   // if (newStatus === "Paid") {
--   //   const { error: rpcError } = await supabase.rpc(
--   //     "deduct_stock_from_invoice",
--   //     { p_invoice_id: invoiceId }
--   //   )
--   //   if (rpcError) {
--   //     console.error("Error deducting stock:", rpcError)
--   //     return { message: "Status updated, but failed to deduct stock." }
--   //   }
--   // }
-- ============================================================================

-- VERIFICATION: Test if function works
-- SELECT deduct_stock_from_invoice(1); -- Replace 1 with actual invoice ID
