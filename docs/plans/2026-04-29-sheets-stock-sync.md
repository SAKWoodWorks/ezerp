# Google Sheets → Supabase Stock Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sync per-grade stock quantities from a Google Sheet into Supabase automatically whenever the sheet changes, using Google Apps Script calling the Supabase REST API directly.

**Architecture:** A new `product_stock_by_grade` table stores stock per product per warehouse per grade. An Apps Script `onChange` trigger reads rows from row 22 downward, matches each CODE to a product by `barcode`, then upserts grade quantities for 3 warehouses (Pathum Thani, Chanthaburi, Chiang Mai). The service role key is stored in Apps Script Script Properties — never in code.

**Tech Stack:** Google Apps Script, Supabase REST API, PostgreSQL (Supabase), Next.js (optional view page)

---

## Pre-requisites (Manual — do these first)

1. **Map CODEs to products**: In Supabase Dashboard → Table Editor → `products`, fill in the `barcode` column with the corresponding CODE value from the sheet for each product. This is a one-time manual step.

2. **Get your Supabase credentials**: You'll need:
   - `SUPABASE_URL` — from Supabase Dashboard → Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Settings → API → service_role key (keep this secret)

3. **Find your warehouse IDs**: In Supabase Dashboard → Table Editor → `warehouses`, note the `id` values for Pathum Thani, Chanthaburi, and Chiang Mai warehouses.

---

## Task 1: Database migration — create product_stock_by_grade table

**Files:**
- Create: `database-stock-by-grade.sql`

**Step 1: Write the SQL migration**

```sql
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

-- Only service role can write (Apps Script uses service role key)
-- No INSERT/UPDATE policy needed — service role bypasses RLS by default
```

**Step 2: Run in Supabase SQL Editor**

Paste and execute. Verify the table appears in Table Editor.

**Step 3: Verify the table**

Run this query in SQL Editor to confirm structure:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_stock_by_grade'
ORDER BY ordinal_position;
```

Expected: 8 columns — id, product_id, warehouse_id, grade_a, cca_ready, grade_cca, grade_b, synced_at

**Step 4: Commit the migration file**

```bash
git add database-stock-by-grade.sql
git commit -m "feat: add product_stock_by_grade table migration"
```

---

## Task 2: Find sheet column positions

Before writing the Apps Script, you must identify the exact column numbers (1-based) for each grade in each warehouse section.

**Step 1: Open the sheet**

Open the Google Sheet. Look at rows 17–20 which contain the multi-row headers.

**Step 2: Find column indices**

For each warehouse section, note which column letter corresponds to each grade. Right-click a column header to see its letter, then convert to number (A=1, B=2, ... Z=26, AA=27, etc.).

Fill in this table (example values — verify against your actual sheet):

| Data | Column Letter | Column Number |
|---|---|---|
| CODE | A | 1 |
| Pathum Thani — Grade A | C | 3 |
| Pathum Thani — CCA-Ready | D | 4 |
| Pathum Thani — Grade CCA | E | 5 |
| Pathum Thani — Grade B | F | 6 |
| Chanthaburi — Grade A | R | 18 |
| Chanthaburi — CCA-Ready | S | 19 |
| Chanthaburi — Grade CCA | T | 20 |
| Chanthaburi — Grade B | U | 21 |
| Chiang Mai — Grade A | W | 23 |
| Chiang Mai — CCA-Ready | X | 24 |
| Chiang Mai — Grade CCA | Y | 25 |
| Chiang Mai — Grade B | Z | 26 |

**Step 3: Note the first data row**

Data starts at row 22. Rows 1–21 are headers and summary rows — skip them.

---

## Task 3: Google Apps Script — core sync function

**Step 1: Open Apps Script**

In Google Sheets → Extensions → Apps Script. This opens the script editor.

**Step 2: Store secrets in Script Properties**

In Apps Script editor → Project Settings (gear icon) → Script Properties → Add:
- `SUPABASE_URL` = `https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJ...` (your service role key)
- `WAREHOUSE_PT_ID` = `1` (Pathum Thani warehouse ID from your DB)
- `WAREHOUSE_CT_ID` = `2` (Chanthaburi warehouse ID from your DB)
- `WAREHOUSE_CM_ID` = `3` (Chiang Mai warehouse ID from your DB)

**Step 3: Write the sync script**

Replace the contents of `Code.gs` with:

```javascript
// ============================================================
// COLUMN CONFIGURATION — update these to match your sheet
// ============================================================
const COL = {
  CODE: 1,           // Column A
  // Pathum Thani
  PT_GRADE_A:   3,   // Column C — verify against your sheet
  PT_CCA_READY: 4,   // Column D
  PT_GRADE_CCA: 5,   // Column E
  PT_GRADE_B:   6,   // Column F
  // Chanthaburi — update after checking your sheet
  CT_GRADE_A:   18,  // Column R — verify against your sheet
  CT_CCA_READY: 19,  // Column S
  CT_GRADE_CCA: 20,  // Column T
  CT_GRADE_B:   21,  // Column U
  // Chiang Mai — update after checking your sheet
  CM_GRADE_A:   23,  // Column W — verify against your sheet
  CM_CCA_READY: 24,  // Column X
  CM_GRADE_CCA: 25,  // Column Y
  CM_GRADE_B:   26,  // Column Z
};

