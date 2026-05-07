-- ============================================================================
-- COMPLETE PAYMENT TRACKING SETUP + FIX FOR EXISTING PAID INVOICES
-- ============================================================================
-- This single file sets up payment tracking AND marks existing paid invoices
-- Run this ONCE in your Supabase SQL Editor
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

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to view payments" ON payments;
CREATE POLICY "Allow authenticated users to view payments"
  ON payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON payments;
CREATE POLICY "Allow authenticated users to insert payments"
  ON payments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update payments" ON payments;
CREATE POLICY "Allow authenticated users to update payments"
  ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete payments" ON payments;
CREATE POLICY "Allow authenticated users to delete payments"
  ON payments FOR DELETE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 2. ADD PAYMENT TRACKING COLUMNS TO INVOICES
-- ----------------------------------------------------------------------------
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED;

-- ----------------------------------------------------------------------------
-- 3. POPULATE total_amount FOR ALL EXISTING INVOICES
-- ----------------------------------------------------------------------------
UPDATE invoices
SET total_amount = (
  SELECT COALESCE(SUM((item->>'quantity')::DECIMAL * (item->>'unitPrice')::DECIMAL), 0)
  FROM jsonb_array_elements(items) AS item
)
WHERE total_amount IS NULL OR total_amount = 0;

-- ----------------------------------------------------------------------------
-- 4. AUTO-CREATE PAYMENTS FOR EXISTING "PAID" INVOICES
-- ----------------------------------------------------------------------------
-- This creates payment records for all invoices that are already marked as "Paid"
-- so they show up correctly in reports

INSERT INTO payments (invoice_id, amount, payment_date, payment_method, notes)
SELECT
  id,
  total_amount,
  COALESCE(due_date, issue_date, CURRENT_DATE), -- Use due_date or issue_date as payment date
  'cash',
  'Auto-created for existing paid invoice'
FROM invoices
WHERE status = 'Paid'
  AND total_amount > 0
  AND id NOT IN (SELECT DISTINCT invoice_id FROM payments) -- Don't duplicate if payment already exists
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function: Calculate invoice total
CREATE OR REPLACE FUNCTION calculate_invoice_total(p_invoice_id BIGINT)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  total DECIMAL;
BEGIN
  SELECT SUM((item->>'quantity')::DECIMAL * (item->>'unitPrice')::DECIMAL)
  INTO total
  FROM invoices,
  jsonb_array_elements(items) AS item
  WHERE id = p_invoice_id;

  RETURN COALESCE(total, 0);
END;
$$;

-- Function: Get outstanding invoices (aging report)
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

-- Function: Get invoice payments
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

-- Function: Get customer payment summary
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

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger: Update paid_amount when payment changes
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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

-- Trigger: Auto-update invoice status based on payment
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  invoice_total DECIMAL;
  invoice_paid DECIMAL;
  invoice_due_date DATE;
BEGIN
  SELECT total_amount, paid_amount, due_date
  INTO invoice_total, invoice_paid, invoice_due_date
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  UPDATE invoices
  SET status = CASE
    WHEN invoice_paid >= invoice_total THEN 'Paid'
    WHEN invoice_due_date < CURRENT_DATE AND invoice_paid < invoice_total THEN 'Overdue'
    WHEN invoice_paid > 0 THEN 'Sent'
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

-- Trigger: Auto-calculate total_amount when invoice items change
CREATE OR REPLACE FUNCTION update_invoice_total_on_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_amount := (
    SELECT COALESCE(SUM((item->>'quantity')::DECIMAL * (item->>'unitPrice')::DECIMAL), 0)
    FROM jsonb_array_elements(NEW.items) AS item
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_invoice_total ON invoices;
CREATE TRIGGER trigger_update_invoice_total
  BEFORE INSERT OR UPDATE OF items ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_total_on_change();

-- ----------------------------------------------------------------------------
-- 7. VERIFY SETUP
-- ----------------------------------------------------------------------------
-- Check that everything is working
SELECT
  'Setup Complete!' as message,
  COUNT(*) as total_invoices,
  SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_invoices,
  SUM(CASE WHEN balance_due > 0 THEN 1 ELSE 0 END) as outstanding_invoices
FROM invoices
WHERE status != 'Draft';

-- Show sample of invoices
SELECT
  invoice_number,
  status,
  total_amount,
  paid_amount,
  balance_due
FROM invoices
WHERE status != 'Draft'
ORDER BY id DESC
LIMIT 5;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your paid invoices should now show ฿0.00 balance in the Outstanding report!
-- ============================================================================
