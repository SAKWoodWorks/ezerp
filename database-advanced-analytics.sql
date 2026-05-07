-- ============================================
-- Advanced Analytics & Reports Module
-- For SAK Woodworks ERP System
-- ============================================

-- ==================================================
-- 1. SALES ANALYTICS FUNCTIONS
-- ==================================================

-- Function: Get sales by period
CREATE OR REPLACE FUNCTION get_sales_by_period(
  start_date DATE,
  end_date DATE,
  period_type TEXT DEFAULT 'day' -- 'day', 'week', 'month', 'year'
)
RETURNS TABLE (
  period TEXT,
  invoice_count BIGINT,
  cash_bill_count BIGINT,
  total_revenue NUMERIC,
  invoice_revenue NUMERIC,
  cash_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH periods AS (
    SELECT
      CASE
        WHEN period_type = 'day' THEN TO_CHAR(d.date, 'YYYY-MM-DD')
        WHEN period_type = 'week' THEN TO_CHAR(d.date, 'IYYY-IW')
        WHEN period_type = 'month' THEN TO_CHAR(d.date, 'YYYY-MM')
        WHEN period_type = 'year' THEN TO_CHAR(d.date, 'YYYY')
      END as period_label,
      d.date
    FROM generate_series(start_date, end_date, '1 day'::interval) d(date)
  ),
  invoice_sales AS (
    SELECT
      CASE
        WHEN period_type = 'day' THEN TO_CHAR(i.issue_date, 'YYYY-MM-DD')
        WHEN period_type = 'week' THEN TO_CHAR(i.issue_date, 'IYYY-IW')
        WHEN period_type = 'month' THEN TO_CHAR(i.issue_date, 'YYYY-MM')
        WHEN period_type = 'year' THEN TO_CHAR(i.issue_date, 'YYYY')
      END as period_label,
      COUNT(*) as count,
      COALESCE(SUM(i.total_amount), 0) as revenue
    FROM invoices i
    WHERE i.issue_date BETWEEN start_date AND end_date
      AND i.status IN ('sent', 'paid')
    GROUP BY period_label
  ),
  cash_sales AS (
    SELECT
      CASE
        WHEN period_type = 'day' THEN TO_CHAR(c.issue_date, 'YYYY-MM-DD')
        WHEN period_type = 'week' THEN TO_CHAR(c.issue_date, 'IYYY-IW')
        WHEN period_type = 'month' THEN TO_CHAR(c.issue_date, 'YYYY-MM')
        WHEN period_type = 'year' THEN TO_CHAR(c.issue_date, 'YYYY')
      END as period_label,
      COUNT(*) as count,
      COALESCE(SUM(c.total_amount), 0) as revenue
    FROM cash_bills c
    WHERE c.issue_date BETWEEN start_date AND end_date
    GROUP BY period_label
  )
  SELECT
    DISTINCT p.period_label,
    COALESCE(i.count, 0)::BIGINT,
    COALESCE(c.count, 0)::BIGINT,
    COALESCE(i.revenue, 0) + COALESCE(c.revenue, 0),
    COALESCE(i.revenue, 0),
    COALESCE(c.revenue, 0)
  FROM periods p
  LEFT JOIN invoice_sales i ON i.period_label = p.period_label
  LEFT JOIN cash_sales c ON c.period_label = p.period_label
  ORDER BY p.period_label;
END;
$$ LANGUAGE plpgsql;

-- Function: Get top customers by revenue
CREATE OR REPLACE FUNCTION get_top_customers(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  customer_id BIGINT,
  customer_name VARCHAR,
  total_invoices BIGINT,
  total_revenue NUMERIC,
  average_order_value NUMERIC,
  last_purchase_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    COUNT(i.id)::BIGINT,
    COALESCE(SUM(i.total_amount), 0),
    COALESCE(AVG(i.total_amount), 0),
    MAX(i.issue_date)::DATE
  FROM customers c
  LEFT JOIN invoices i ON i.customer_id = c.id
  WHERE (start_date IS NULL OR i.issue_date >= start_date)
    AND (end_date IS NULL OR i.issue_date <= end_date)
    AND i.status IN ('sent', 'paid')
  GROUP BY c.id, c.name
  HAVING COUNT(i.id) > 0
  ORDER BY COALESCE(SUM(i.total_amount), 0) DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Sales conversion rate (Quotations to Invoices)
CREATE OR REPLACE FUNCTION get_sales_conversion_rate(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  total_quotations BIGINT,
  converted_quotations BIGINT,
  total_invoices BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT q.id)::BIGINT,
    COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END)::BIGINT,
    COUNT(DISTINCT i.id)::BIGINT,
    CASE
      WHEN COUNT(DISTINCT q.id) > 0
      THEN (COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.id END)::NUMERIC / COUNT(DISTINCT q.id)::NUMERIC * 100)
      ELSE 0
    END
  FROM quotations q
  LEFT JOIN invoices i ON i.customer_id = q.customer_id
    AND i.issue_date BETWEEN start_date AND end_date
  WHERE q.issue_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 2. CUSTOMER ANALYTICS FUNCTIONS
