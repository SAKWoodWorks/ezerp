-- Stock Adjustments Module
-- Track inventory adjustments for damage, loss, found items, corrections, etc.

-- Create enum for adjustment types (drop first if exists)
DROP TYPE IF EXISTS adjustment_type CASCADE;
CREATE TYPE adjustment_type AS ENUM (
  'damage',           -- Damaged goods
  'loss',             -- Lost/stolen items
  'found',            -- Found items (surplus)
  'count_correction', -- Physical count adjustment
  'return',           -- Return to supplier
  'other'             -- Other reasons
);

-- Create stock_adjustments table (drop first if exists)
DROP TABLE IF EXISTS stock_adjustments CASCADE;
CREATE TABLE stock_adjustments (
  id BIGSERIAL PRIMARY KEY,
  adjustment_number TEXT UNIQUE NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  adjustment_type adjustment_type NOT NULL,
  quantity INTEGER NOT NULL, -- Positive for increase, negative for decrease
  reason TEXT NOT NULL,
  notes TEXT,
  adjusted_by BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  adjustment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_warehouse ON stock_adjustments(warehouse_id);
CREATE INDEX idx_stock_adjustments_type ON stock_adjustments(adjustment_type);
CREATE INDEX idx_stock_adjustments_date ON stock_adjustments(adjustment_date DESC);
CREATE INDEX idx_stock_adjustments_number ON stock_adjustments(adjustment_number);

-- Enable RLS
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON stock_adjustments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON stock_adjustments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON stock_adjustments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON stock_adjustments
  FOR DELETE USING (auth.role() = 'authenticated');

-- Function to generate adjustment number
CREATE OR REPLACE FUNCTION generate_adjustment_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  new_number TEXT;
BEGIN
  -- Get last 2 digits of current year
  year_suffix := TO_CHAR(NOW(), 'YY');

  -- Get the highest number for current year
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(adjustment_number FROM 'ADJ' || year_suffix || '(\d+)')
        AS INTEGER
      )
    ), 0
  ) + 1
  INTO next_number
  FROM stock_adjustments
  WHERE adjustment_number LIKE 'ADJ' || year_suffix || '%';

  -- Format: ADJ{YY}{NNN} (e.g., ADJ25001)
  new_number := 'ADJ' || year_suffix || LPAD(next_number::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate adjustment number
CREATE OR REPLACE FUNCTION set_adjustment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.adjustment_number IS NULL OR NEW.adjustment_number = '' THEN
    NEW.adjustment_number := generate_adjustment_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_adjustment_number
  BEFORE INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION set_adjustment_number();

-- Trigger to update product stock quantity
CREATE OR REPLACE FUNCTION update_product_stock_on_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's stock quantity based on the adjustment
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_adjustment();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_adjustments_timestamp
  BEFORE UPDATE ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_adjustments_updated_at();

-- Create view for stock adjustment history with related data
CREATE OR REPLACE VIEW stock_adjustments_view AS
SELECT
  sa.id,
  sa.adjustment_number,
  sa.adjustment_type,
  sa.quantity,
  sa.reason,
  sa.notes,
  sa.adjustment_date,
  sa.created_at,
  p.id AS product_id,
  p.name AS product_name,
  w.id AS warehouse_id,
  w.name AS warehouse_name,
  e.id AS employee_id,
  e.full_name AS adjusted_by_name
FROM stock_adjustments sa
JOIN products p ON sa.product_id = p.id
JOIN warehouses w ON sa.warehouse_id = w.id
JOIN employees e ON sa.adjusted_by = e.id
ORDER BY sa.adjustment_date DESC, sa.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON stock_adjustments_view TO authenticated;

-- Insert sample data (optional - for testing)
-- Note: Update IDs to match your actual data
/*
INSERT INTO stock_adjustments (
  product_id,
  warehouse_id,
  adjustment_type,
  quantity,
  reason,
  notes,
  adjusted_by
) VALUES (
  (SELECT id FROM products LIMIT 1),
  (SELECT id FROM warehouses LIMIT 1),
  'count_correction',
  -5,
  'Physical count revealed discrepancy',
  'Found during monthly inventory check',
  (SELECT id FROM employees LIMIT 1)
);
*/
