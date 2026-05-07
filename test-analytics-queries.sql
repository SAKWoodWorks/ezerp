-- ============================================
-- Test Queries for Analytics Dashboard
-- Run these in Supabase SQL Editor to diagnose issues
-- ============================================

-- 1. Check if RPC functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- 2. Verify you have data in key tables
SELECT 
  'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'cash_bills', COUNT(*) FROM cash_bills
UNION ALL
SELECT 'quotations', COUNT(*) FROM quotations
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'import_shipments', COUNT(*) FROM import_shipments
UNION ALL
SELECT 'export_shipments', COUNT(*) FROM export_shipments;

-- 3. Check invoice date range
SELECT 
  MIN(invoice_date)::TEXT as first_invoice,
  MAX(invoice_date)::TEXT as last_invoice,
  COUNT(*) as total_invoices,
  SUM(total_amount) as total_revenue
FROM invoices
WHERE status != 'cancelled';

-- 4. Test each RPC function

-- 4a. Sales by period (last 30 days)
SELECT * FROM get_sales_by_period(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  'day'
) LIMIT 5;

-- 4b. Top customers
SELECT * FROM get_top_customers(NULL, NULL, 5);

-- 4c. Sales conversion rate
SELECT * FROM get_sales_conversion_rate(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);

-- 4d. Customer lifetime value
SELECT * FROM get_customer_lifetime_value() LIMIT 5;

-- 4e. Customer segmentation
SELECT * FROM get_customer_segmentation();

-- 4f. Customer payment behavior
SELECT * FROM get_customer_payment_behavior() LIMIT 5;

-- 4g. Product performance
SELECT * FROM get_product_performance(NULL, NULL) LIMIT 5;

-- 4h. Stock turnover rate
SELECT * FROM get_stock_turnover_rate(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
) LIMIT 5;

-- 4i. Slow moving inventory
SELECT * FROM get_slow_moving_inventory(90) LIMIT 5;

-- 4j. Accounts receivable aging
SELECT * FROM get_accounts_receivable_aging();

-- 4k. Supplier performance
SELECT * FROM get_supplier_performance() LIMIT 5;

-- 4l. Warehouse turnover
SELECT * FROM get_warehouse_turnover(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);

-- 4m. Shipment analytics
SELECT * FROM get_shipment_analytics(
  CURRENT_DATE - INTERVAL '90 days',
  CURRENT_DATE
);

-- 4n. Customs clearance stats
SELECT * FROM get_customs_clearance_stats();

-- 5. Check for any errors in logs (if available)
-- Note: You may need to check Supabase Dashboard > Database > Logs

-- 6. Verify RLS policies allow access
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'invoices', 'products')
ORDER BY tablename, policyname;