-- ==================================================

-- Function: Customer Lifetime Value
CREATE OR REPLACE FUNCTION get_customer_lifetime_value()
RETURNS TABLE (
  customer_id BIGINT,
  customer_name VARCHAR,
  first_purchase_date DATE,
  last_purchase_date DATE,
  total_orders BIGINT,
  total_spent NUMERIC,
  average_order_value NUMERIC,
  customer_age_days INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    MIN(i.issue_date)::DATE,
    MAX(i.issue_date)::DATE,
    COUNT(i.id)::BIGINT,
    COALESCE(SUM(i.total_amount), 0),
    COALESCE(AVG(i.total_amount), 0),
    COALESCE(EXTRACT(DAY FROM (MAX(i.issue_date) - MIN(i.issue_date)))::INT, 0)
  FROM customers c
  LEFT JOIN invoices i ON i.customer_id = c.id
  WHERE i.status IN ('sent', 'paid')
  GROUP BY c.id, c.name
  HAVING COUNT(i.id) > 0
  ORDER BY COALESCE(SUM(i.total_amount), 0) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Customer segmentation
CREATE OR REPLACE FUNCTION get_customer_segmentation()
RETURNS TABLE (
  segment TEXT,
  customer_count BIGINT,
  total_revenue NUMERIC,
  avg_revenue_per_customer NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH customer_revenue AS (
    SELECT
      c.id,
      c.name,
      COALESCE(SUM(i.total_amount), 0) as total_spent,
      COUNT(i.id) as order_count,
      MAX(i.issue_date) as last_order_date
    FROM customers c
    LEFT JOIN invoices i ON i.customer_id = c.id AND i.status IN ('sent', 'paid')
    GROUP BY c.id, c.name
  )
  SELECT
    CASE
      WHEN total_spent >= 100000 THEN 'VIP'
      WHEN total_spent >= 50000 THEN 'High Value'
      WHEN total_spent >= 10000 THEN 'Regular'
      WHEN total_spent > 0 THEN 'Low Value'
      ELSE 'Inactive'
    END as segment,
    COUNT(*)::BIGINT,
    SUM(total_spent),
    AVG(total_spent)
  FROM customer_revenue
  GROUP BY segment
  ORDER BY
    CASE segment
      WHEN 'VIP' THEN 1
      WHEN 'High Value' THEN 2
      WHEN 'Regular' THEN 3
      WHEN 'Low Value' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Function: Customer payment behavior
CREATE OR REPLACE FUNCTION get_customer_payment_behavior()
RETURNS TABLE (
  customer_id BIGINT,
  customer_name VARCHAR,
  total_invoices BIGINT,
  paid_on_time BIGINT,
  paid_late BIGINT,
  unpaid BIGINT,
  average_days_to_pay NUMERIC,
  payment_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH payment_stats AS (
    SELECT
      c.id,
      c.name,
      COUNT(i.id) as total,
      COUNT(CASE WHEN i.status = 'paid' AND p.payment_date <= i.due_date THEN 1 END) as on_time,
      COUNT(CASE WHEN i.status = 'paid' AND p.payment_date > i.due_date THEN 1 END) as late,
      COUNT(CASE WHEN i.status IN ('sent', 'overdue') THEN 1 END) as unpaid,
      AVG(CASE WHEN p.payment_date IS NOT NULL THEN EXTRACT(DAY FROM (p.payment_date - i.issue_date)) END) as avg_days
    FROM customers c
    LEFT JOIN invoices i ON i.customer_id = c.id
    LEFT JOIN payments p ON p.invoice_id = i.id
    GROUP BY c.id, c.name
  )
  SELECT
    id,
    name,
    total::BIGINT,
    on_time::BIGINT,
    late::BIGINT,
    unpaid::BIGINT,
    COALESCE(avg_days, 0),
    CASE
      WHEN total > 0 THEN ((on_time::NUMERIC / total::NUMERIC) * 100)
      ELSE 0
    END
  FROM payment_stats
  WHERE total > 0
  ORDER BY payment_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 3. PRODUCT PERFORMANCE FUNCTIONS
-- ==================================================

-- Function: Best and worst selling products
CREATE OR REPLACE FUNCTION get_product_performance(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_id BIGINT,
  product_name VARCHAR,
  total_quantity_sold NUMERIC,
  total_revenue NUMERIC,
  total_orders BIGINT,
  average_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH product_sales AS (
    SELECT
      p.id,
      p.name,
      SUM(
        CASE
          WHEN ii.product_id IS NOT NULL THEN ii.quantity
          WHEN cb.items IS NOT NULL THEN (
            SELECT SUM((item->>'quantity')::NUMERIC)
            FROM jsonb_array_elements(cb.items) item
            WHERE (item->>'product_id')::BIGINT = p.id
          )
          ELSE 0
        END
      ) as qty_sold,
      SUM(
        CASE
          WHEN ii.product_id IS NOT NULL THEN ii.quantity * ii.unit_price
          WHEN cb.items IS NOT NULL THEN (
            SELECT SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC)
            FROM jsonb_array_elements(cb.items) item
            WHERE (item->>'product_id')::BIGINT = p.id
          )
          ELSE 0
        END
      ) as revenue,
      COUNT(DISTINCT COALESCE(ii.invoice_id, cb.id)) as order_count
    FROM products p
    LEFT JOIN (
      SELECT
        (item->>'product_id')::BIGINT as product_id,
        (item->>'quantity')::NUMERIC as quantity,
        (item->>'unit_price')::NUMERIC as unit_price,
        i.id as invoice_id
      FROM invoices i, jsonb_array_elements(i.items) item
      WHERE (start_date IS NULL OR i.issue_date >= start_date)
        AND (end_date IS NULL OR i.issue_date <= end_date)
        AND i.status IN ('sent', 'paid')
    ) ii ON ii.product_id = p.id
    LEFT JOIN cash_bills cb ON (start_date IS NULL OR cb.issue_date >= start_date)
      AND (end_date IS NULL OR cb.issue_date <= end_date)
    GROUP BY p.id, p.name
  )
  SELECT
    id,
    name,
    COALESCE(qty_sold, 0),
    COALESCE(revenue, 0),
    COALESCE(order_count, 0)::BIGINT,
    CASE WHEN qty_sold > 0 THEN revenue / qty_sold ELSE 0 END
  FROM product_sales
  WHERE COALESCE(qty_sold, 0) > 0
  ORDER BY revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Stock turnover rate
CREATE OR REPLACE FUNCTION get_stock_turnover_rate(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  product_id BIGINT,
  product_name VARCHAR,
  current_stock NUMERIC,
  quantity_sold NUMERIC,
  average_stock NUMERIC,
  turnover_rate NUMERIC,
  days_in_period INT
) AS $$
BEGIN
  RETURN QUERY
  WITH product_movement AS (
    SELECT
      p.id,
      p.name,
      p.stock_quantity as current_stock,
      COALESCE(SUM(
        CASE
          WHEN sm.movement_type IN ('sale', 'adjustment') AND sm.quantity_change < 0
          THEN ABS(sm.quantity_change)
          ELSE 0
        END
      ), 0) as qty_sold
    FROM products p
    LEFT JOIN stock_movements sm ON sm.product_id = p.id
      AND sm.created_at::DATE BETWEEN start_date AND end_date
    GROUP BY p.id, p.name, p.stock_quantity
  )
  SELECT
    id,
    name,
    current_stock,
    qty_sold,
    (current_stock + qty_sold) / 2 as avg_stock,
    CASE
      WHEN ((current_stock + qty_sold) / 2) > 0
      THEN qty_sold / ((current_stock + qty_sold) / 2)
      ELSE 0
    END as turnover,
    EXTRACT(DAY FROM (end_date - start_date))::INT
  FROM product_movement
  WHERE current_stock > 0 OR qty_sold > 0
  ORDER BY turnover DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Slow-moving inventory
CREATE OR REPLACE FUNCTION get_slow_moving_inventory(
  days_threshold INT DEFAULT 90
)
RETURNS TABLE (
  product_id BIGINT,
  product_name VARCHAR,
  current_stock NUMERIC,
  last_sale_date DATE,
  days_since_last_sale INT,
  stock_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.stock_quantity,
    MAX(sm.created_at)::DATE as last_sale,
    COALESCE(EXTRACT(DAY FROM (NOW() - MAX(sm.created_at)))::INT, 999),
    p.stock_quantity * p.price
  FROM products p
  LEFT JOIN stock_movements sm ON sm.product_id = p.id
    AND sm.movement_type = 'sale'
  WHERE p.stock_quantity > 0
  GROUP BY p.id, p.name, p.stock_quantity, p.price
  HAVING COALESCE(EXTRACT(DAY FROM (NOW() - MAX(sm.created_at)))::INT, 999) >= days_threshold
  ORDER BY days_since_last_sale DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 4. FINANCIAL REPORTS FUNCTIONS
-- ==================================================

-- Function: Profit & Loss Statement
CREATE OR REPLACE FUNCTION get_profit_loss_statement(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  category TEXT,
  amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'Revenue - Invoices'::TEXT, COALESCE(SUM(total_amount), 0)
  FROM invoices
  WHERE issue_date BETWEEN start_date AND end_date
    AND status IN ('sent', 'paid')
  UNION ALL
  SELECT 'Revenue - Cash Bills'::TEXT, COALESCE(SUM(total_amount), 0)
  FROM cash_bills
  WHERE issue_date BETWEEN start_date AND end_date
  UNION ALL
  SELECT 'Cost of Goods Sold'::TEXT, COALESCE(SUM(
    (item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC
  ), 0) * -1
  FROM purchase_orders, jsonb_array_elements(items) item
  WHERE order_date BETWEEN start_date AND end_date
    AND status = 'received'
  UNION ALL
  SELECT 'Gross Profit'::TEXT, (
    (SELECT COALESCE(SUM(total_amount), 0) FROM invoices
     WHERE issue_date BETWEEN start_date AND end_date AND status IN ('sent', 'paid')) +
    (SELECT COALESCE(SUM(total_amount), 0) FROM cash_bills
     WHERE issue_date BETWEEN start_date AND end_date)
  ) - (
    SELECT COALESCE(SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC), 0)
    FROM purchase_orders, jsonb_array_elements(items) item
    WHERE order_date BETWEEN start_date AND end_date AND status = 'received'
  )
  UNION ALL
  SELECT 'Shipping Costs - Import'::TEXT, COALESCE(SUM(
    COALESCE(freight_cost, 0) + COALESCE(insurance_cost, 0) + COALESCE(other_charges, 0)
  ), 0) * -1
  FROM import_shipments
  WHERE estimated_arrival_date BETWEEN start_date AND end_date
  UNION ALL
  SELECT 'Shipping Costs - Export'::TEXT, COALESCE(SUM(
    COALESCE(freight_cost, 0) + COALESCE(insurance_cost, 0) + COALESCE(other_charges, 0)
  ), 0) * -1
  FROM export_shipments
  WHERE estimated_departure_date BETWEEN start_date AND end_date
  ORDER BY category;
END;
$$ LANGUAGE plpgsql;

-- Function: Cash flow analysis
CREATE OR REPLACE FUNCTION get_cash_flow_analysis(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  flow_type TEXT,
  amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  -- Cash Inflows
  SELECT 'Inflow - Payments Received'::TEXT, COALESCE(SUM(amount), 0)
  FROM payments
  WHERE payment_date BETWEEN start_date AND end_date
  UNION ALL
  SELECT 'Inflow - Cash Bills'::TEXT, COALESCE(SUM(total_amount), 0)
  FROM cash_bills
  WHERE issue_date BETWEEN start_date AND end_date
  UNION ALL
  -- Cash Outflows
  SELECT 'Outflow - Purchase Orders'::TEXT, COALESCE(SUM(total_amount), 0) * -1
  FROM purchase_orders
  WHERE order_date BETWEEN start_date AND end_date
    AND status = 'received'
  UNION ALL
  SELECT 'Outflow - Import Costs'::TEXT, COALESCE(SUM(total_landed_cost), 0) * -1
  FROM import_shipments
  WHERE warehouse_receipt_date BETWEEN start_date AND end_date
  UNION ALL
  SELECT 'Net Cash Flow'::TEXT,
    (SELECT COALESCE(SUM(amount), 0) FROM payments
     WHERE payment_date BETWEEN start_date AND end_date) +
    (SELECT COALESCE(SUM(total_amount), 0) FROM cash_bills
     WHERE issue_date BETWEEN start_date AND end_date) -
    (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders
     WHERE order_date BETWEEN start_date AND end_date AND status = 'received') -
    (SELECT COALESCE(SUM(total_landed_cost), 0) FROM import_shipments
     WHERE warehouse_receipt_date BETWEEN start_date AND end_date)
  ORDER BY flow_type;
END;
$$ LANGUAGE plpgsql;

-- Function: Accounts receivable aging
CREATE OR REPLACE FUNCTION get_accounts_receivable_aging()
RETURNS TABLE (
  age_bucket TEXT,
  invoice_count BIGINT,
  total_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) <= 0 THEN 'Current'
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) BETWEEN 1 AND 30 THEN '1-30 Days'
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) BETWEEN 31 AND 60 THEN '31-60 Days'
      WHEN EXTRACT(DAY FROM (CURRENT_DATE - i.due_date)) BETWEEN 61 AND 90 THEN '61-90 Days'
      ELSE '90+ Days'
    END as bucket,
    COUNT(*)::BIGINT,
    SUM(i.total_amount - COALESCE(
      (SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0
    ))
  FROM invoices i
  WHERE i.status IN ('sent', 'overdue')
  GROUP BY bucket
  ORDER BY
    CASE bucket
      WHEN 'Current' THEN 1
      WHEN '1-30 Days' THEN 2
      WHEN '31-60 Days' THEN 3
      WHEN '61-90 Days' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 5. SUPPLIER PERFORMANCE FUNCTIONS
-- ==================================================

-- Function: Supplier delivery performance
CREATE OR REPLACE FUNCTION get_supplier_performance()
RETURNS TABLE (
  supplier_id BIGINT,
  supplier_name VARCHAR,
  total_orders BIGINT,
  on_time_deliveries BIGINT,
  late_deliveries BIGINT,
  on_time_percentage NUMERIC,
  total_spent NUMERIC,
  average_order_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    COUNT(po.id)::BIGINT,
    COUNT(CASE WHEN po.status = 'received' AND po.expected_delivery_date >= CURRENT_DATE THEN 1 END)::BIGINT,
    COUNT(CASE WHEN po.status = 'received' AND po.expected_delivery_date < CURRENT_DATE THEN 1 END)::BIGINT,
    CASE
      WHEN COUNT(po.id) > 0
      THEN (COUNT(CASE WHEN po.status = 'received' AND po.expected_delivery_date >= CURRENT_DATE THEN 1 END)::NUMERIC / COUNT(po.id)::NUMERIC * 100)
      ELSE 0
    END,
    COALESCE(SUM(po.total_amount), 0),
    COALESCE(AVG(po.total_amount), 0)
  FROM suppliers s
  LEFT JOIN purchase_orders po ON po.supplier_id = s.id
  GROUP BY s.id, s.name
  HAVING COUNT(po.id) > 0
  ORDER BY on_time_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 6. WAREHOUSE ANALYTICS FUNCTIONS
-- ==================================================

-- Function: Warehouse inventory turnover
CREATE OR REPLACE FUNCTION get_warehouse_turnover(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  warehouse_id BIGINT,
  warehouse_name VARCHAR,
  total_stock_value NUMERIC,
  total_sales NUMERIC,
  turnover_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH warehouse_stock AS (
    SELECT
      w.id,
      w.name,
      COALESCE(SUM(ws.quantity * p.price), 0) as stock_value
    FROM warehouses w
    LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
    LEFT JOIN products p ON p.id = ws.product_id
    GROUP BY w.id, w.name
  ),
  warehouse_sales AS (
    SELECT
      cb.warehouse_id,
      COALESCE(SUM(cb.total_amount), 0) as sales
    FROM cash_bills cb
    WHERE cb.issue_date BETWEEN start_date AND end_date
    GROUP BY cb.warehouse_id
  )
  SELECT
    ws.id,
    ws.name,
    ws.stock_value,
    COALESCE(wsa.sales, 0),
    CASE
      WHEN ws.stock_value > 0 THEN COALESCE(wsa.sales, 0) / ws.stock_value
      ELSE 0
    END
  FROM warehouse_stock ws
  LEFT JOIN warehouse_sales wsa ON wsa.warehouse_id = ws.id
  ORDER BY turnover_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 7. SHIPMENT ANALYTICS FUNCTIONS
-- ==================================================

-- Function: Import/Export volume analysis
CREATE OR REPLACE FUNCTION get_shipment_analytics(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  shipment_type TEXT,
  total_shipments BIGINT,
  total_volume NUMERIC,
  total_weight NUMERIC,
  total_value NUMERIC,
  average_cost_per_shipment NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Import'::TEXT,
    COUNT(*)::BIGINT,
    COALESCE(SUM(volume_m3), 0),
    COALESCE(SUM(weight_kg), 0),
    COALESCE(SUM(total_value), 0),
    COALESCE(AVG(total_landed_cost), 0)
  FROM import_shipments
  WHERE estimated_arrival_date BETWEEN start_date AND end_date
  UNION ALL
  SELECT
    'Export'::TEXT,
    COUNT(*)::BIGINT,
    COALESCE(SUM(volume_m3), 0),
    COALESCE(SUM(weight_kg), 0),
    COALESCE(SUM(total_value), 0),
    COALESCE(AVG(total_cost), 0)
  FROM export_shipments
  WHERE estimated_departure_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function: Customs clearance time analysis
CREATE OR REPLACE FUNCTION get_customs_clearance_stats()
RETURNS TABLE (
  average_clearance_days NUMERIC,
  min_clearance_days INT,
  max_clearance_days INT,
  total_cleared BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(EXTRACT(DAY FROM (customs_clearance_date - actual_arrival_date)))::NUMERIC,
    MIN(EXTRACT(DAY FROM (customs_clearance_date - actual_arrival_date)))::INT,
    MAX(EXTRACT(DAY FROM (customs_clearance_date - actual_arrival_date)))::INT,
    COUNT(*)::BIGINT
  FROM import_shipments
  WHERE customs_clearance_date IS NOT NULL
    AND actual_arrival_date IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================

CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_cash_bills_issue_date ON cash_bills(issue_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);

-- ==================================================
-- COMMENTS
-- ==================================================

COMMENT ON FUNCTION get_sales_by_period IS 'Get sales data aggregated by time period (day/week/month/year)';
COMMENT ON FUNCTION get_top_customers IS 'Get top customers ranked by revenue';
COMMENT ON FUNCTION get_sales_conversion_rate IS 'Calculate quotation to invoice conversion rate';
COMMENT ON FUNCTION get_customer_lifetime_value IS 'Calculate lifetime value for each customer';
COMMENT ON FUNCTION get_customer_segmentation IS 'Segment customers by spending level';
COMMENT ON FUNCTION get_product_performance IS 'Analyze product sales performance';
COMMENT ON FUNCTION get_stock_turnover_rate IS 'Calculate inventory turnover rate by product';
COMMENT ON FUNCTION get_slow_moving_inventory IS 'Identify slow-moving or dead stock';
COMMENT ON FUNCTION get_profit_loss_statement IS 'Generate P&L statement for a period';
COMMENT ON FUNCTION get_cash_flow_analysis IS 'Analyze cash inflows and outflows';
COMMENT ON FUNCTION get_accounts_receivable_aging IS 'Age outstanding receivables by bucket';
COMMENT ON FUNCTION get_supplier_performance IS 'Evaluate supplier delivery performance';
COMMENT ON FUNCTION get_warehouse_turnover IS 'Calculate warehouse inventory turnover';
COMMENT ON FUNCTION get_shipment_analytics IS 'Analyze import/export shipment volumes and costs';
COMMENT ON FUNCTION get_customs_clearance_stats IS 'Analyze customs clearance time statistics';
