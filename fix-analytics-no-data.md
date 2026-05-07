# Fix Analytics Dashboard "No Data" Issue

## Step 1: Apply Database Functions

You need to run the SQL migration files in your Supabase database:

### In Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Create a new query
5. Copy and paste the contents of `database-advanced-analytics.sql`
6. Click **Run** to create all RPC functions

## Step 2: Verify RPC Functions Were Created

Run this query in Supabase SQL Editor to check:

```sql
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'get_%'
ORDER BY routine_name;
```

You should see functions like:
- get_sales_by_period
- get_top_customers
- get_customer_lifetime_value
- get_product_performance
- etc.

## Step 3: Check if You Have Data

Run these queries to verify you have data:

```sql
-- Check customers
SELECT COUNT(*) as customer_count FROM customers;

-- Check invoices
SELECT COUNT(*) as invoice_count FROM invoices;

-- Check products
SELECT COUNT(*) as product_count FROM products;

-- Check date range of invoices
SELECT 
  MIN(invoice_date) as first_invoice,
  MAX(invoice_date) as last_invoice,
  COUNT(*) as total_invoices
FROM invoices;
```

## Step 4: Test RPC Functions Directly

Test if the functions work in Supabase:

```sql
-- Test sales by period
SELECT * FROM get_sales_by_period(
  '2025-01-01'::DATE,
  '2025-12-31'::DATE,
  'month'
);

-- Test top customers
SELECT * FROM get_top_customers(NULL, NULL, 10);

-- Test customer segmentation
SELECT * FROM get_customer_segmentation();
```

## Step 5: Check Browser Console

Open your analytics page and check browser console (F12) for errors:
- Look for "Error fetching..." messages
- Check Network tab for failed API calls
- Verify the RPC calls are being made

## Step 6: Add Sample Data (if needed)

If you don't have enough data, create some test records:
- Add 5-10 customers
- Create 10-20 invoices with different dates
- Add products and stock movements
- Create some quotations

## Common Issues:

1. **RPC functions not created** → Run SQL file in Supabase
2. **No data in date range** → Check invoice dates match the filter period
3. **RLS (Row Level Security)** → Ensure authenticated users can access data
4. **Function errors** → Check Supabase logs for errors

## Quick Test Command:

You can test the analytics actions from the server:

```bash
npm run dev
# Then visit: http://localhost:3000/reports/analytics
```

