-- ============================================================================
-- FIX: Outstanding Invoices Report - Exclude Paid Invoices
-- ============================================================================
-- This fixes the issue where paid invoices still show in the aging report
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Update the get_outstanding_invoices function to exclude 'Paid' invoices
CREATE OR REPLACE FUNCTION get_outstanding_invoices()
RETURNS TABLE (
  invoice_id BIGINT,
  invoice_number TEXT,
  customer_id BIGINT,
  customer_name TEXT,
  issue_date DATE,
  due_date DATE,
  total_amount DECIMAL,
  paid_amount DECIMAL,
  balance_due DECIMAL,
  days_overdue INTEGER,
  aging_category TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS invoice_id,
    i.invoice_number,
    i.customer_id,
    c.name AS customer_name,
    i.issue_date,
    i.due_date,
    i.total_amount,
    i.paid_amount,
    i.balance_due,
    CASE
      WHEN i.due_date < CURRENT_DATE THEN (CURRENT_DATE - i.due_date)::INTEGER
      ELSE 0
    END AS days_overdue,
    CASE
      WHEN i.balance_due <= 0 THEN 'Paid'
      WHEN i.due_date >= CURRENT_DATE THEN 'Current'
      WHEN (CURRENT_DATE - i.due_date) <= 30 THEN '1-30 days'
      WHEN (CURRENT_DATE - i.due_date) <= 60 THEN '31-60 days'
      WHEN (CURRENT_DATE - i.due_date) <= 90 THEN '61-90 days'
      ELSE '90+ days'
    END AS aging_category
  FROM invoices i
  LEFT JOIN customers c ON i.customer_id = c.id
  WHERE i.balance_due > 0
    AND i.status != 'Draft'
    AND i.status != 'Paid'  -- ✅ FIXED: Exclude paid invoices
  ORDER BY i.due_date ASC;
END;
$$;

COMMENT ON FUNCTION get_outstanding_invoices IS 'Returns all outstanding (unpaid) invoices with aging information, excluding Draft and Paid invoices';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Test the function to verify paid invoices are excluded
SELECT * FROM get_outstanding_invoices()
LIMIT 10;

-- Check if any Paid invoices exist (should return 0 rows)
SELECT
  invoice_number,
  status,
  total_amount,
  paid_amount,
  balance_due
FROM invoices
WHERE status = 'Paid' AND balance_due > 0
ORDER BY invoice_number DESC;

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- Now paid invoices will NOT appear in the outstanding invoices report
-- ============================================================================
