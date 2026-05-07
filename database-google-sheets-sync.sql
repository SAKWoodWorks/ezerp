-- =====================================================
-- GOOGLE SHEETS SYNC TABLES
-- Support for syncing sales data and dashboard metrics
-- =====================================================

-- Table for external sales data from Google Sheets
CREATE TABLE IF NOT EXISTS sales_external (
    id BIGSERIAL PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    sale_date DATE,
    customer_name TEXT,
    product_name TEXT,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    warehouse TEXT,
    sales_rep TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate invoice entries
    UNIQUE(invoice_number)
);

-- Table for dashboard metrics from Google Sheets
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id BIGSERIAL PRIMARY KEY,
    total_sales_ytd DECIMAL(15,2) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    customer_acquisition_cost DECIMAL(10,2) DEFAULT 0,
    customer_lifetime_value DECIMAL(10,2) DEFAULT 0,
    gross_margin_percent DECIMAL(5,2) DEFAULT 0,
    inventory_turnover DECIMAL(5,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for monthly sales summaries (aggregated from sheets)
CREATE TABLE IF NOT EXISTS monthly_sales_summary (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    avg_order_value DECIMAL(10,2) DEFAULT 0,
    top_product TEXT,
    top_customer TEXT,
    warehouse_breakdown JSONB,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate month entries
    UNIQUE(year, month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_external_date ON sales_external(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_external_customer ON sales_external(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_external_product ON sales_external(product_name);
CREATE INDEX IF NOT EXISTS idx_sales_external_synced_at ON sales_external(synced_at);
CREATE INDEX IF NOT EXISTS idx_monthly_sales_year_month ON monthly_sales_summary(year, month);

-- =====================================================
-- RPC FUNCTIONS FOR GOOGLE SHEETS ANALYTICS
-- =====================================================

-- Get sales comparison between internal and external data
CREATE OR REPLACE FUNCTION get_sales_comparison(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    source TEXT,
    total_sales DECIMAL,
    total_orders INTEGER,
    avg_order_value DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Default to current month if no dates provided
    IF start_date IS NULL THEN
        start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
    IF end_date IS NULL THEN
        end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    END IF;

    -- Internal sales from invoices table
    RETURN QUERY
    SELECT
        'Internal (ERP)'::TEXT as source,
        COALESCE(SUM(i.grand_total), 0) as total_sales,
        COUNT(*)::INTEGER as total_orders,
        CASE
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(i.grand_total), 0) / COUNT(*)
            ELSE 0
        END as avg_order_value
    FROM invoices i
    WHERE i.created_at::DATE BETWEEN start_date AND end_date
      AND i.status = 'paid';

    -- External sales from Google Sheets
    RETURN QUERY
    SELECT
        'External (Sheets)'::TEXT as source,
        COALESCE(SUM(se.total_amount), 0) as total_sales,
        COUNT(*)::INTEGER as total_orders,
        CASE
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(se.total_amount), 0) / COUNT(*)
            ELSE 0
        END as avg_order_value
    FROM sales_external se
    WHERE se.sale_date BETWEEN start_date AND end_date;
END;
$$;

-- Get latest dashboard metrics
CREATE OR REPLACE FUNCTION get_latest_dashboard_metrics()
RETURNS TABLE (
    total_sales_ytd DECIMAL,
    total_customers INTEGER,
    total_products INTEGER,
    avg_order_value DECIMAL,
    conversion_rate DECIMAL,
    last_updated TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.total_sales_ytd,
        dm.total_customers,
        dm.total_products,
        dm.avg_order_value,
        dm.conversion_rate,
        dm.updated_at as last_updated
    FROM dashboard_metrics dm
    ORDER BY dm.updated_at DESC
    LIMIT 1;
END;
$$;

-- Get top selling products from external data
CREATE OR REPLACE FUNCTION get_external_top_products(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_name TEXT,
    total_quantity DECIMAL,
    total_revenue DECIMAL,
    order_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Default to current month if no dates provided
    IF start_date IS NULL THEN
        start_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
    IF end_date IS NULL THEN
        end_date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    END IF;

    RETURN QUERY
    SELECT
        se.product_name,
        SUM(se.quantity) as total_quantity,
        SUM(se.total_amount) as total_revenue,
        COUNT(*)::INTEGER as order_count
    FROM sales_external se
    WHERE se.sale_date BETWEEN start_date AND end_date
      AND se.product_name IS NOT NULL
      AND se.product_name != ''
    GROUP BY se.product_name
    ORDER BY SUM(se.total_amount) DESC
    LIMIT limit_count;
END;
$$;

-- Sync monthly summaries from external sales data
CREATE OR REPLACE FUNCTION sync_monthly_summaries()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    processed_months INTEGER := 0;
    summary_record RECORD;
BEGIN
    -- Process each month that has external sales data
    FOR summary_record IN (
        SELECT
            EXTRACT(YEAR FROM se.sale_date)::INTEGER as year,
            EXTRACT(MONTH FROM se.sale_date)::INTEGER as month,
            SUM(se.total_amount) as total_sales,
            COUNT(*) as total_orders,
            COUNT(DISTINCT se.customer_name) as unique_customers,
            AVG(se.total_amount) as avg_order_value,
            (
                SELECT se2.product_name
                FROM sales_external se2
                WHERE EXTRACT(YEAR FROM se2.sale_date) = EXTRACT(YEAR FROM se.sale_date)
                  AND EXTRACT(MONTH FROM se2.sale_date) = EXTRACT(MONTH FROM se.sale_date)
                GROUP BY se2.product_name
                ORDER BY SUM(se2.total_amount) DESC
                LIMIT 1
            ) as top_product,
            (
                SELECT se2.customer_name
                FROM sales_external se2
                WHERE EXTRACT(YEAR FROM se2.sale_date) = EXTRACT(YEAR FROM se.sale_date)
                  AND EXTRACT(MONTH FROM se2.sale_date) = EXTRACT(MONTH FROM se.sale_date)
                GROUP BY se2.customer_name
                ORDER BY SUM(se2.total_amount) DESC
                LIMIT 1
            ) as top_customer
        FROM sales_external se
        WHERE se.sale_date IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM se.sale_date), EXTRACT(MONTH FROM se.sale_date)
    ) LOOP
        -- Upsert monthly summary
        INSERT INTO monthly_sales_summary (
            year, month, total_sales, total_orders, unique_customers,
            avg_order_value, top_product, top_customer, synced_at
        ) VALUES (
            summary_record.year,
            summary_record.month,
            summary_record.total_sales,
            summary_record.total_orders,
            summary_record.unique_customers,
            summary_record.avg_order_value,
            summary_record.top_product,
            summary_record.top_customer,
            NOW()
        )
        ON CONFLICT (year, month)
        DO UPDATE SET
            total_sales = EXCLUDED.total_sales,
            total_orders = EXCLUDED.total_orders,
            unique_customers = EXCLUDED.unique_customers,
            avg_order_value = EXCLUDED.avg_order_value,
            top_product = EXCLUDED.top_product,
            top_customer = EXCLUDED.top_customer,
            synced_at = NOW();

        processed_months := processed_months + 1;
    END LOOP;

    RETURN format('Successfully processed %s monthly summaries', processed_months);
END;
$$;

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================

-- Insert sample dashboard metrics
INSERT INTO dashboard_metrics (
    total_sales_ytd,
    total_customers,
    total_products,
    avg_order_value,
    conversion_rate,
    updated_at
) VALUES (
    1250000.00,
    450,
    120,
    2780.00,
    12.5,
    NOW()
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE sales_external IS 'External sales data synced from Google Sheets';
COMMENT ON TABLE dashboard_metrics IS 'Dashboard KPI metrics from Google Sheets';
COMMENT ON TABLE monthly_sales_summary IS 'Monthly sales summaries aggregated from external sources';

-- Grant permissions (adjust role name as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;