-- ============================================
-- Generate Sample Data for Testing Analytics
-- Run this ONLY if your database is empty
-- ============================================

-- Note: Update the user UUID below with your actual user ID from auth.users
-- You can get it by running: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  sample_user_id UUID := 'YOUR_USER_ID_HERE'; -- CHANGE THIS!
  customer_id_1 BIGINT;
  customer_id_2 BIGINT;
  customer_id_3 BIGINT;
  product_id_1 BIGINT;
  product_id_2 BIGINT;
  warehouse_id BIGINT;
  supplier_id BIGINT;
BEGIN

-- 1. Insert sample customers
INSERT INTO customers (name, email, phone, address, created_by)
VALUES 
  ('ABC Trading Co.', 'abc@example.com', '02-123-4567', '123 Bangkok', sample_user_id),
  ('XYZ Corporation', 'xyz@example.com', '02-234-5678', '456 Bangkok', sample_user_id),
  ('Best Furniture Ltd.', 'best@example.com', '02-345-6789', '789 Bangkok', sample_user_id)
RETURNING id INTO customer_id_1;

SELECT id INTO customer_id_2 FROM customers WHERE email = 'xyz@example.com';
SELECT id INTO customer_id_3 FROM customers WHERE email = 'best@example.com';

-- 2. Insert sample warehouse
INSERT INTO warehouses (name, location, capacity, created_by)
VALUES ('Main Warehouse', 'Bangkok', 1000, sample_user_id)
RETURNING id INTO warehouse_id;

-- 3. Insert sample products
INSERT INTO products (name, sku, description, price, cost, stock_quantity, unit, barcode, created_by)
VALUES 
  ('Pine Wood Plank', 'PINE-001', 'Pine wood 2x4x8', 250.00, 150.00, 100, 'piece', 'PINE001', sample_user_id),
  ('Teak Wood Board', 'TEAK-001', 'Teak wood premium grade', 800.00, 500.00, 50, 'piece', 'TEAK001', sample_user_id)
RETURNING id INTO product_id_1;

SELECT id INTO product_id_2 FROM products WHERE sku = 'TEAK-001';

-- 4. Insert sample invoices (spread over 3 months)
INSERT INTO invoices (
  invoice_number, customer_id, invoice_date, due_date, 
  total_amount, tax_amount, status, payment_status, created_by
)
VALUES 
  ('INV25001', customer_id_1, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 
   5000.00, 350.00, 'active', 'paid', sample_user_id),
  ('INV25002', customer_id_2, CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '15 days', 
   12000.00, 840.00, 'active', 'paid', sample_user_id),
  ('INV25003', customer_id_1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 
   8000.00, 560.00, 'active', 'partial', sample_user_id),
  ('INV25004', customer_id_3, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', 
   15000.00, 1050.00, 'active', 'unpaid', sample_user_id),
  ('INV25005', customer_id_2, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 
   6000.00, 420.00, 'active', 'unpaid', sample_user_id);

-- 5. Insert sample quotations
INSERT INTO quotations (
  quotation_number, customer_id, quotation_date, valid_until, 
  total_amount, tax_amount, status, created_by
)
VALUES 
  ('QT25001', customer_id_1, CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE - INTERVAL '40 days', 
   5000.00, 350.00, 'converted', sample_user_id),
  ('QT25002', customer_id_2, CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '20 days', 
   12000.00, 840.00, 'converted', sample_user_id),
  ('QT25003', customer_id_3, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '10 days', 
   20000.00, 1400.00, 'pending', sample_user_id);

-- 6. Insert sample cash bills
INSERT INTO cash_bills (
  bill_number, customer_name, bill_date, total_amount, tax_amount, 
  payment_method, status, created_by
)
VALUES 
  ('CB25001', 'Walk-in Customer 1', CURRENT_DATE - INTERVAL '40 days', 1500.00, 105.00, 'cash', 'paid', sample_user_id),
  ('CB25002', 'Walk-in Customer 2', CURRENT_DATE - INTERVAL '25 days', 2200.00, 154.00, 'cash', 'paid', sample_user_id),
  ('CB25003', 'Walk-in Customer 3', CURRENT_DATE - INTERVAL '10 days', 1800.00, 126.00, 'bank_transfer', 'paid', sample_user_id);

-- 7. Insert sample supplier
INSERT INTO suppliers (name, contact_person, email, phone, address, created_by)
VALUES ('Russian Pine Supplier', 'Ivan Petrov', 'ivan@russianpine.ru', '+7-123-456-7890', 'Moscow, Russia', sample_user_id)
RETURNING id INTO supplier_id;

-- 8. Insert sample import shipment
INSERT INTO import_shipments (
  shipment_number, supplier_id, origin_country, product_name, quantity, unit,
  total_value, currency, status, estimated_arrival_date, warehouse_id, created_by
)
VALUES (
  'IMP25001', supplier_id, 'Russia', 'Pine Wood Logs', 50.00, 'm³',
  25000.00, 'USD', 'in_transit', CURRENT_DATE + INTERVAL '15 days', warehouse_id, sample_user_id
);

-- 9. Insert sample export shipment
INSERT INTO export_shipments (
  shipment_number, customer_id, destination_country, product_name, quantity, unit,
  total_value, currency, status, estimated_departure_date, warehouse_id, created_by
)
VALUES (
  'EXP25001', customer_id_2, 'Japan', 'Teak Wood Planks', 30.00, 'm³',
  45000.00, 'USD', 'pending', CURRENT_DATE + INTERVAL '10 days', warehouse_id, sample_user_id
);

RAISE NOTICE 'Sample data created successfully!';
RAISE NOTICE 'Created % customers, % products, % invoices', 3, 2, 5;

END $$;

-- Verify the data was created
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'quotations', COUNT(*) FROM quotations
UNION ALL SELECT 'cash_bills', COUNT(*) FROM cash_bills
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'import_shipments', COUNT(*) FROM import_shipments
UNION ALL SELECT 'export_shipments', COUNT(*) FROM export_shipments;

