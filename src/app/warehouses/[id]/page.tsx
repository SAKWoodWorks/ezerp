import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import Link from "next/link"
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
  ArrowLeft,
  Crown,
  BadgeAlert,
  Receipt,
  FileText,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DateRangePicker } from "@/components/DateRangePicker"
import { format, addDays } from "date-fns"

// --- Type Definitions ---
type TopSellingProduct = { product_name: string; total_quantity_sold: number }
type LowStockProduct = {
  name: string
  quantity: number
  threshold: number
  product_id: number
}
type AssetSummary = { [key: string]: number }
type WarehouseDetails = {
  inventory_value: number
  product_item_count: number
  sales_in_range: number
  invoice_sales: number // Added
  cash_bill_sales: number // Added
  top_selling_products: TopSellingProduct[] | null
  low_stock_products: LowStockProduct[] | null
  asset_summary: AssetSummary | null
  assigned_employees: string[] | null
}

export default async function WarehouseDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await props.params
  const { id } = params
  const supabase = await createClient()
  const searchParams = props.searchParams ? await props.searchParams : {}
  const t = await getTranslations("WarehouseDetailPage")

  const from = searchParams.from
    ? String(searchParams.from)
    : format(addDays(new Date(), -30), "yyyy-MM-dd")
  const to = searchParams.to
    ? String(searchParams.to)
    : format(new Date(), "yyyy-MM-dd")

  const [warehouseInfo, detailsData] = await Promise.all([
    supabase.from("warehouses").select("name, address").eq("id", id).single(),
    supabase
      .rpc("get_specific_warehouse_details", {
        p_warehouse_id: id,
        p_start_date: from,
        p_end_date: to,
      })
      .single(),
  ])

  const { data: warehouse, error: warehouseError } = warehouseInfo
  const { data: details, error: detailsError } = detailsData

  if (warehouseError || detailsError || !warehouse || !details) {
    console.error({ warehouseError, detailsError })
    notFound()
  }

  const summary = details as WarehouseDetails

  return (
    <div className="p-8 space-y-6">
      <div>
        <Link
          href="/warehouses"
          className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backLink")}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{warehouse.name}</h1>
            <p className="text-muted-foreground">
              {warehouse.address || t("noAddress")}
            </p>
          </div>
          <DateRangePicker />
        </div>
      </div>

      {/* --- Key Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("inventoryValue")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary.inventory_value.toLocaleString("en-US")}
            </div>
            <p className="text-xs text-muted-foreground">
              จากสินค้า {summary.product_item_count} ประเภท
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("salesInRange")}
            </CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{summary.sales_in_range.toLocaleString("en-US")}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
              <span className="flex items-center">
                <FileText className="w-3 h-3 mr-1" /> ใบแจ้งหนี้: ฿
                {summary.invoice_sales.toLocaleString("en-US")}
              </span>
              <span className="flex items-center">
                <Receipt className="w-3 h-3 mr-1" /> บิลเงินสด: ฿
                {summary.cash_bill_sales.toLocaleString("en-US")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling & Low Stock */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                {t("topSellingTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BadgeAlert className="w-4 h-4 mr-2 text-destructive" />
                {t("lowStockTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
        {/* Assets & Employees */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Laptop className="w-4 h-4 mr-2" />
                {t("assetSummaryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {summary.asset_summary ? (
                Object.entries(summary.asset_summary).map(([status, count]) => (
                  <Badge key={status} variant="secondary">
                    {status}: {count}
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">{t("noData")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {t("assignedEmployeesTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.assigned_employees &&
              summary.assigned_employees.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {summary.assigned_employees.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">{t("noData")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
