-- ============================================
-- Import/Export Management Module
-- For SAK Woodworks - Pine Import & Teak Export
-- ============================================

-- Table: import_shipments
-- Purpose: Track Pine wood imports from Russia
CREATE TABLE IF NOT EXISTS import_shipments (
  id BIGSERIAL PRIMARY KEY,

  -- Shipment Information
  shipment_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
  origin_country VARCHAR(100) DEFAULT 'Russia',
  origin_port VARCHAR(200),
  destination_port VARCHAR(200) DEFAULT 'Thailand',

  -- Product & Quantity
  product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255),
  product_description TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'm³', -- cubic meters, kg, etc.
  weight_kg DECIMAL(15,2),
  volume_m3 DECIMAL(15,2),

  -- Financial Information
  currency VARCHAR(10) DEFAULT 'USD',
  unit_price DECIMAL(15,2),
  total_value DECIMAL(15,2),
  freight_cost DECIMAL(15,2),
  insurance_cost DECIMAL(15,2),
  customs_duty DECIMAL(15,2),
  other_charges DECIMAL(15,2),
  total_landed_cost DECIMAL(15,2),
  incoterm VARCHAR(20) DEFAULT 'CIF', -- FOB, CIF, EXW, etc.

  -- Shipping Details
  container_number VARCHAR(50),
  container_type VARCHAR(50), -- 20ft, 40ft, 40ft HC
  seal_number VARCHAR(50),
  vessel_name VARCHAR(200),
  voyage_number VARCHAR(100),
  shipping_line VARCHAR(200),
  bl_number VARCHAR(100), -- Bill of Lading

  -- Dates
  order_date DATE,
  estimated_departure_date DATE,
  actual_departure_date DATE,
  estimated_arrival_date DATE,
  actual_arrival_date DATE,
  customs_clearance_date DATE,
  warehouse_receipt_date DATE,

  -- Status & Tracking
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, shipped, in_transit, customs, cleared, received, completed, cancelled
  customs_status VARCHAR(50) DEFAULT 'pending',
  -- pending, submitted, under_review, approved, released
  tracking_url TEXT,

  -- Documents & Notes
  documents JSONB DEFAULT '[]', -- Array of document URLs/names
  notes TEXT,
  internal_notes TEXT,

  -- Warehouse Assignment
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
  received_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: export_shipments
-- Purpose: Track Teak wood exports from Thailand
CREATE TABLE IF NOT EXISTS export_shipments (
  id BIGSERIAL PRIMARY KEY,

  -- Shipment Information
  shipment_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id BIGINT REFERENCES customers(id) ON DELETE RESTRICT,
  destination_country VARCHAR(100) NOT NULL,
  destination_port VARCHAR(200),
  origin_port VARCHAR(200) DEFAULT 'Thailand',

  -- Product & Quantity
  product_id BIGINT REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255),
  product_description TEXT,
  quantity DECIMAL(15,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'm³',
  weight_kg DECIMAL(15,2),
  volume_m3 DECIMAL(15,2),

  -- Financial Information
  currency VARCHAR(10) DEFAULT 'USD',
  unit_price DECIMAL(15,2),
  total_value DECIMAL(15,2),
  freight_cost DECIMAL(15,2),
  insurance_cost DECIMAL(15,2),
  export_duty DECIMAL(15,2),
  other_charges DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  incoterm VARCHAR(20) DEFAULT 'FOB', -- FOB, CIF, EXW, etc.

  -- Shipping Details
  container_number VARCHAR(50),
  container_type VARCHAR(50),
  seal_number VARCHAR(50),
  vessel_name VARCHAR(200),
  voyage_number VARCHAR(100),
  shipping_line VARCHAR(200),
  bl_number VARCHAR(100),

  -- Dates
  order_date DATE,
  estimated_departure_date DATE,
  actual_departure_date DATE,
  estimated_arrival_date DATE,
  actual_arrival_date DATE,
  delivery_confirmation_date DATE,

  -- Status & Tracking
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, packed, ready, shipped, in_transit, delivered, completed, cancelled
  export_permit_status VARCHAR(50) DEFAULT 'pending',
  -- pending, applied, approved, issued
  permit_number VARCHAR(100),
  tracking_url TEXT,

  -- Documents & Notes
  documents JSONB DEFAULT '[]',
  notes TEXT,
  internal_notes TEXT,

  -- Warehouse & Packing
  warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE SET NULL,
  packed_by BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  packing_date DATE,

  -- Invoice Reference
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: shipment_documents
-- Purpose: Store documents related to shipments
CREATE TABLE IF NOT EXISTS shipment_documents (
  id BIGSERIAL PRIMARY KEY,

  shipment_type VARCHAR(20) NOT NULL, -- 'import' or 'export'
  shipment_id BIGINT NOT NULL,

  document_type VARCHAR(50) NOT NULL,
  -- bill_of_lading, commercial_invoice, packing_list, certificate_of_origin,
  -- phytosanitary_certificate, customs_declaration, export_permit, import_license

  document_name VARCHAR(255) NOT NULL,
  document_url TEXT,
  file_size BIGINT,
  file_type VARCHAR(50),

  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),

  notes TEXT
);

