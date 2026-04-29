# Customer CSV Import Enhancement Design

**Date:** 2026-04-29  
**Purpose:** Import customer data from CSV file exported from another Supabase project  
**Approach:** Enhance existing Excel import function to support CSV with field mapping

## Overview

Extend the existing `importCustomers` function in [src/app/customers/actions.ts](../../../src/app/customers/actions.ts) to support CSV files alongside Excel files. The system will import customer data from `exports/customers_rows.csv` into the ERP database's `customers` table.

## Data Source & Target

### Source CSV Structure (`exports/customers_rows.csv`)
- `id` (UUID) - will be ignored, let database auto-generate
- `customer_name` → maps to `name`
- `customer_tax_id` → maps to `tax_id` 
- `customer_address` → maps to `address`
- `customer_phone` → maps to `phone`
- `customer_branch` → maps to `responsible_person`
- `created_at` - will be ignored

### Target Database Table (`customers`)
```sql
customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  line_id TEXT, -- will be null for imported records
  responsible_person TEXT, -- mapped from customer_branch
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Architecture

### Components to Modify
1. **[src/app/customers/actions.ts](../../../src/app/customers/actions.ts)** - Enhance `importCustomers` function
2. **[src/app/customers/ImportCustomerDialog.tsx](../../../src/app/customers/ImportCustomerDialog.tsx)** - Add CSV file support (optional UI enhancement)

### Data Flow
1. Parse CSV file using existing buffer processing pattern
2. Map CSV columns to database schema
3. Validate required fields (name)
4. Detect and skip duplicates (by name + tax_id combination)
5. Insert valid records using existing Supabase insert pattern
6. Return success/error counts

## Implementation Details

### Field Mapping Logic
```javascript
const mappedCustomer = {
  name: row.customer_name,
  tax_id: row.customer_tax_id || null,
  address: row.customer_address || null,
  phone: row.customer_phone || null,
  line_id: null, // Not available in source CSV
  responsible_person: row.customer_branch || null
}
```

### CSV Parsing
- Use existing `Buffer.from(fileBase64, "base64")` pattern
- Add CSV parsing capability alongside XLSX parsing
- Detect file type by extension or content headers

### Duplicate Detection
- Check existing customers by combination of `name` + `tax_id`
- Skip records that already exist
- Count skipped vs inserted records

### Error Handling
- Follow existing error patterns from `importCustomers` function
- Log parsing errors
- Continue processing valid records if some records fail
- Return detailed success/error summary

## Testing Strategy

### Data Validation Tests
- Verify field mapping correctness
- Test duplicate detection logic
- Validate required field enforcement (name)

### Integration Tests  
- Test with actual `exports/customers_rows.csv` file
- Verify database insertion
- Check duplicate handling

### UI Tests
- Ensure CSV files are accepted in file picker
- Verify success/error messaging

## Success Criteria

1. ✅ CSV parsing works with actual customer data file
2. ✅ All valid customer records imported successfully
3. ✅ Duplicate records detected and skipped appropriately  
4. ✅ Field mapping produces correctly formatted database records
5. ✅ Error handling provides clear feedback on any failures
6. ✅ Existing Excel import functionality remains unaffected

## Technical Considerations

### Performance
- Process records in batches if CSV is large (>1000 records)
- Use existing `revalidatePath` pattern to refresh UI

### Security
- Validate CSV content structure before processing
- Sanitize text fields to prevent injection issues
- Follow existing authentication patterns

### Backwards Compatibility
- Maintain existing Excel import functionality
- Existing ImportCustomerDialog UI should work with both file types

## File Changes Required

1. **src/app/customers/actions.ts** - Add CSV parsing to `importCustomers`
2. **src/app/customers/ImportCustomerDialog.tsx** - Accept CSV files (optional)
3. **Add CSV parsing utility** if needed (or use existing library)

## Risk Assessment

**Low Risk:** Building on existing, tested import functionality  
**Mitigation:** Thorough testing with actual CSV data before deployment