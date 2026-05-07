# 🔧 Analytics Dashboard "No Data" - Complete Fix Guide

## Problem
Your analytics dashboard shows all zeros/empty data as shown in the screenshot.

## Root Cause
The PostgreSQL RPC functions haven't been created in your Supabase database yet.

---

## 🚀 Step-by-Step Fix

### Step 1: Apply Analytics Functions to Database

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: **SQL Editor** (left sidebar)

2. **Run the Analytics SQL**
   - Click "New Query"
   - Open file: `database-advanced-analytics.sql` 
   - Copy ALL contents (24KB file)
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`
   - Wait for "Success" message

3. **Verify Functions Were Created**
   - Use the test queries in: `test-analytics-queries.sql`
   - Run Query #1 to see all functions
   - You should see 16+ functions starting with `get_`

---

### Step 2: Check Your Data

Run this query in Supabase:

```sql
SELECT 
  'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices  
UNION ALL SELECT 'products', COUNT(*) FROM products;
```

**If all counts are 0**, you need sample data (see Step 3).

---

### Step 3: Add Sample Data (Optional)

If your database is empty:

1. Get your user ID:
   ```sql
   SELECT id FROM auth.users LIMIT 1;
   ```

2. Open `generate-sample-data.sql`

3. Replace `YOUR_USER_ID_HERE` with your actual user ID

4. Run the entire script in Supabase

5. This creates:
   - 3 customers
   - 2 products  
   - 5 invoices
   - 3 quotations
   - 3 cash bills
   - 1 supplier
   - 1 import shipment
   - 1 export shipment

---

### Step 4: Test Individual Functions

Use `test-analytics-queries.sql` - run each section:

```sql
-- Test top customers
SELECT * FROM get_top_customers(NULL, NULL, 5);

-- Test customer segmentation  
SELECT * FROM get_customer_segmentation();

-- Test sales by period
SELECT * FROM get_sales_by_period(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  'day'
);
```

If these return data, the functions work!

---

### Step 5: Refresh Your Dashboard

1. Go back to: http://localhost:3000/reports/analytics
2. Press `Ctrl+Shift+R` (hard refresh)
3. Check browser console (F12) for errors
4. Data should now appear!

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `fix-analytics-no-data.md` | Detailed troubleshooting guide |
| `test-analytics-queries.sql` | Test all 16 RPC functions |
| `generate-sample-data.sql` | Create sample data if DB is empty |
| `ANALYTICS-FIX-README.md` | This file |

---

## ✅ Expected Results After Fix

Your dashboard should show:

- **อัตราการแปลง** (Conversion Rate): ~66.7% (2 of 3 quotations converted)
- **ลูกค้าอันดับต้น** (Top Customers): 3 customers with purchase history
- **สินค้าขายดี** (Top Products): Product performance data
- **สินค้าคล้องในเก็บช้า** (Slow Moving): Inventory analysis
- **กำไร-ขาดทุน** (P&L): Revenue and expenses
- **อายุลูกหนี้** (AR Aging): Invoice payment status

---

## 🐛 Still Not Working?

### Check these:

1. **Browser Console Errors**
   - Press F12
   - Look for red errors
   - Check Network tab for failed requests

2. **Supabase Logs**
   - Dashboard > Logs > Postgres Logs
   - Look for function errors

3. **RLS Policies**
   - Ensure authenticated users can access all tables
   - Check policies in Database > Policies

4. **Date Range**
   - Your invoices might be outside the default date range
   - Check invoice dates match the period shown in UI

---

## 📞 Quick Commands

```bash
# Start dev server
npm run dev

# Check for errors
npm run lint

# Run tests
npm test
```

---

## 🎯 What You Need To Do NOW

1. ✅ Open Supabase SQL Editor
2. ✅ Copy/paste `database-advanced-analytics.sql`
3. ✅ Run it
4. ✅ Verify with `test-analytics-queries.sql`  
5. ✅ Refresh your analytics page

That's it! Your analytics should work after Step 1-2.