const DATA_START_ROW = 22; // First row with product data

// ============================================================
// MAIN SYNC FUNCTION
// ============================================================
function syncStockToSupabase() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  const ptId = Number(props.getProperty('WAREHOUSE_PT_ID'));
  const ctId = Number(props.getProperty('WAREHOUSE_CT_ID'));
  const cmId = Number(props.getProperty('WAREHOUSE_CM_ID'));

  if (!supabaseUrl || !serviceKey) {
    logSync('ERROR', 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Script Properties');
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();

  if (lastRow < DATA_START_ROW) {
    logSync('INFO', 'No data rows found');
    return;
  }

  // Read all data at once (faster than row-by-row)
  const numRows = lastRow - DATA_START_ROW + 1;
  const maxCol = Math.max(
    COL.PT_GRADE_B, COL.CT_GRADE_B, COL.CM_GRADE_B
  );
  const data = sheet.getRange(DATA_START_ROW, 1, numRows, maxCol).getValues();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceKey}`,
    'apikey': serviceKey,
    'Prefer': 'resolution=merge-duplicates',
  };

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const code = String(row[COL.CODE - 1]).trim();

    // Skip empty rows
    if (!code || code === '') continue;

    // Look up product_id by barcode (CODE)
    const productId = getProductIdByBarcode(supabaseUrl, serviceKey, code);
    if (!productId) {
      logSync('WARN', `CODE not found in products table: ${code}`);
      errorCount++;
      continue;
    }

    // Build upsert payload for all 3 warehouses
    const records = [
      {
        product_id: productId,
        warehouse_id: ptId,
        grade_a:   toNum(row[COL.PT_GRADE_A - 1]),
        cca_ready: toNum(row[COL.PT_CCA_READY - 1]),
        grade_cca: toNum(row[COL.PT_GRADE_CCA - 1]),
        grade_b:   toNum(row[COL.PT_GRADE_B - 1]),
        synced_at: new Date().toISOString(),
      },
      {
        product_id: productId,
        warehouse_id: ctId,
        grade_a:   toNum(row[COL.CT_GRADE_A - 1]),
        cca_ready: toNum(row[COL.CT_CCA_READY - 1]),
        grade_cca: toNum(row[COL.CT_GRADE_CCA - 1]),
        grade_b:   toNum(row[COL.CT_GRADE_B - 1]),
        synced_at: new Date().toISOString(),
      },
      {
        product_id: productId,
        warehouse_id: cmId,
        grade_a:   toNum(row[COL.CM_GRADE_A - 1]),
        cca_ready: toNum(row[COL.CM_CCA_READY - 1]),
        grade_cca: toNum(row[COL.CM_GRADE_CCA - 1]),
        grade_b:   toNum(row[COL.CM_GRADE_B - 1]),
        synced_at: new Date().toISOString(),
      },
    ];

    // Upsert to Supabase
    const response = UrlFetchApp.fetch(
      `${supabaseUrl}/rest/v1/product_stock_by_grade`,
      {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(records),
        muteHttpExceptions: true,
      }
    );

    if (response.getResponseCode() >= 300) {
      logSync('ERROR', `Row ${DATA_START_ROW + i} (${code}): ${response.getContentText()}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  logSync('INFO', `Sync complete. Success: ${successCount}, Errors: ${errorCount}`);
}

