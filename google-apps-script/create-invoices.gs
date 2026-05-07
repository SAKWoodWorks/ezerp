// ============================================================
// INVOICE CREATION FROM GOOGLE SHEETS
// Creates invoices in your ERP system from Google Sheets data
// ============================================================

// Column mapping for invoice creation sheet
const INVOICE_COL = {
  CUSTOMER_ID: 1,        // A - Customer ID (must match database)
  CUSTOMER_NAME: 2,      // B - Customer name (for reference)
  RESPONSIBLE_PERSON_ID: 3, // C - Responsible person ID
  PRICE_TIER: 4,         // D - Price tier (wholesale/retail/special)
  ISSUE_DATE: 5,         // E - Issue date
  DUE_DATE: 6,           // F - Due date
  PRODUCT_ID: 7,         // G - Product ID
  PRODUCT_NAME: 8,       // H - Product name (for reference)
  QUANTITY: 9,           // I - Quantity
  UNIT_PRICE: 10,        // J - Unit price
  LINE_TOTAL: 11,        // K - Line total (auto-calculated)
  STATUS: 12,            // L - Invoice status (Draft/Sent/Paid)
  NOTES: 13,             // M - Notes
  PROCESSED: 14,         // N - Processed flag (Y/N)
};

const INVOICE_DATA_START_ROW = 2; // First row with invoice data

// ============================================================
// SETUP FUNCTION - run once to install trigger
// ============================================================
function setupInvoiceTrigger() {
  // Delete existing triggers
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'processInvoicesFromSheet') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Install onChange trigger
  ScriptApp.newTrigger('processInvoicesFromSheet')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onChange()
    .create();

  logInvoice('INFO', 'Invoice creation onChange trigger installed successfully');
}

// ============================================================
// MAIN INVOICE CREATION FUNCTION
// ============================================================
function processInvoicesFromSheet() {
  const props = PropertiesService.getScriptProperties();
  const apiUrl = props.getProperty('API_BASE_URL'); // e.g., https://your-domain.com
  const apiKey = props.getProperty('API_KEY'); // Your API key if needed

  if (!apiUrl) {
    logInvoice('ERROR', 'Missing API_BASE_URL in Script Properties');
    return;
  }

  // Get the invoice data sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Invoices');
  if (!sheet) {
    logInvoice('ERROR', 'Invoices sheet not found');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < INVOICE_DATA_START_ROW) {
    logInvoice('INFO', 'No invoice data rows found');
    return;
  }

  // Read all invoice data
  const numRows = lastRow - INVOICE_DATA_START_ROW + 1;
  const numCols = INVOICE_COL.PROCESSED;
  const data = sheet.getRange(INVOICE_DATA_START_ROW, 1, numRows, numCols).getValues();

  // Group rows by customer and create separate invoices
  const invoiceGroups = groupInvoicesByCustomer(data);

  let successCount = 0;
  let errorCount = 0;

  // Process each invoice group
  for (const [groupKey, rows] of Object.entries(invoiceGroups)) {
    try {
      const invoice = createInvoiceFromGroup(groupKey, rows);
      const result = sendInvoiceToAPI(apiUrl, apiKey, invoice);

      if (result.success) {
        // Mark all rows as processed
        markRowsAsProcessed(sheet, rows, result.invoiceNumber);
        successCount++;
        logInvoice('INFO', `Invoice created: ${result.invoiceNumber}`);
      } else {
        markRowsAsError(sheet, rows, result.error);
        errorCount++;
        logInvoice('ERROR', `Failed to create invoice for ${groupKey}: ${result.error}`);
      }
    } catch (error) {
      markRowsAsError(sheet, rows, error.message);
      errorCount++;
      logInvoice('ERROR', `Error processing group ${groupKey}: ${error.message}`);
    }
  }

  logInvoice('INFO', `Invoice processing complete — Success: ${successCount}, Errors: ${errorCount}`);
}

// ============================================================
// GROUP INVOICE ROWS BY CUSTOMER
// ============================================================
function groupInvoicesByCustomer(data) {
  const groups = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const processed = String(row[INVOICE_COL.PROCESSED - 1]).trim().toLowerCase();

    // Skip already processed rows
    if (processed === 'y' || processed === 'yes') {
      continue;
    }

    const customerId = row[INVOICE_COL.CUSTOMER_ID - 1];
    const issueDate = row[INVOICE_COL.ISSUE_DATE - 1];
    const dueDate = row[INVOICE_COL.DUE_DATE - 1];

    // Skip empty rows
    if (!customerId || !issueDate) {
      continue;
    }

    // Group key: customer_id + issue_date + due_date
    const groupKey = `${customerId}_${formatDate(issueDate)}_${formatDate(dueDate)}`;

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push({
      rowIndex: INVOICE_DATA_START_ROW + i,
      data: row
    });
  }

  return groups;
}

