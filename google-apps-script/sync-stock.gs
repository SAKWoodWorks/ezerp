// ============================================================
// COLUMN CONFIGURATION (verified 2026-04-29)
// Sheet: Auto-Stock Real Time, data starts row 22
// ============================================================
const COL = {
  CODE: 1,           // Column A

  // Pathum Thani (columns C–F)
  PT_GRADE_A:   3,   // C
  PT_CCA_READY: 4,   // D
  PT_GRADE_CCA: 5,   // E
  PT_GRADE_B:   6,   // F

  // Chanthaburi (columns S–V)
  CT_GRADE_A:   19,  // S
  CT_CCA_READY: 20,  // T
  CT_GRADE_CCA: 21,  // U
  CT_GRADE_B:   22,  // V

  // Chiang Mai (columns W–Z)
  CM_GRADE_A:   23,  // W
  CM_CCA_READY: 24,  // X
  CM_GRADE_CCA: 25,  // Y
  CM_GRADE_B:   26,  // Z
};

const DATA_START_ROW = 22; // First row with product data

// ============================================================
// SETUP — run this once manually to install the trigger
// ============================================================
function setupTrigger() {
  // Delete existing triggers first to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncStockToSupabase') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Install onChange trigger
  ScriptApp.newTrigger('syncStockToSupabase')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  logSync('INFO', 'onChange trigger installed successfully');
}

// ============================================================
// MAIN SYNC FUNCTION — called by onChange trigger
// ============================================================
function syncStockToSupabase() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceKey  = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  const ptId = Number(props.getProperty('WAREHOUSE_PT_ID'));
  const ctId = Number(props.getProperty('WAREHOUSE_CT_ID'));
  const cmId = Number(props.getProperty('WAREHOUSE_CM_ID'));

  if (!supabaseUrl || !serviceKey) {
    logSync('ERROR', 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Script Properties');
    return;
  }
  if (!ptId || !ctId || !cmId) {
    logSync('ERROR', 'Missing warehouse IDs in Script Properties (WAREHOUSE_PT_ID, WAREHOUSE_CT_ID, WAREHOUSE_CM_ID)');
    return;
  }

  const sheet   = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const lastRow = sheet.getLastRow();

  if (lastRow < DATA_START_ROW) {
    logSync('INFO', 'No data rows found (sheet has fewer than ' + DATA_START_ROW + ' rows)');
    return;
  }

  // Read all data at once (one API call to Sheets, much faster than row-by-row)
  const numRows = lastRow - DATA_START_ROW + 1;
  const numCols = COL.CM_GRADE_B; // Read up to last needed column
  const data = sheet.getRange(DATA_START_ROW, 1, numRows, numCols).getValues();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + serviceKey,
    'apikey': serviceKey,
    'Prefer': 'resolution=merge-duplicates', // upsert behavior
  };

  // Product ID cache to avoid repeated API calls per CODE
  const productCache = {};

  let successCount = 0;
  let skipCount    = 0;
  let errorCount   = 0;

  for (let i = 0; i < data.length; i++) {
    const row  = data[i];
    const code = String(row[COL.CODE - 1]).trim();

    // Skip empty rows
    if (!code || code === '' || code === 'undefined') {
      skipCount++;
      continue;
    }

    // Look up product_id by barcode = CODE (with cache)
    if (productCache[code] === undefined) {
      productCache[code] = fetchProductIdByBarcode(supabaseUrl, serviceKey, code);
    }
    const productId = productCache[code];

    if (!productId) {
      logSync('WARN', 'Row ' + (DATA_START_ROW + i) + ': CODE not found in products.barcode — "' + code + '"');
      errorCount++;
      continue;
    }

    // Build upsert payload — 3 records per product (one per warehouse)
    const records = [
      {
        product_id:   productId,
        warehouse_id: ptId,
        grade_a:      toNum(row[COL.PT_GRADE_A   - 1]),
        cca_ready:    toNum(row[COL.PT_CCA_READY  - 1]),
        grade_cca:    toNum(row[COL.PT_GRADE_CCA  - 1]),
        grade_b:      toNum(row[COL.PT_GRADE_B    - 1]),
        synced_at:    new Date().toISOString(),
      },
      {
        product_id:   productId,
        warehouse_id: ctId,
        grade_a:      toNum(row[COL.CT_GRADE_A   - 1]),
        cca_ready:    toNum(row[COL.CT_CCA_READY  - 1]),
        grade_cca:    toNum(row[COL.CT_GRADE_CCA  - 1]),
        grade_b:      toNum(row[COL.CT_GRADE_B    - 1]),
        synced_at:    new Date().toISOString(),
      },
      {
        product_id:   productId,
        warehouse_id: cmId,
        grade_a:      toNum(row[COL.CM_GRADE_A   - 1]),
        cca_ready:    toNum(row[COL.CM_CCA_READY  - 1]),
        grade_cca:    toNum(row[COL.CM_GRADE_CCA  - 1]),
        grade_b:      toNum(row[COL.CM_GRADE_B    - 1]),
        synced_at:    new Date().toISOString(),
      },
    ];

    // Upsert to Supabase
    const response = UrlFetchApp.fetch(
      supabaseUrl + '/rest/v1/product_stock_by_grade',
      {
        method: 'post',
        headers: headers,
        payload: JSON.stringify(records),
        muteHttpExceptions: true,
      }
    );

    const status = response.getResponseCode();
    if (status >= 300) {
      logSync('ERROR', 'Row ' + (DATA_START_ROW + i) + ' (' + code + '): HTTP ' + status + ' — ' + response.getContentText());
      errorCount++;
    } else {
      successCount++;
    }
  }

  logSync('INFO',
    'Sync complete — Success: ' + successCount +
    ', Skipped (empty): ' + skipCount +
    ', Errors: ' + errorCount
  );
}

// ============================================================
// HELPER: fetch product ID from Supabase by barcode
// ============================================================
function fetchProductIdByBarcode(supabaseUrl, serviceKey, barcode) {
  const url = supabaseUrl + '/rest/v1/products?barcode=eq.' +
              encodeURIComponent(barcode) + '&select=id&limit=1';

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + serviceKey,
      'apikey': serviceKey,
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) return null;

  const results = JSON.parse(response.getContentText());
  return results.length > 0 ? results[0].id : null;
}

// ============================================================
// HELPER: safe number conversion
// ============================================================
function toNum(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

// ============================================================
// HELPER: write log to "Sync Log" sheet tab
// ============================================================
function logSync(level, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('Sync Log');
    if (!logSheet) {
      logSheet = ss.insertSheet('Sync Log');
      logSheet.appendRow(['Timestamp', 'Level', 'Message']);
      logSheet.setFrozenRows(1);
      logSheet.getRange('1:1').setFontWeight('bold');
    }
    logSheet.appendRow([new Date().toISOString(), level, message]);
  } catch (e) {
    console.error('logSync failed: ' + e.message);
  }
  console.log('[' + level + '] ' + message);
}
