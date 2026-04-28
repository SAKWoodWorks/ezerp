-- Add payment slip URL to cash_bills
ALTER TABLE cash_bills
  ADD COLUMN IF NOT EXISTS payment_slip_url TEXT;
