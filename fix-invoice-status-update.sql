-- ============================================================================
-- FIX: Update Invoice Status to Auto-Calculate Totals
-- ============================================================================
-- This ensures total_amount is populated when invoice status changes
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Update existing invoices to populate total_amount
-- ----------------------------------------------------------------------------
-- This will calculate and set total_amount for all existing invoices
UPDATE invoices
SET total_amount = (
  SELECT SUM((item->>'quantity')::DECIMAL * (item->>'unitPrice')::DECIMAL)
  FROM jsonb_array_elements(items) AS item
)
WHERE total_amount IS NULL OR total_amount = 0;

-- ----------------------------------------------------------------------------
-- 2. Create trigger to auto-calculate total_amount on invoice insert/update
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_invoice_total_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate total from items
  NEW.total_amount := (
    SELECT COALESCE(SUM((item->>'quantity')::DECIMAL * (item->>'unitPrice')::DECIMAL), 0)
    FROM jsonb_array_elements(NEW.items) AS item
  );

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_invoice_total ON invoices;

-- Create the trigger
CREATE TRIGGER trigger_update_invoice_total
  BEFORE INSERT OR UPDATE OF items ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_total_on_change();

COMMENT ON FUNCTION update_invoice_total_on_change IS 'Auto-calculates total_amount when invoice items change';

-- ----------------------------------------------------------------------------
-- 3. Enhanced status update trigger - auto-record payment when marking as Paid
-- ----------------------------------------------------------------------------
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
        notes,
        created_by
      ) VALUES (
        NEW.id,
        NEW.total_amount - COALESCE(NEW.paid_amount, 0), -- Remaining balance
        CURRENT_DATE,
        'cash', -- Default payment method
        'Auto-recorded when status changed to Paid',
        NEW.created_by -- Use invoice creator as payment creator
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_record_payment_on_paid ON invoices;

-- Create the trigger
CREATE TRIGGER trigger_auto_record_payment_on_paid
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  WHEN (NEW.status = 'Paid' AND OLD.status != 'Paid')
  EXECUTE FUNCTION auto_record_payment_on_paid_status();

COMMENT ON FUNCTION auto_record_payment_on_paid_status IS 'Auto-records payment when invoice status is changed to Paid';

-- ----------------------------------------------------------------------------
-- 4. Verify the fixes
-- ----------------------------------------------------------------------------
-- Check if invoices now have total_amount populated
SELECT
  id,
  invoice_number,
  status,
  total_amount,
  paid_amount,
  balance_due
FROM invoices
WHERE status != 'Draft'
ORDER BY id DESC
LIMIT 10;

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- Now when you:
-- 1. Create/update an invoice - total_amount auto-calculates
-- 2. Change status to "Paid" - a payment record is auto-created
-- 3. Outstanding invoices report will show correct data
-- ============================================================================
