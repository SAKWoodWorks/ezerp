# Google Sheets → Supabase Stock Sync Design

**Date:** 2026-04-29

## Goal

Automatically sync realtime stock data from a Google Sheets file into the EZ-ERP Supabase database whenever the sheet changes.

## Constraints

- Google Sheet is the **master source** — sync is one-way: Sheets → DB
- Products are identified by `CODE` column in the sheet = `barcode` in `products` table
- Initial product mapping is done **manually** by the user (set `barcode = CODE` in Supabase)
- Stock is tracked **per grade** per warehouse (Grade A, CCA-Ready, Grade CCA, Grade B)
- Sync must be **near-realtime** — triggered automatically on sheet change

## Sheet Structure (Row 17+ headers)

```
CODE | No. | [PATHUM THANI: Grade A, CCA-Ready, Grade CCA, Grade B] | totals... | [CHANTHABURI: Grade A, CCA-Ready, Grade CCA, Grade B] | ... | [CHIANG MAI: Grade A, CCA-Ready, Grade CCA, Grade B] | ...
```

Data rows start at row 22.

## Architecture

```
Google Sheet (onChange)
    → Google Apps Script
        → Supabase REST API (service role key)
            → UPSERT product_stock_by_grade table
```

No Next.js API route needed. Apps Script calls Supabase directly.

## Database Schema

### New table: `product_stock_by_grade`

```sql
CREATE TABLE product_stock_by_grade (
  id           BIGSERIAL PRIMARY KEY,
  product_id   BIGINT REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE CASCADE,
  grade_a      NUMERIC DEFAULT 0,
  cca_ready    NUMERIC DEFAULT 0,
  grade_cca    NUMERIC DEFAULT 0,
  grade_b      NUMERIC DEFAULT 0,
  synced_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);
```

### Warehouse column mapping (Apps Script config)

| Sheet Section | Supabase warehouse name |
|---|---|
| PATHUM THANI | Pathum Thani (or matching name in warehouses table) |
| CHANTHABURI | Chanthaburi |
| CHIANG MAI | Chiang Mai |

Column indices for each warehouse section are hardcoded in the Apps Script.

## Google Apps Script

- **Trigger**: `onChange` (installable trigger) — fires on any sheet edit
- **Logic**:
  1. Read all rows from row 22 downward
  2. Skip rows where CODE cell is empty
  3. For each CODE: look up `product_id` via Supabase REST (`products?barcode=eq.CODE&select=id`)
  4. For each of 3 warehouses: extract 4 grade columns → upsert into `product_stock_by_grade`
  5. Log success/error to a "Sync Log" sheet tab
- **Auth**: Supabase service role key stored in Apps Script Properties (not hardcoded)

## EZ-ERP App Changes

- New page `/reports/stock-by-grade` (optional later) to display the synced data
- Existing warehouse summary can optionally read from `product_stock_by_grade`

## Security

- Service role key stored in **Apps Script Script Properties** (not in sheet cells or code)
- RLS on `product_stock_by_grade`: only service role can INSERT/UPDATE; authenticated users can SELECT

## What is NOT in scope

- Syncing back from DB to sheet
- Syncing incoming container data (ETA, cost columns)
- Auto-creating products from the sheet