// ============================================================
// HELPERS
// ============================================================

// Cache product lookups to avoid N+1 API calls
const _productCache = {};

function getProductIdByBarcode(supabaseUrl, serviceKey, barcode) {
  if (_productCache[barcode] !== undefined) return _productCache[barcode];

  const response = UrlFetchApp.fetch(
    `${supabaseUrl}/rest/v1/products?barcode=eq.${encodeURIComponent(barcode)}&select=id&limit=1`,
    {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      muteHttpExceptions: true,
    }
  );

  if (response.getResponseCode() !== 200) {
    _productCache[barcode] = null;
    return null;
  }

  const results = JSON.parse(response.getContentText());
  const id = results.length > 0 ? results[0].id : null;
  _productCache[barcode] = id;
  return id;
}

function toNum(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

function logSync(level, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName('Sync Log');
  if (!logSheet) {
    logSheet = ss.insertSheet('Sync Log');
    logSheet.appendRow(['Timestamp', 'Level', 'Message']);
  }
  logSheet.appendRow([new Date().toISOString(), level, message]);
  console.log(`[${level}] ${message}`);
}
```

**Step 4: Manually test the sync**

In Apps Script editor, select `syncStockToSupabase` from the function dropdown → click Run.

Check the "Sync Log" sheet tab in your Google Sheet — you should see "Sync complete. Success: N, Errors: 0".

Also verify in Supabase Table Editor → `product_stock_by_grade` that rows were created.

**Step 5: Fix any column mismatches**

If you see "CODE not found" errors, either:
- The CODE isn't set in the `barcode` column yet (do the manual mapping)
- The column indices in `COL` config are wrong (check the sheet columns)

---

## Task 4: Set up onChange trigger

**Step 1: Open Apps Script trigger settings**

In Apps Script editor → left sidebar → Triggers (clock icon) → Add Trigger.

**Step 2: Configure the trigger**

- Function to run: `syncStockToSupabase`
- Deployment: Head
- Event source: From spreadsheet
- Event type: **On change**
- Failure notifications: Notify me daily

Click Save. Authorize when prompted.

**Step 3: Test the trigger**

Edit any cell in the data section of the sheet → the trigger fires automatically.

Wait 10–30 seconds → check "Sync Log" tab for a new entry.

**Step 4: Verify in Supabase**

Query the table in SQL Editor:
```sql
SELECT p.name, w.name AS warehouse, s.grade_a, s.cca_ready, s.grade_cca, s.grade_b, s.synced_at
FROM product_stock_by_grade s
JOIN products p ON p.id = s.product_id
JOIN warehouses w ON w.id = s.warehouse_id
ORDER BY s.synced_at DESC
LIMIT 20;
```

Expected: rows with fresh `synced_at` timestamps matching when you edited the sheet.

---

## Task 5: Stock by Grade page in EZ-ERP (optional)

**Files:**
- Create: `src/app/reports/stock-by-grade/page.tsx`

**Step 1: Create the page**

```typescript
// src/app/reports/stock-by-grade/page.tsx
import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function StockByGradePage() {
  const supabase = await createClient()
  const t = await getTranslations("StockByGrade")

  const { data, error } = await supabase
    .from("product_stock_by_grade")
    .select(`
      grade_a, cca_ready, grade_cca, grade_b, synced_at,
      products (name, barcode),
      warehouses (name)
    `)
    .order("synced_at", { ascending: false })

  if (error) {
    console.error("Error fetching stock by grade:", error)
  }

  const rows = data ?? []
  const lastSync = rows[0]?.synced_at
    ? new Date(rows[0].synced_at).toLocaleString("th-TH")
    : "—"

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("lastSync")}: {lastSync}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("product")}</TableHead>
            <TableHead>{t("code")}</TableHead>
            <TableHead>{t("warehouse")}</TableHead>
            <TableHead className="text-right">{t("gradeA")}</TableHead>
            <TableHead className="text-right">{t("ccaReady")}</TableHead>
            <TableHead className="text-right">{t("gradeCCA")}</TableHead>
            <TableHead className="text-right">{t("gradeB")}</TableHead>
            <TableHead className="text-right">{t("total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const total =
              Number(row.grade_a) +
              Number(row.cca_ready) +
              Number(row.grade_cca) +
              Number(row.grade_b)
            return (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  {(row.products as { name: string })?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {(row.products as { barcode: string })?.barcode ?? "—"}
                </TableCell>
                <TableCell>
                  {(row.warehouses as { name: string })?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right">{Number(row.grade_a).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(row.cca_ready).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(row.grade_cca).toLocaleString()}</TableCell>
                <TableCell className="text-right">{Number(row.grade_b).toLocaleString()}</TableCell>
                <TableCell className="text-right font-semibold">{total.toLocaleString()}</TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                {t("noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

**Step 2: Add translations**

In `messages/th.json`, `messages/en.json`, `messages/ru.json` — add inside the top-level JSON object:

**th.json:**
```json
"StockByGrade": {
  "title": "สต็อกตามเกรด (จาก Google Sheets)",
  "lastSync": "ซิงค์ล่าสุด",
  "product": "สินค้า",
  "code": "CODE",
  "warehouse": "คลังสินค้า",
  "gradeA": "เกรด A",
  "ccaReady": "CCA-Ready",
  "gradeCCA": "เกรด CCA",
  "gradeB": "เกรด B",
  "total": "รวม",
  "noData": "ยังไม่มีข้อมูลจาก Google Sheets"
}
```

**en.json:**
```json
"StockByGrade": {
  "title": "Stock by Grade (from Google Sheets)",
  "lastSync": "Last synced",
  "product": "Product",
  "code": "CODE",
  "warehouse": "Warehouse",
  "gradeA": "Grade A",
  "ccaReady": "CCA-Ready",
  "gradeCCA": "Grade CCA",
  "gradeB": "Grade B",
  "total": "Total",
  "noData": "No data synced from Google Sheets yet"
}
```

**ru.json:**
```json
"StockByGrade": {
  "title": "Сток по грейдам (из Google Sheets)",
  "lastSync": "Последняя синхронизация",
  "product": "Товар",
  "code": "КОД",
  "warehouse": "Склад",
  "gradeA": "Грейд A",
  "ccaReady": "CCA-Ready",
  "gradeCCA": "Грейд CCA",
  "gradeB": "Грейд B",
  "total": "Итого",
  "noData": "Данные из Google Sheets ещё не синхронизированы"
}
```

**Step 3: Add link to Sidebar under Reports**

In `src/components/Sidebar.tsx`, add to the `main` section items after reports:

```typescript
import { BarChart2, TableProperties } from "lucide-react"

// In main section items:
{ href: "/reports/stock-by-grade", label: t("stockByGrade"), icon: TableProperties },
```

Add to all three message files under `"Sidebar"`:
```json
"stockByGrade": "สต็อกตามเกรด"   // th
"stockByGrade": "Stock by Grade"   // en
"stockByGrade": "Сток по грейдам" // ru
```

**Step 4: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "stock-by-grade" | head -10
```

Expected: no errors

**Step 5: Commit**

```bash
git add src/app/reports/stock-by-grade/page.tsx src/components/Sidebar.tsx messages/
git commit -m "feat: add stock-by-grade report page synced from Google Sheets"
```

---

## Verification Checklist

- [ ] `product_stock_by_grade` table exists in Supabase with correct columns
- [ ] At least one product has `barcode` set to a CODE value from the sheet
- [ ] Apps Script `syncStockToSupabase()` runs manually without errors
- [ ] "Sync Log" sheet tab shows "Sync complete. Success: N, Errors: 0"
- [ ] `product_stock_by_grade` rows exist in Supabase after manual run
- [ ] Editing a cell in the sheet triggers automatic sync (check Sync Log)
- [ ] `/reports/stock-by-grade` page displays synced data with correct warehouse and grade columns
- [ ] `synced_at` timestamp updates after each sheet edit
