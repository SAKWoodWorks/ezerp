"use server"

/**
 * Advanced Analytics Actions
 * Server actions for fetching analytics data
 */

import { createClient } from "@/lib/supabase/server"

// ============================================
// 1. SALES ANALYTICS
// ============================================

export type SalesByPeriod = {
  period: string
  invoice_count: number
  cash_bill_count: number
  total_revenue: number
  invoice_revenue: number
  cash_revenue: number
}

export async function getSalesByPeriod(
  startDate: string,
  endDate: string,
  periodType: 'day' | 'week' | 'month' | 'year' = 'day'
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_sales_by_period', {
    start_date: startDate,
    end_date: endDate,
    period_type: periodType
  })

  if (error) {
    // Error fetching sales by period
    return []
  }

  return data as SalesByPeriod[]
}

export type TopCustomer = {
  customer_id: number
  customer_name: string
  total_invoices: number
  total_revenue: number
  average_order_value: number
  last_purchase_date: string
}

export async function getTopCustomers(
  startDate?: string,
  endDate?: string,
  limitCount: number = 10
) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_top_customers', {
    start_date: startDate || null,
    end_date: endDate || null,
    limit_count: limitCount
  })

  if (error) {
    // Error fetching top customers
    return []
  }

  return data as TopCustomer[]
}

export type ConversionRate = {
  total_quotations: number
  converted_quotations: number
  total_invoices: number
  conversion_rate: number
}

export async function getSalesConversionRate(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_sales_conversion_rate', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) {
    // Error fetching conversion rate
    return null
  }

  return data?.[0] as ConversionRate || null
}

// ============================================
// 2. CUSTOMER ANALYTICS
// ============================================

export type CustomerLifetimeValue = {
  customer_id: number
  customer_name: string
  first_purchase_date: string
  last_purchase_date: string
  total_orders: number
  total_spent: number
  average_order_value: number
  customer_age_days: number
}

export async function getCustomerLifetimeValue() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_customer_lifetime_value')

  if (error) {
    // Error fetching customer lifetime value
    return []
  }

  return data as CustomerLifetimeValue[]
}

export type CustomerSegment = {
  segment: string
  customer_count: number
  total_revenue: number
  avg_revenue_per_customer: number
}

export async function getCustomerSegmentation() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_customer_segmentation')

  if (error) {
    // Error fetching customer segmentation
    return []
  }

  return data as CustomerSegment[]
}

export type PaymentBehavior = {
  customer_id: number
  customer_name: string
  total_invoices: number
  paid_on_time: number
  paid_late: number
  unpaid: number
  average_days_to_pay: number
  payment_score: number
}

export async function getCustomerPaymentBehavior() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_customer_payment_behavior')

  if (error) {
    // Error fetching payment behavior
    return []
  }

  return data as PaymentBehavior[]
}

// ============================================
// 3. PRODUCT PERFORMANCE
// ============================================

export type ProductPerformance = {
  product_id: number
  product_name: string
  total_quantity_sold: number
  total_revenue: number
  total_orders: number
  average_price: number
}

export async function getProductPerformance(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_product_performance', {
    start_date: startDate || null,
    end_date: endDate || null
  })

  if (error) {
    // Error fetching product performance
    return []
  }

  return data as ProductPerformance[]
}

export type StockTurnover = {
  product_id: number
  product_name: string
  current_stock: number
  quantity_sold: number
  average_stock: number
  turnover_rate: number
  days_in_period: number
}

export async function getStockTurnoverRate(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_stock_turnover_rate', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) {
    // Error fetching stock turnover
    return []
  }

  return data as StockTurnover[]
}

export type SlowMovingInventory = {
  product_id: number
  product_name: string
  current_stock: number
  last_sale_date: string | null
  days_since_last_sale: number
  stock_value: number
}

export async function getSlowMovingInventory(daysThreshold: number = 90) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_slow_moving_inventory', {
    days_threshold: daysThreshold
  })

  if (error) {
    // Error fetching slow moving inventory
    return []
  }

  return data as SlowMovingInventory[]
}

// ============================================
// 4. FINANCIAL REPORTS
// ============================================

export type ProfitLossItem = {
  category: string
  amount: number
}

export async function getProfitLossStatement(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_profit_loss_statement', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) {
    // Error fetching P&L statement
    return []
  }

  return data as ProfitLossItem[]
}

export type CashFlowItem = {
  flow_type: string
  amount: number
}

export async function getCashFlowAnalysis(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_cash_flow_analysis', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) {
    // Error fetching cash flow
    return []
  }

  return data as CashFlowItem[]
}

export type ARAgingBucket = {
  age_bucket: string
  invoice_count: number
  total_amount: number
}

export async function getAccountsReceivableAging() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_accounts_receivable_aging')

  if (error) {
    // Error fetching AR aging
    return []
  }

  return data as ARAgingBucket[]
}

// ============================================
// 5. SUPPLIER PERFORMANCE
// ============================================

export type SupplierPerformance = {
  supplier_id: number
  supplier_name: string
  total_orders: number
  on_time_deliveries: number
  late_deliveries: number
  on_time_percentage: number
  total_spent: number
  average_order_value: number
}

export async function getSupplierPerformance() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_supplier_performance')

  if (error) {
    // Error fetching supplier performance
    return []
  }

  return data as SupplierPerformance[]
}

// ============================================
// 6. WAREHOUSE ANALYTICS
// ============================================

export type WarehouseTurnover = {
  warehouse_id: number
  warehouse_name: string
  total_stock_value: number
  total_sales: number
  turnover_rate: number
}

export async function getWarehouseTurnover(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_warehouse_turnover', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) {
    // Error fetching warehouse turnover
    return []
  }

  return data as WarehouseTurnover[]
}

// ============================================
// 7. SHIPMENT ANALYTICS
// ============================================

export type ShipmentAnalytics = {
  shipment_type: string
  total_shipments: number
  total_volume: number
  total_weight: number
  total_value: number
  average_cost_per_shipment: number
}

export async function getShipmentAnalytics(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_shipment_analytics', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) {
    // Error fetching shipment analytics
    return []
  }

  return data as ShipmentAnalytics[]
}

export type CustomsClearanceStats = {
  average_clearance_days: number
  min_clearance_days: number
  max_clearance_days: number
  total_cleared: number
}

export async function getCustomsClearanceStats() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_customs_clearance_stats')

  if (error) {
    // Error fetching customs clearance stats
    return null
  }

  return data?.[0] as CustomsClearanceStats || null
}
