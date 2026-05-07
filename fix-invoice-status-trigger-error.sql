-- ============================================================================
-- FIX: Invoice Status Update Trigger Error
-- ============================================================================
-- Error: record "new" has no field "created_by"
-- This fixes the trigger that tries to access non-existent created_by field
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fix: Update the auto_record_payment_on_paid_status function
-- ----------------------------------------------------------------------------
-- Remove reference to non-existent created_by field
-- The payments table created_by can be NULL or we can omit it
CREATE OR REPLACE FUNCTION auto_record_payment_on_paid_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status changed to 'Paid' and there's an outstanding balance
  IF NEW.status = 'Paid' AND OLD.status != 'Paid' THEN
    -- Check if there's an outstanding balance
    IF NEW.balance_due > 0 OR NEW.paid_amount < NEW.total_amount THEN
      -- Create a payment record for the remaining balance
      INSERT INTO payments (
        invoice_id,
        amount,
        payment_date,
        payment_method,
        notes
        -- ✅ REMOVED: created_by (field doesn't exist in invoices table)
      ) VALUES (
        NEW.id,
        NEW.total_amount - COALESCE(NEW.paid_amount, 0), -- Remaining balance
        CURRENT_DATE,
        'cash', -- Default payment method
        'Auto-recorded when status changed to Paid'
        -- ✅ REMOVED: NEW.created_by
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_record_payment_on_paid_status IS 'Auto-records payment when invoice status is changed to Paid (fixed to remove created_by reference)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Test by updating an invoice status to 'Paid'
-- The trigger should now work without errors

-- Check if the trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_auto_record_payment_on_paid';

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- Now you can update invoice status to "Paid" without errors
-- ============================================================================
