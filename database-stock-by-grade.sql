-- Create per-grade stock table synced from Google Sheets
CREATE TABLE IF NOT EXISTS product_stock_by_grade (
  id           BIGSERIAL PRIMARY KEY,
  product_id   BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  grade_a      NUMERIC NOT NULL DEFAULT 0,
  cca_ready    NUMERIC NOT NULL DEFAULT 0,
  grade_cca    NUMERIC NOT NULL DEFAULT 0,
  grade_b      NUMERIC NOT NULL DEFAULT 0,
  synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- Index for fast lookups by product
CREATE INDEX IF NOT EXISTS idx_stock_by_grade_product
  ON product_stock_by_grade(product_id);

-- Index for fast lookups by warehouse
CREATE INDEX IF NOT EXISTS idx_stock_by_grade_warehouse
  ON product_stock_by_grade(warehouse_id);

-- Enable RLS
ALTER TABLE product_stock_by_grade ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read
CREATE POLICY "Authenticated users can read stock by grade"
  ON product_stock_by_grade FOR SELECT
  TO authenticated
  USING (true);

-- Service role bypasses RLS by default so no INSERT/UPDATE policy needed