// ============================================================
// CREATE INVOICE OBJECT FROM GROUP
// ============================================================
function createInvoiceFromGroup(groupKey, rows) {
  const firstRow = rows[0].data;

  const invoice = {
    customerId: Number(firstRow[INVOICE_COL.CUSTOMER_ID - 1]),
    responsiblePersonId: Number(firstRow[INVOICE_COL.RESPONSIBLE_PERSON_ID - 1]) || undefined,
    priceTier: String(firstRow[INVOICE_COL.PRICE_TIER - 1]).trim() || 'retail',
    issueDate: formatDate(firstRow[INVOICE_COL.ISSUE_DATE - 1]),
    dueDate: formatDate(firstRow[INVOICE_COL.DUE_DATE - 1]),
    status: String(firstRow[INVOICE_COL.STATUS - 1]).trim() || 'Draft',
    notes: String(firstRow[INVOICE_COL.NOTES - 1]).trim() || 'Created via Google Sheets',
    items: []
  };

  // Add all items from the group
  for (const row of rows) {
    const data = row.data;
    const productId = Number(data[INVOICE_COL.PRODUCT_ID - 1]);
    const quantity = Number(data[INVOICE_COL.QUANTITY - 1]);
    const unitPrice = Number(data[INVOICE_COL.UNIT_PRICE - 1]);

    if (productId && quantity > 0 && unitPrice > 0) {
      invoice.items.push({
        productId: productId,
        description: String(data[INVOICE_COL.PRODUCT_NAME - 1]).trim(),
        quantity: quantity,
        unitPrice: unitPrice,
        total: quantity * unitPrice
      });
    }
  }

  return invoice;
}

// ============================================================
// SEND INVOICE TO API
// ============================================================
function sendInvoiceToAPI(apiUrl, apiKey, invoice) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add API key if provided
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = UrlFetchApp.fetch(
      `${apiUrl}/api/invoices/from-sheets`,
      {
        method: 'POST',
        headers: headers,
        payload: JSON.stringify(invoice),
        muteHttpExceptions: true,
      }
    );

    const responseCode = response.getResponseCode();
    const responseData = JSON.parse(response.getContentText());

    if (responseCode >= 200 && responseCode < 300) {
      return {
        success: true,
        invoiceNumber: responseData.invoice?.invoiceNumber || 'Unknown',
        invoiceId: responseData.invoice?.id
      };
    } else {
      return {
        success: false,
        error: responseData.error || `HTTP ${responseCode}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================
// MARK ROWS AS PROCESSED
// ============================================================
function markRowsAsProcessed(sheet, rows, invoiceNumber) {
  for (const row of rows) {
    sheet.getRange(row.rowIndex, INVOICE_COL.PROCESSED).setValue('Y');
    sheet.getRange(row.rowIndex, INVOICE_COL.NOTES).setValue(
      `Processed: ${invoiceNumber} at ${new Date().toISOString()}`
    );
  }
}

function markRowsAsError(sheet, rows, error) {
  for (const row of rows) {
    sheet.getRange(row.rowIndex, INVOICE_COL.PROCESSED).setValue('ERROR');
    sheet.getRange(row.rowIndex, INVOICE_COL.NOTES).setValue(`Error: ${error}`);
  }
}

// ============================================================
// MANUAL PROCESSING FUNCTION
// ============================================================
function manualProcessInvoices() {
  processInvoicesFromSheet();
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function formatDate(dateValue) {
  if (!dateValue) return null;

  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

function logInvoice(level, message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('Invoice Log');
    if (!logSheet) {
      logSheet = ss.insertSheet('Invoice Log');
      logSheet.appendRow(['Timestamp', 'Level', 'Message']);
      logSheet.setFrozenRows(1);
      logSheet.getRange('1:1').setFontWeight('bold');
    }
    logSheet.appendRow([new Date().toISOString(), level, message]);
  } catch (e) {
    console.error('logInvoice failed: ' + e.message);
  }
  console.log('[' + level + '] ' + message);
}

// ============================================================
// SETUP HELPER FUNCTION
// ============================================================
function createInvoiceTemplate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Invoices');

  if (!sheet) {
    sheet = ss.insertSheet('Invoices');
  }

  // Clear existing content and set headers
  sheet.clear();
  sheet.appendRow([
    'Customer ID', 'Customer Name', 'Responsible Person ID', 'Price Tier',
    'Issue Date', 'Due Date', 'Product ID', 'Product Name',
    'Quantity', 'Unit Price', 'Line Total', 'Status', 'Notes', 'Processed'
  ]);

  // Add sample data
  sheet.appendRow([
    1, 'ABC Company', 1, 'retail',
    new Date(), new Date(Date.now() + 14*24*60*60*1000), // 14 days from now
    1, 'Teak Wood 2x4', 10, 500, '=I2*J2', 'Draft', 'Sample invoice', 'N'
  ]);

  // Format headers
  sheet.setFrozenRows(1);
  sheet.getRange('1:1').setFontWeight('bold');

  logInvoice('INFO', 'Invoice template created successfully');
}