-- Table: customs_entries
-- Purpose: Track customs clearance details
CREATE TABLE IF NOT EXISTS customs_entries (
  id BIGSERIAL PRIMARY KEY,

  entry_type VARCHAR(20) NOT NULL, -- 'import' or 'export'
  shipment_id BIGINT NOT NULL,

  entry_number VARCHAR(100) UNIQUE NOT NULL,
  entry_date DATE,
  clearance_date DATE,

  customs_broker VARCHAR(200),
  broker_contact TEXT,

  duty_amount DECIMAL(15,2),
  vat_amount DECIMAL(15,2),
  other_fees DECIMAL(15,2),
  total_charges DECIMAL(15,2),

  status VARCHAR(50) DEFAULT 'pending',
  -- pending, submitted, under_review, approved, released, paid

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_import_shipments_status ON import_shipments(status);
CREATE INDEX IF NOT EXISTS idx_import_shipments_supplier ON import_shipments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_import_shipments_dates ON import_shipments(estimated_arrival_date, actual_arrival_date);
CREATE INDEX IF NOT EXISTS idx_import_shipments_created ON import_shipments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_shipments_status ON export_shipments(status);
CREATE INDEX IF NOT EXISTS idx_export_shipments_customer ON export_shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_export_shipments_dates ON export_shipments(estimated_departure_date, actual_departure_date);
CREATE INDEX IF NOT EXISTS idx_export_shipments_created ON export_shipments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipment_documents_type ON shipment_documents(shipment_type, shipment_id);
CREATE INDEX IF NOT EXISTS idx_customs_entries_type ON customs_entries(entry_type, shipment_id);

-- Functions for automatic shipment number generation
CREATE OR REPLACE FUNCTION generate_import_shipment_number()
RETURNS TEXT AS $$
DECLARE
  next_number INT;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(shipment_number FROM 4 FOR 4) AS INT)), 0) + 1
  INTO next_number
  FROM import_shipments
  WHERE shipment_number LIKE 'IMP' || year_suffix || '%';

  RETURN 'IMP' || year_suffix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_export_shipment_number()
RETURNS TEXT AS $$
DECLARE
  next_number INT;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(shipment_number FROM 4 FOR 4) AS INT)), 0) + 1
  INTO next_number
  FROM export_shipments
  WHERE shipment_number LIKE 'EXP' || year_suffix || '%';

  RETURN 'EXP' || year_suffix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update timestamps
CREATE OR REPLACE FUNCTION update_shipment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER import_shipments_update_timestamp
BEFORE UPDATE ON import_shipments
FOR EACH ROW EXECUTE FUNCTION update_shipment_timestamp();

CREATE TRIGGER export_shipments_update_timestamp
BEFORE UPDATE ON export_shipments
FOR EACH ROW EXECUTE FUNCTION update_shipment_timestamp();

CREATE TRIGGER customs_entries_update_timestamp
BEFORE UPDATE ON customs_entries
FOR EACH ROW EXECUTE FUNCTION update_shipment_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE import_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE customs_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users to read/write)
CREATE POLICY import_shipments_policy ON import_shipments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY export_shipments_policy ON export_shipments
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY shipment_documents_policy ON shipment_documents
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY customs_entries_policy ON customs_entries
  FOR ALL USING (auth.role() = 'authenticated');

-- Sample data (optional, for testing)
-- COMMENT: Uncomment to insert sample data

-- INSERT INTO import_shipments (
--   shipment_number, origin_country, product_name, quantity, unit,
--   total_value, currency, status, estimated_arrival_date
-- ) VALUES (
--   'IMP25001', 'Russia', 'Pine Wood Logs', 50.00, 'm³',
--   25000.00, 'USD', 'in_transit', '2025-11-15'
-- );

-- INSERT INTO export_shipments (
--   shipment_number, destination_country, product_name, quantity, unit,
--   total_value, currency, status, estimated_departure_date
-- ) VALUES (
--   'EXP25001', 'Japan', 'Teak Wood Planks', 30.00, 'm³',
--   45000.00, 'USD', 'pending', '2025-11-20'
-- );

COMMENT ON TABLE import_shipments IS 'Tracks Pine wood imports from Russia';
COMMENT ON TABLE export_shipments IS 'Tracks Teak wood exports from Thailand to international customers';
COMMENT ON TABLE shipment_documents IS 'Stores shipping documents (Bill of Lading, Invoices, etc.)';
COMMENT ON TABLE customs_entries IS 'Tracks customs clearance process and fees';
