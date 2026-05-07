-- ============================================================================
-- INVENTORY VALUATION SYSTEM
-- ============================================================================
-- This SQL file contains database schema and functions for inventory valuation
-- Execute these in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add cost tracking column to products table (if not exists)
-- ----------------------------------------------------------------------------
-- This stores the most recent purchase cost for simple average costing
ALTER TABLE products
ADD COLUMN IF NOT EXISTS last_purchase_cost DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN products.last_purchase_cost IS 'Most recent purchase cost per unit (updated when receiving PO)';

-- ----------------------------------------------------------------------------
-- 2. Create inventory_cost_history table
-- ----------------------------------------------------------------------------
-- Track all cost changes for advanced costing methods (FIFO/LIFO)
CREATE TABLE IF NOT EXISTS inventory_cost_history (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  remaining_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  purchase_order_id BIGINT REFERENCES purchase_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE inventory_cost_history IS 'Tracks purchase costs for inventory valuation (FIFO/LIFO/Weighted Average)';
COMMENT ON COLUMN inventory_cost_history.remaining_quantity IS 'Quantity remaining from this purchase (for FIFO)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_cost_history_product
  ON inventory_cost_history(product_id, warehouse_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Function: Record inventory cost when receiving purchase orders
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_inventory_cost(
  p_product_id BIGINT,
  p_warehouse_id BIGINT,
  p_quantity DECIMAL,
  p_unit_cost DECIMAL,
  p_purchase_order_id BIGINT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert cost record
  INSERT INTO inventory_cost_history (
    product_id,
    warehouse_id,
    quantity,
    unit_cost,
    remaining_quantity,
    purchase_order_id
  ) VALUES (
    p_product_id,
    p_warehouse_id,
    p_quantity,
    p_unit_cost,
    p_quantity, -- Initially, all quantity is remaining
    p_purchase_order_id
  );

  -- Update last purchase cost in products table
  UPDATE products
  SET last_purchase_cost = p_unit_cost
  WHERE id = p_product_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Function: Get inventory valuation (Weighted Average Method)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_inventory_valuation_weighted_average()
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  warehouse_id BIGINT,
  warehouse_name TEXT,
  quantity DECIMAL,
  weighted_avg_cost DECIMAL,
  total_value DECIMAL,
  last_purchase_cost DECIMAL,
  supplier_name TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    pi.warehouse_id,
    w.name AS warehouse_name,
    pi.quantity,
    -- Weighted average cost from cost history
    COALESCE(
      (
        SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
        FROM inventory_cost_history ich
        WHERE ich.product_id = p.id
          AND ich.warehouse_id = pi.warehouse_id
          AND ich.remaining_quantity > 0
      ),
      p.last_purchase_cost,
      0
    )::DECIMAL(10,2) AS weighted_avg_cost,
    -- Total value = quantity × weighted average cost
    (
      pi.quantity * COALESCE(
        (
          SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
          FROM inventory_cost_history ich
          WHERE ich.product_id = p.id
            AND ich.warehouse_id = pi.warehouse_id
            AND ich.remaining_quantity > 0
        ),
        p.last_purchase_cost,
        0
      )
    )::DECIMAL(10,2) AS total_value,
    p.last_purchase_cost,
    s.name AS supplier_name
  FROM product_inventories pi
  JOIN products p ON pi.product_id = p.id
  JOIN warehouses w ON pi.warehouse_id = w.id
  LEFT JOIN suppliers s ON p.supplier_id = s.id
  WHERE pi.quantity > 0
  ORDER BY w.name, p.name;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Function: Get inventory valuation summary by warehouse
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_inventory_valuation_summary()
RETURNS TABLE (
  warehouse_id BIGINT,
  warehouse_name TEXT,
  total_items BIGINT,
  total_quantity DECIMAL,
  total_value DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    COUNT(DISTINCT pi.product_id)::BIGINT AS total_items,
    SUM(pi.quantity)::DECIMAL(10,2) AS total_quantity,
    SUM(
      pi.quantity * COALESCE(
        (
          SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
          FROM inventory_cost_history ich
          WHERE ich.product_id = pi.product_id
            AND ich.warehouse_id = pi.warehouse_id
            AND ich.remaining_quantity > 0
        ),
        p.last_purchase_cost,
        0
      )
    )::DECIMAL(10,2) AS total_value
  FROM warehouses w
  LEFT JOIN product_inventories pi ON pi.warehouse_id = w.id AND pi.quantity > 0
  LEFT JOIN products p ON pi.product_id = p.id
  GROUP BY w.id, w.name
  ORDER BY w.name;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Function: Get cost analysis for a specific product
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_product_cost_analysis(p_product_id BIGINT)
RETURNS TABLE (
  warehouse_name TEXT,
  current_quantity DECIMAL,
  weighted_avg_cost DECIMAL,
  last_purchase_cost DECIMAL,
  selling_price DECIMAL,
  potential_profit DECIMAL,
  profit_margin_percent DECIMAL,
  total_inventory_value DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.name AS warehouse_name,
    pi.quantity AS current_quantity,
    COALESCE(
      (
        SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
        FROM inventory_cost_history ich
        WHERE ich.product_id = p_product_id
          AND ich.warehouse_id = pi.warehouse_id
          AND ich.remaining_quantity > 0
      ),
      p.last_purchase_cost,
      0
    )::DECIMAL(10,2) AS weighted_avg_cost,
    p.last_purchase_cost,
    p.price AS selling_price,
    (p.price - COALESCE(
      (
        SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
        FROM inventory_cost_history ich
        WHERE ich.product_id = p_product_id
          AND ich.warehouse_id = pi.warehouse_id
          AND ich.remaining_quantity > 0
      ),
      p.last_purchase_cost,
      0
    ))::DECIMAL(10,2) AS potential_profit,
    (
      CASE
        WHEN p.price > 0 THEN
          ((p.price - COALESCE(
            (
              SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
              FROM inventory_cost_history ich
              WHERE ich.product_id = p_product_id
                AND ich.warehouse_id = pi.warehouse_id
                AND ich.remaining_quantity > 0
            ),
            p.last_purchase_cost,
            0
          )) / p.price * 100)
        ELSE 0
      END
    )::DECIMAL(10,2) AS profit_margin_percent,
    (pi.quantity * COALESCE(
      (
        SELECT SUM(ich.remaining_quantity * ich.unit_cost) / NULLIF(SUM(ich.remaining_quantity), 0)
        FROM inventory_cost_history ich
        WHERE ich.product_id = p_product_id
          AND ich.warehouse_id = pi.warehouse_id
          AND ich.remaining_quantity > 0
      ),
      p.last_purchase_cost,
      0
    ))::DECIMAL(10,2) AS total_inventory_value
  FROM product_inventories pi
  JOIN products p ON pi.product_id = p.id
  JOIN warehouses w ON pi.warehouse_id = w.id
  WHERE pi.product_id = p_product_id AND pi.quantity > 0
  ORDER BY w.name;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Enable Row Level Security (RLS) for new table
-- ----------------------------------------------------------------------------
ALTER TABLE inventory_cost_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read cost history
CREATE POLICY "Allow authenticated users to view cost history"
  ON inventory_cost_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert cost history
CREATE POLICY "Allow authenticated users to insert cost history"
  ON inventory_cost_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- NOTES FOR IMPLEMENTATION:
-- ----------------------------------------------------------------------------
-- 1. When receiving purchase orders, call record_inventory_cost() function
--    to track the cost of incoming inventory
--
-- 2. For initial setup, you may want to populate inventory_cost_history
--    with existing inventory using last_purchase_cost or a default cost
--
-- 3. The weighted average method is implemented. For FIFO/LIFO, additional
--    logic would be needed to consume inventory_cost_history records
--    in the correct order when items are sold.
--
-- 4. This system assumes costs are tracked when items are RECEIVED, not
--    when purchase orders are created.
-- ----------------------------------------------------------------------------
