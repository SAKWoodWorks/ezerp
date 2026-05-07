// ============================================================
// SALES DATA SYNC FROM GOOGLE SHEETS TO SUPABASE
// For dashboard metrics and sales reporting
// ============================================================

// Column mapping for sales data sheet
const SALES_COL = {
  DATE: 1,          // A - Sale date
  INVOICE_NO: 2,    // B - Invoice number
  CUSTOMER: 3,      // C - Customer name
  PRODUCT: 4,       // D - Product name/code
  QUANTITY: 5,      // E - Quantity sold
  UNIT_PRICE: 6,    // F - Unit price
  TOTAL: 7,         // G - Total amount
  WAREHOUSE: 8,     // H - Warehouse
  SALES_REP: 9,     // I - Sales representative
};

const SALES_DATA_START_ROW = 2; // First row with sales data

// ============================================================
// SETUP FUNCTION - run once to install trigger
// ============================================================
function setupSalesTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncSalesToSupabase') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Install onChange trigger for sales sheet
  ScriptApp.newTrigger('syncSalesToSupabase')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  logSync('INFO', 'Sales sync onChange trigger installed successfully');
}

// ============================================================
// MAIN SALES SYNC FUNCTION
// ============================================================
function syncSalesToSupabase() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceKey) {
    logSync('ERROR', 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  // Get the sales data sheet (adjust sheet name as needed)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sales Data');
  if (!sheet) {
    logSync('ERROR', 'Sales Data sheet not found');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < SALES_DATA_START_ROW) {
    logSync('INFO', 'No sales data rows found');
    return;
  }

  // Read all sales data
  const numRows = lastRow - SALES_DATA_START_ROW + 1;
  const numCols = SALES_COL.SALES_REP;
  const data = sheet.getRange(SALES_DATA_START_ROW, 1, numRows, numCols).getValues();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + serviceKey,
    'apikey': serviceKey,
    'Prefer': 'resolution=merge-duplicates',
  };

  let successCount = 0;
  let errorCount = 0;

  // Process each sales record
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const invoiceNo = String(row[SALES_COL.INVOICE_NO - 1]).trim();

    // Skip empty rows
    if (!invoiceNo || invoiceNo === '') {
      continue;
    }

    // Build sales record for custom sales_external table
    const salesRecord = {
      invoice_number: invoiceNo,
      sale_date: formatDate(row[SALES_COL.DATE - 1]),
      customer_name: String(row[SALES_COL.CUSTOMER - 1]).trim(),
      product_name: String(row[SALES_COL.PRODUCT - 1]).trim(),
      quantity: Number(row[SALES_COL.QUANTITY - 1]) || 0,
      unit_price: Number(row[SALES_COL.UNIT_PRICE - 1]) || 0,
      total_amount: Number(row[SALES_COL.TOTAL - 1]) || 0,
      warehouse: String(row[SALES_COL.WAREHOUSE - 1]).trim(),
      sales_rep: String(row[SALES_COL.SALES_REP - 1]).trim(),
      synced_at: new Date().toISOString(),
    };

    // Upsert to Supabase (you'll need to create this table)
    const response = UrlFetchApp.fetch(
      supabaseUrl + '/rest/v1/sales_external',
      {
        method: 'post',
        headers: headers,
        payload: JSON.stringify([salesRecord]),
        muteHttpExceptions: true,
      }
    );

    const status = response.getResponseCode();
    if (status >= 300) {
      logSync('ERROR', 'Row ' + (SALES_DATA_START_ROW + i) + ': HTTP ' + status + ' — ' + response.getContentText());
      errorCount++;
    } else {
      successCount++;
    }
  }

  logSync('INFO', 'Sales sync complete — Success: ' + successCount + ', Errors: ' + errorCount);
}

// ============================================================
// DASHBOARD METRICS SYNC
// ============================================================
function syncDashboardMetrics() {
  const props = PropertiesService.getScriptProperties();
  const supabaseUrl = props.getProperty('SUPABASE_URL');
  const serviceKey = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');

  // Get dashboard metrics sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
  if (!sheet) {
    logSync('ERROR', 'Dashboard sheet not found');
    return;
  }

  // Example: Read key metrics from specific cells
  const metrics = {
    total_sales_ytd: sheet.getRange('B2').getValue() || 0,
    total_customers: sheet.getRange('B3').getValue() || 0,
    total_products: sheet.getRange('B4').getValue() || 0,
    avg_order_value: sheet.getRange('B5').getValue() || 0,
    updated_at: new Date().toISOString(),
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + serviceKey,
    'apikey': serviceKey,
  };

  // Update dashboard_metrics table (you'll need to create this)
  const response = UrlFetchApp.fetch(
    supabaseUrl + '/rest/v1/dashboard_metrics',
    {
      method: 'post',
      headers: headers,
      payload: JSON.stringify([metrics]),
      muteHttpExceptions: true,
    }
  );

  if (response.getResponseCode() >= 300) {
    logSync('ERROR', 'Dashboard metrics sync failed: ' + response.getContentText());
  } else {
    logSync('INFO', 'Dashboard metrics synced successfully');
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function formatDate(dateValue) {
  if (!dateValue) return null;

  // Handle different date formats
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  // If it's a string, try to parse it
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

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