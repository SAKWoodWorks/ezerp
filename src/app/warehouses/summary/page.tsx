import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Package,
  LineChart,
  Users,
  Laptop,
  PieChart,
  BadgeAlert,
  Crown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// --- Type Definitions ---
type TopSellingProduct = { product_name: string; total_quantity_sold: number }
type LowStockProduct = {
  name: string
  quantity: number
  threshold: number
  product_id: number
}
type AssetSummary = { [key: string]: number }
type WarehouseSummary = {
  warehouse_id: number
  warehouse_name: string
  product_item_count: number
  inventory_value: number
  current_month_sales: number
  top_selling_products: TopSellingProduct[] | null
  low_stock_products: LowStockProduct[] | null
  asset_summary: AssetSummary | null
  assigned_employees: string[] | null
}

export default async function WarehouseSummaryPage() {
  const supabase = await createClient()
  const t = await getTranslations("WarehouseSummaryPage")

  const { data: summaryData, error } = await supabase.rpc(
    "get_full_warehouse_details"
  )

  if (error) {
    console.error("Error fetching warehouse summary:", error)
    return <p className="p-8">Error loading data.</p>
  }

  const summaries = (summaryData || []) as WarehouseSummary[]

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="h-8 w-8" />
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {summaries.map((summary) => (
          <Card key={summary.warehouse_id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl">
                <Link
                  href={`/warehouses/${summary.warehouse_id}`}
                  className="hover:underline"
                >
                  {summary.warehouse_name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow">
              {/* Key Stats */}
              <div className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <Package className="w-4 h-4 mr-2" />
                    {t("productItems")}
                  </span>
                  <span className="font-semibold">
                    {summary.product_item_count}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <LineChart className="w-4 h-4 mr-2" />
                    {t("inventoryValue")}
                  </span>
                  <span className="font-semibold">
                    ฿
                    {summary.inventory_value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    {t("currentMonthSales")}
                  </span>
                  <span className="font-semibold">
                    ฿
                    {summary.current_month_sales.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Top Selling Products */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                  {t("topSellingTitle")}
                </h4>
                {summary.top_selling_products &&
                summary.top_selling_products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("tableProduct")}</TableHead>
                        <TableHead className="text-right">
                          {t("tableSoldQty")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.top_selling_products.map((p) => (
                        <TableRow key={p.product_name}>
                          <TableCell>{p.product_name}</TableCell>
                          <TableCell className="text-right">
                            {p.total_quantity_sold}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    {t("noData")}
                  </p>
                )}
              </div>

              {/* Low Stock Products */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <BadgeAlert className="w-4 h-4 mr-2 text-destructive" />
                  {t("lowStockTitle")}
                </h4>
                {summary.low_stock_products &&
                summary.low_stock_products.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("tableProduct")}</TableHead>
                        <TableHead className="text-right">
                          {t("tableRemainingQty")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.low_stock_products.map((p) => (
                        <TableRow key={p.name}>
                          <TableCell>
                            <Link
                              href={`/products/${p.product_id}`}
                              className="hover:underline text-blue-600"
                            >
                              {p.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right text-destructive font-bold">
                            {p.quantity} / {p.threshold}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    {t("noData")}
                  </p>
                )}
              </div>

              {/* Asset Summary */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Laptop className="w-4 h-4 mr-2" />
                  {t("assetSummaryTitle")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.asset_summary ? (
                    Object.entries(summary.asset_summary).map(
                      ([status, count]) => (
                        <Badge key={status} variant="secondary">
                          {status}: {count}
                        </Badge>
                      )
                    )
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {t("noData")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
