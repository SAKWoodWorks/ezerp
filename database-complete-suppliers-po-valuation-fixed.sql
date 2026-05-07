-- ============================================================================
-- COMPLETE SQL FOR SUPPLIERS, PURCHASE ORDERS & INVENTORY VALUATION
-- ============================================================================
-- Execute this entire file in your Supabase SQL Editor
-- This includes all tables, functions, and policies needed for the module
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SUPPLIERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  line_id TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE suppliers IS 'Suppliers/Vendors for purchase orders';

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Allow authenticated users to view suppliers" ON suppliers;
CREATE POLICY "Allow authenticated users to view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert suppliers" ON suppliers;
CREATE POLICY "Allow authenticated users to insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update suppliers" ON suppliers;
CREATE POLICY "Allow authenticated users to update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete suppliers" ON suppliers;
CREATE POLICY "Allow authenticated users to delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 2. ADD SUPPLIER REFERENCE TO PRODUCTS
-- ----------------------------------------------------------------------------
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL;

COMMENT ON COLUMN products.supplier_id IS 'Reference to the supplier of this product';

-- ----------------------------------------------------------------------------
-- 3. PURCHASE ORDERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE purchase_orders IS 'Purchase orders for ordering inventory from suppliers';
COMMENT ON COLUMN purchase_orders.status IS 'Status: draft, sent, received, cancelled';

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view purchase orders" ON purchase_orders;
CREATE POLICY "Allow authenticated users to view purchase orders"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert purchase orders" ON purchase_orders;
CREATE POLICY "Allow authenticated users to insert purchase orders"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update purchase orders" ON purchase_orders;
CREATE POLICY "Allow authenticated users to update purchase orders"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete purchase orders" ON purchase_orders;
CREATE POLICY "Allow authenticated users to delete purchase orders"
  ON purchase_orders FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 4. PURCHASE ORDER ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id BIGINT REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

COMMENT ON TABLE purchase_order_items IS 'Line items for purchase orders';
COMMENT ON COLUMN purchase_order_items.total_price IS 'Auto-calculated: quantity × unit_price';

-- Enable RLS
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view PO items" ON purchase_order_items;
CREATE POLICY "Allow authenticated users to view PO items"
  ON purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert PO items" ON purchase_order_items;
CREATE POLICY "Allow authenticated users to insert PO items"
  ON purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update PO items" ON purchase_order_items;
CREATE POLICY "Allow authenticated users to update PO items"
  ON purchase_order_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete PO items" ON purchase_order_items;
CREATE POLICY "Allow authenticated users to delete PO items"
  ON purchase_order_items FOR DELETE
  TO authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- 5. FUNCTION: Generate Purchase Order Number
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  po_number TEXT;
BEGIN
  -- Get the highest PO number
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 3) AS INTEGER)), 0) + 1
  INTO next_number
  FROM purchase_orders
  WHERE po_number ~ '^PO[0-9]+$';

  -- Format with leading zeros (PO0001, PO0002, etc.)
  po_number := 'PO' || LPAD(next_number::TEXT, 4, '0');

  RETURN po_number;
END;
$$;

COMMENT ON FUNCTION generate_po_number IS 'Generates sequential PO numbers (PO0001, PO0002, etc.)';

-- ----------------------------------------------------------------------------
-- 6. TRIGGER: Update total_amount on purchase_orders
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the total_amount in purchase_orders
  UPDATE purchase_orders
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id)
  )
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_po_total ON purchase_order_items;
CREATE TRIGGER trigger_update_po_total
  AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_order_total();

COMMENT ON FUNCTION update_purchase_order_total IS 'Automatically updates purchase_orders.total_amount when items change';

-- ----------------------------------------------------------------------------
-- 7. INVENTORY VALUATION: Add cost tracking to products
-- ----------------------------------------------------------------------------
ALTER TABLE products
ADD COLUMN IF NOT EXISTS last_purchase_cost DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN products.last_purchase_cost IS 'Most recent purchase cost per unit (updated when receiving PO)';

-- ----------------------------------------------------------------------------
-- 8. INVENTORY COST HISTORY TABLE
-- ----------------------------------------------------------------------------
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_cost_history_product
  ON inventory_cost_history(product_id, warehouse_id, created_at DESC);

-- Enable RLS
ALTER TABLE inventory_cost_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users to view cost history" ON inventory_cost_history;
CREATE POLICY "Allow authenticated users to view cost history"
  ON inventory_cost_history FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert cost history" ON inventory_cost_history;
CREATE POLICY "Allow authenticated users to insert cost history"
  ON inventory_cost_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 9. FUNCTION: Record inventory cost
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

COMMENT ON FUNCTION record_inventory_cost IS 'Records inventory cost when receiving purchase orders';

-- ----------------------------------------------------------------------------
-- 10. FUNCTION: Get inventory valuation (Weighted Average)
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

COMMENT ON FUNCTION get_inventory_valuation_weighted_average IS 'Returns inventory valuation using weighted average cost method';

-- ----------------------------------------------------------------------------
-- 11. FUNCTION: Get inventory valuation summary by warehouse
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

COMMENT ON FUNCTION get_inventory_valuation_summary IS 'Returns inventory valuation summary by warehouse';

-- ----------------------------------------------------------------------------
-- 12. FUNCTION: Get cost analysis for a specific product
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

COMMENT ON FUNCTION get_product_cost_analysis IS 'Returns detailed cost analysis for a specific product including profit margins';

-- ----------------------------------------------------------------------------
-- VERIFICATION QUERIES (Optional - Run these to check)
-- ----------------------------------------------------------------------------
-- Uncomment to verify tables were created:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('suppliers', 'purchase_orders', 'purchase_order_items', 'inventory_cost_history');

-- Uncomment to verify functions were created:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name IN ('generate_po_number', 'record_inventory_cost',
--   'get_inventory_valuation_weighted_average', 'get_inventory_valuation_summary',
--   'get_product_cost_analysis', 'update_purchase_order_total');

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. The backend code is already configured to use these tables/functions
-- 2. Start creating suppliers and purchase orders in your app
-- 3. When you receive purchase orders, costs will be tracked automatically
-- 4. View the Inventory Valuation report at /reports/inventory-valuation
-- ============================================================================
