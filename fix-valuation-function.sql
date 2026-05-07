-- ============================================================================
-- FIX: Inventory Valuation Function - Data Type Mismatch
-- ============================================================================
-- This fixes the error: "Returned type integer does not match expected type numeric"
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DROP and RECREATE the function with correct return types
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_inventory_valuation_weighted_average();

CREATE OR REPLACE FUNCTION get_inventory_valuation_weighted_average()
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  warehouse_id BIGINT,
  warehouse_name TEXT,
  quantity NUMERIC,  -- Changed from DECIMAL to NUMERIC
  weighted_avg_cost NUMERIC,  -- Changed from DECIMAL to NUMERIC
  total_value NUMERIC,  -- Changed from DECIMAL to NUMERIC
  last_purchase_cost NUMERIC,  -- Changed from DECIMAL to NUMERIC
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
    pi.quantity::NUMERIC,  -- Explicit cast to NUMERIC
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
    )::NUMERIC AS weighted_avg_cost,
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
    )::NUMERIC AS total_value,
    p.last_purchase_cost::NUMERIC,
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
-- Also fix the summary function for consistency
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_inventory_valuation_summary();

CREATE OR REPLACE FUNCTION get_inventory_valuation_summary()
RETURNS TABLE (
  warehouse_id BIGINT,
  warehouse_name TEXT,
  total_items BIGINT,
  total_quantity NUMERIC,  -- Changed from DECIMAL to NUMERIC
  total_value NUMERIC  -- Changed from DECIMAL to NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    COUNT(DISTINCT pi.product_id)::BIGINT AS total_items,
    COALESCE(SUM(pi.quantity), 0)::NUMERIC AS total_quantity,
    COALESCE(SUM(
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
    ), 0)::NUMERIC AS total_value
  FROM warehouses w
  LEFT JOIN product_inventories pi ON pi.warehouse_id = w.id AND pi.quantity > 0
  LEFT JOIN products p ON pi.product_id = p.id
  GROUP BY w.id, w.name
  ORDER BY w.name;
END;
$$;

COMMENT ON FUNCTION get_inventory_valuation_summary IS 'Returns inventory valuation summary by warehouse';

-- ----------------------------------------------------------------------------
-- Verify the fix
-- ----------------------------------------------------------------------------
-- Test the function (should work now)
SELECT * FROM get_inventory_valuation_weighted_average() LIMIT 5;
SELECT * FROM get_inventory_valuation_summary();

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- The functions should now work correctly with the Next.js app
-- ============================================================================
