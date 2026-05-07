-- Add Barcode/QR Code support to products table
-- This allows products to be scanned via barcode or QR code

-- Add barcode column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE;

-- Create index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Add comment
COMMENT ON COLUMN products.barcode IS 'Barcode or QR code identifier for scanning';

-- Function to search product by barcode
CREATE OR REPLACE FUNCTION find_product_by_barcode(barcode_input TEXT)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  description TEXT,
  price NUMERIC,
  stock_quantity INTEGER,
  barcode TEXT,
  width NUMERIC,
  length NUMERIC,
  thickness NUMERIC,
  supplier_id BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock_quantity,
    p.barcode,
    p.width,
    p.length,
    p.thickness,
    p.supplier_id
  FROM products p
  WHERE p.barcode = barcode_input;
END;
$$ LANGUAGE plpgsql;

-- Sample: Update existing products with generated barcodes (optional)
-- You can run this to generate simple barcodes for existing products
/*
UPDATE products
SET barcode = 'PRD' || LPAD(id::TEXT, 8, '0')
WHERE barcode IS NULL;
*/

-- Sample: Generate barcode based on product ID
-- Format: PRD00000001, PRD00000002, etc.
/*
CREATE OR REPLACE FUNCTION generate_product_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL THEN
    NEW.barcode := 'PRD' || LPAD(NEW.id::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_product_barcode
  AFTER INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION generate_product_barcode();
*/
