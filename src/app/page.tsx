import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import {
  Wallet,
  Receipt,
  LineChart,
  Warehouse,
  Package,
  TriangleAlert,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Type Definitions ---
type SalesByWarehouse = {
  warehouse_name: string
  total_sales: number | null // Allow for null from the database
}
type InventoryByWarehouse = {
  warehouse_name: string
  total_items: number | null
  total_value: number | null
}
type LowStockItem = {
  product_id: number
  product_name: string
  warehouse_name: string
  quantity: number
  low_stock_threshold: number
}

// Add this type definition for the RPC response
type DashboardStats = {
  paid_invoice_total: number | null
  total_cash_sales: number | null
  sales_by_warehouse: SalesByWarehouse[] | null
  inventory_by_warehouse: InventoryByWarehouse[] | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const t = await getTranslations("Dashboard")

  // Fetch all dashboard data with efficient RPC calls
  const [statsData, lowStockData] = await Promise.all([
    supabase.rpc("get_full_dashboard_stats").single(),
    supabase.rpc("get_low_stock_by_warehouse"),
  ])

  const { data: stats, error: statsError } = statsData
  const { data: lowStockItems, error: lowStockError } = lowStockData

  if (statsError || lowStockError || !stats) {
    console.error("Dashboard Error:", { statsError, lowStockError })
    return <p className="p-8">Error loading dashboard data.</p>
  }
  // Type assertion to tell TypeScript what the stats object contains
  const typedStats = stats as DashboardStats

  // Safely parse the data from the JSONB columns
  const paidInvoiceTotal = typedStats.paid_invoice_total || 0
  const totalCashSales = typedStats.total_cash_sales || 0
  const totalSales = paidInvoiceTotal + totalCashSales
  const salesByWarehouse: SalesByWarehouse[] =
    typedStats.sales_by_warehouse || []
  const inventoryByWarehouse: InventoryByWarehouse[] =
    typedStats.inventory_by_warehouse || []
  const typedLowStockItems: LowStockItem[] = lowStockItems || []

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">{t("title")}</h1>

      {/* --- Sales Summary Section --- */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-3 lg:col-span-3 bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalSales")}
            </CardTitle>
            <LineChart className="h-4 w-4 text-primary-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ฿
              {totalSales.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-primary-foreground/80">
              {t("cardDescriptions.totalSales")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("invoiceRevenue")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿
              {paidInvoiceTotal.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cardDescriptions.invoiceRevenue")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("cashSales")}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿
              {totalCashSales.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("cardDescriptions.cashSales")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- Warehouse & Inventory Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Warehouse className="mr-2 h-5 w-5" />
              {t("salesByWarehouseTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableWarehouse")}</TableHead>
                  <TableHead className="text-right">
                    {t("tableTotalSales")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesByWarehouse.map((item) => (
                  <TableRow key={item.warehouse_name}>
                    <TableCell className="font-medium">
                      {item.warehouse_name}
                    </TableCell>
                    {/* *** CORRECTED LOGIC HERE *** */}
                    <TableCell className="text-right">
                      ฿
                      {(item.total_sales ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5" />
              {t("inventoryByWarehouseTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableWarehouse")}</TableHead>
                  <TableHead className="text-center">
                    {t("tableTotalItems")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tableTotalValue")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryByWarehouse.map((item) => (
                  <TableRow key={item.warehouse_name}>
                    <TableCell className="font-medium">
                      {item.warehouse_name}
                    </TableCell>
                    {/* *** CORRECTED LOGIC HERE *** */}
                    <TableCell className="text-center">
                      {(item.total_items ?? 0).toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿
                      {(item.total_value ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* --- Low Stock Alert Section --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TriangleAlert className="mr-2 h-5 w-5 text-destructive" />
            {t("lowStockAlertTitle")}
          </CardTitle>
          <CardDescription>{t("lowStockAlertDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableProduct")}</TableHead>
                <TableHead>{t("tableWarehouse")}</TableHead>
                <TableHead className="text-right">
                  {t("tableRemaining")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedLowStockItems.length > 0 ? (
                typedLowStockItems.map((item) => (
                  <TableRow key={`${item.product_id}-${item.warehouse_name}`}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/products/${item.product_id}`}
                        className="hover:underline"
                      >
                        {item.product_name}
                      </Link>
                    </TableCell>
                    <TableCell>{item.warehouse_name}</TableCell>
                    <TableCell className="text-right font-bold text-destructive">
                      {item.quantity} / {item.low_stock_threshold}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground h-24"
                  >
                    {t("noLowStock")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
