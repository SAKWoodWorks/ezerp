-- ============================================================================
-- PAYMENT TRACKING MODULE
-- ============================================================================
-- Execute this in your Supabase SQL Editor
-- Tracks payments against invoices and outstanding balances
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PAYMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

COMMENT ON TABLE payments IS 'Payment records against invoices';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: cash, bank_transfer, check, credit_card, etc.';
COMMENT ON COLUMN payments.reference_number IS 'Bank transfer ref, check number, transaction ID, etc.';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view payments" ON payments;
CREATE POLICY "Allow authenticated users to view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON payments;
CREATE POLICY "Allow authenticated users to insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update payments" ON payments;
CREATE POLICY "Allow authenticated users to update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete payments" ON payments;
CREATE POLICY "Allow authenticated users to delete payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 2. ADD PAYMENT TRACKING COLUMNS TO INVOICES
-- ----------------------------------------------------------------------------
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED;

COMMENT ON COLUMN invoices.total_amount IS 'Total invoice amount (calculated from items)';
COMMENT ON COLUMN invoices.paid_amount IS 'Total amount paid so far';
COMMENT ON COLUMN invoices.balance_due IS 'Auto-calculated: total_amount - paid_amount';

-- ----------------------------------------------------------------------------
-- 3. FUNCTION: Calculate invoice total from items
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_invoice_total(p_invoice_id BIGINT)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  total DECIMAL;
BEGIN
  -- Get invoice items and calculate total
  SELECT SUM((item->>'quantity')::DECIMAL * (item->>'unitPrice')::DECIMAL)
  INTO total
  FROM invoices,
  jsonb_array_elements(items) AS item
  WHERE id = p_invoice_id;

  RETURN COALESCE(total, 0);
END;
$$;

COMMENT ON FUNCTION calculate_invoice_total IS 'Calculates total amount from invoice items JSON';

-- ----------------------------------------------------------------------------
-- 4. FUNCTION: Update invoice totals (one-time migration)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_all_invoice_totals()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE invoices
  SET total_amount = calculate_invoice_total(id)
  WHERE total_amount = 0 OR total_amount IS NULL;
END;
$$;

-- Run the migration to populate existing invoice totals
SELECT update_all_invoice_totals();

-- ----------------------------------------------------------------------------
-- 5. TRIGGER: Update paid_amount when payment is added/updated/deleted
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the paid_amount in invoices
  UPDATE invoices
  SET paid_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  )
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_invoice_paid_amount ON payments;
CREATE TRIGGER trigger_update_invoice_paid_amount
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_paid_amount();

COMMENT ON FUNCTION update_invoice_paid_amount IS 'Automatically updates invoices.paid_amount when payments change';

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: Auto-update invoice status based on payment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_total DECIMAL;
  invoice_paid DECIMAL;
  invoice_due_date DATE;
BEGIN
  -- Get invoice details
  SELECT total_amount, paid_amount, due_date
  INTO invoice_total, invoice_paid, invoice_due_date
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update status based on payment
  UPDATE invoices
  SET status = CASE
    -- If fully paid
    WHEN invoice_paid >= invoice_total THEN 'Paid'
    -- If overdue and not paid
    WHEN invoice_due_date < CURRENT_DATE AND invoice_paid < invoice_total THEN 'Overdue'
    -- If partially paid or sent but not overdue
    WHEN invoice_paid > 0 THEN 'Sent'
    -- Otherwise keep current status
    ELSE status
  END
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_invoice_status_on_payment ON payments;
CREATE TRIGGER trigger_update_invoice_status_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_payment();

COMMENT ON FUNCTION update_invoice_status_on_payment IS 'Auto-updates invoice status when payments are recorded';

-- ----------------------------------------------------------------------------
-- 7. FUNCTION: Get outstanding invoices (aging report)
-- ----------------------------------------------------------------------------
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
  ORDER BY i.due_date ASC;
END;
$$;

COMMENT ON FUNCTION get_outstanding_invoices IS 'Returns all outstanding invoices with aging categories';

-- ----------------------------------------------------------------------------
-- 8. FUNCTION: Get payment summary by customer
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_customer_payment_summary(p_customer_id BIGINT DEFAULT NULL)
RETURNS TABLE (
  customer_id BIGINT,
  customer_name TEXT,
  total_invoiced DECIMAL,
  total_paid DECIMAL,
  total_outstanding DECIMAL,
  invoice_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    COALESCE(SUM(i.total_amount), 0)::DECIMAL AS total_invoiced,
    COALESCE(SUM(i.paid_amount), 0)::DECIMAL AS total_paid,
    COALESCE(SUM(i.balance_due), 0)::DECIMAL AS total_outstanding,
    COUNT(i.id) AS invoice_count
  FROM customers c
  LEFT JOIN invoices i ON i.customer_id = c.id AND i.status != 'Draft'
  WHERE p_customer_id IS NULL OR c.id = p_customer_id
  GROUP BY c.id, c.name
  HAVING COALESCE(SUM(i.total_amount), 0) > 0
  ORDER BY total_outstanding DESC;
END;
$$;

COMMENT ON FUNCTION get_customer_payment_summary IS 'Returns payment summary for customers (optional: specific customer)';

-- ----------------------------------------------------------------------------
-- 9. FUNCTION: Get payment history for an invoice
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_invoice_payments(p_invoice_id BIGINT)
RETURNS TABLE (
  payment_id BIGINT,
  payment_date DATE,
  amount DECIMAL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS payment_id,
    p.payment_date,
    p.amount,
    p.payment_method,
    p.reference_number,
    p.notes,
    p.created_at
  FROM payments p
  WHERE p.invoice_id = p_invoice_id
  ORDER BY p.payment_date DESC, p.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_invoice_payments IS 'Returns all payments for a specific invoice';

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Optional)
-- ----------------------------------------------------------------------------
-- Uncomment to test:
-- SELECT * FROM get_outstanding_invoices();
-- SELECT * FROM get_customer_payment_summary();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. The backend code will use these tables/functions
-- 2. Record payments against invoices
-- 3. Invoice status will auto-update based on payments
-- 4. View aging reports to track overdue invoices
-- ============================================================================
