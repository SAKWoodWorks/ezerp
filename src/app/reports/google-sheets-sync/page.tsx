import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Sync,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

// Types for the synced data
type DashboardMetrics = {
  total_sales_ytd: number
  total_customers: number
  total_products: number
  avg_order_value: number
  conversion_rate: number
  last_updated: string
}

type SalesComparison = {
  source: string
  total_sales: number
  total_orders: number
  avg_order_value: number
}

type ExternalSales = {
  id: number
  invoice_number: string
  sale_date: string | null
  customer_name: string | null
  product_name: string | null
  quantity: number
  unit_price: number
  total_amount: number
  warehouse: string | null
  sales_rep: string | null
  synced_at: string
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GoogleSheetsSyncPage(props: Props) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const t = await getTranslations("GoogleSheetsSync")

  // Get current date range (default to current month)
  const currentDate = new Date()
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

  const startDate = typeof searchParams.start_date === 'string' ? searchParams.start_date : format(startOfMonth, 'yyyy-MM-dd')
  const endDate = typeof searchParams.end_date === 'string' ? searchParams.end_date : format(endOfMonth, 'yyyy-MM-dd')

  // Fetch all data in parallel
  const [
    dashboardMetricsRes,
    salesComparisonRes,
    externalSalesRes,
    externalTopProductsRes
  ] = await Promise.all([
    supabase.rpc('get_latest_dashboard_metrics'),
    supabase.rpc('get_sales_comparison', { start_date: startDate, end_date: endDate }),
    supabase
      .from('sales_external')
      .select('*')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('synced_at', { ascending: false })
      .limit(50),
    supabase.rpc('get_external_top_products', {
      start_date: startDate,
      end_date: endDate,
      limit_count: 10
    })
  ])

  const dashboardMetrics = dashboardMetricsRes.data?.[0] as DashboardMetrics | null
  const salesComparison = (salesComparisonRes.data || []) as SalesComparison[]
  const externalSales = (externalSalesRes.data || []) as ExternalSales[]
  const externalTopProducts = externalTopProductsRes.data || []

  // Calculate sync freshness
  const lastSyncTime = externalSales[0]?.synced_at
  const syncFreshness = lastSyncTime ?
    Math.round((Date.now() - new Date(lastSyncTime).getTime()) / (1000 * 60)) : null

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title") || "Google Sheets Sync"}</h1>
          <p className="text-muted-foreground mt-1">
            {t("description") || "Dashboard metrics and sales data synced from Google Sheets"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {lastSyncTime && (
            <span>
              Last sync: {format(new Date(lastSyncTime), 'MMM d, yyyy HH:mm')}
              {syncFreshness && (
                <Badge variant={syncFreshness > 60 ? "destructive" : syncFreshness > 30 ? "secondary" : "default"} className="ml-2">
                  {syncFreshness}m ago
                </Badge>
              )}
            </span>
          )}
          {!lastSyncTime && <span>No sync data available</span>}
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      {dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales YTD</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{dashboardMetrics.total_sales_ytd.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From Google Sheets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardMetrics.total_customers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardMetrics.total_products.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Active products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ฿{dashboardMetrics.avg_order_value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardMetrics.conversion_rate}% conversion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Comparison */}
      {salesComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sync className="w-5 h-5" />
              Sales Data Comparison
            </CardTitle>
            <CardDescription>
              Comparison between internal ERP and external Google Sheets data for{' '}
              {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Avg Order Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesComparison.map((comparison, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <Badge variant={comparison.source.includes('Internal') ? 'default' : 'secondary'}>
                        {comparison.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ฿{Number(comparison.total_sales).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(comparison.total_orders).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ฿{Number(comparison.avg_order_value).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Products from External Data */}
      {externalTopProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products (Google Sheets)</CardTitle>
            <CardDescription>
              Best selling products from external sales data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {externalTopProducts.map((product: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(product.total_quantity).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ฿{Number(product.total_revenue).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(product.order_count).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent External Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent External Sales</CardTitle>
          <CardDescription>
            Latest sales records synced from Google Sheets (last 50)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {externalSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-4" />
              <p>No external sales data found for the selected period.</p>
              <p className="text-sm mt-1">Check your Google Sheets sync configuration.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Warehouse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {externalSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">
                      {sale.invoice_number}
                    </TableCell>
                    <TableCell>
                      {sale.sale_date ? format(new Date(sale.sale_date), 'MMM d') : '—'}
                    </TableCell>
                    <TableCell>{sale.customer_name || '—'}</TableCell>
                    <TableCell>{sale.product_name || '—'}</TableCell>
                    <TableCell className="text-right">
                      {sale.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ฿{sale.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {sale.warehouse || '—'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}