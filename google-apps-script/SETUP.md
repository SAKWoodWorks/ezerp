# Google Sheets → Supabase Stock Sync — Setup Guide

## Step 1: Run the SQL migration

In Supabase Dashboard → SQL Editor, paste and run:
`database-stock-by-grade.sql`

## Step 2: Map CODEs to products

In Supabase Dashboard → Table Editor → `products`:
- Fill in the `barcode` column with the CODE value from the sheet for each product
- Example: product "Pine 2x4" → barcode = "PT4S20966000"

## Step 3: Get your warehouse IDs

In Supabase Dashboard → Table Editor → `warehouses`:
- Note the `id` for Pathum Thani
- Note the `id` for Chanthaburi
- Note the `id` for Chiang Mai

## Step 4: Open Google Apps Script

In your Google Sheet → Extensions → Apps Script

## Step 5: Paste the script

- Delete all existing code in `Code.gs`
- Paste the full contents of `sync-stock.gs`
- Save (Ctrl+S)

## Step 6: Set Script Properties (secrets — never put in code)

In Apps Script → Project Settings (gear icon) → Script Properties → Add property:

| Property | Value |
|---|---|
| `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key from Supabase Settings → API) |
| `WAREHOUSE_PT_ID` | e.g. `1` (Pathum Thani warehouse ID) |
| `WAREHOUSE_CT_ID` | e.g. `2` (Chanthaburi warehouse ID) |
| `WAREHOUSE_CM_ID` | e.g. `3` (Chiang Mai warehouse ID) |

## Step 7: Test manually first

- In Apps Script editor, select `syncStockToSupabase` from the function dropdown
- Click **Run**
- Authorize when prompted (first time only)
- Check the **"Sync Log"** tab in your Google Sheet

Expected log entry:
```
Sync complete — Success: N, Skipped (empty): M, Errors: 0
```

If you see "CODE not found" warnings → those products don't have `barcode` set yet (Step 2).

## Step 8: Install the onChange trigger

- In Apps Script editor, select `setupTrigger` from the function dropdown
- Click **Run**
- Check "Sync Log" tab — should show "onChange trigger installed successfully"

From now on, every time someone edits the sheet, the sync runs automatically.

## Step 9: Verify in Supabase

Run in SQL Editor:
```sql
SELECT
  p.name,
  p.barcode AS code,
  w.name AS warehouse,
  s.grade_a,
  s.cca_ready,
  s.grade_cca,
  s.grade_b,
  s.synced_at
FROM product_stock_by_grade s
JOIN products p ON p.id = s.product_id
JOIN warehouses w ON w.id = s.warehouse_id
ORDER BY s.synced_at DESC
LIMIT 20;
```

## Troubleshooting

| Problem | Fix |
|---|---|
| "CODE not found" for every row | Check that `barcode` column is filled in `products` table |
| HTTP 401 error | Service role key is wrong or missing |
| HTTP 404 error | Supabase URL is wrong or table doesn't exist yet |
| Trigger not firing | Re-run `setupTrigger()` function |
| Wrong stock numbers | Verify column letters in the sheet match the `COL` config in `sync-stock.gs` |
