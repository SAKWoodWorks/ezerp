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
import { Package, DollarSign, TrendingUp, Warehouse } from "lucide-react"

type InventoryValuation = {
  product_id: number
  product_name: string
  warehouse_id: number
  warehouse_name: string
  quantity: number
  weighted_avg_cost: number
  total_value: number
  last_purchase_cost: number
  supplier_name: string | null
}

type ValuationSummary = {
  warehouse_id: number
  warehouse_name: string
  total_items: number
  total_quantity: number
  total_value: number
}

export default async function InventoryValuationPage() {
  const t = await getTranslations("InventoryValuationPage")
  const supabase = await createClient()

  // Fetch valuation data and summary
  const [valuationRes, summaryRes] = await Promise.all([
    supabase.rpc("get_inventory_valuation_weighted_average"),
    supabase.rpc("get_inventory_valuation_summary"),
  ])

  const { data: valuationData, error: valuationError } = valuationRes
  const { data: summaryData, error: summaryError } = summaryRes

  if (valuationError || summaryError) {
    console.error("Error fetching valuation data:", {
      valuationError,
      summaryError,
    })
    return (
      <div className="p-8">
        <p className="text-red-600">{t("errorLoading")}</p>
      </div>
    )
  }

  const valuations: InventoryValuation[] = valuationData || []
  const summaries: ValuationSummary[] = summaryData || []

  // Calculate overall totals
  const overallTotal = summaries.reduce((sum, s) => sum + Number(s.total_value), 0)
  const overallItems = summaries.reduce((sum, s) => sum + Number(s.total_items), 0)
  const overallQuantity = summaries.reduce((sum, s) => sum + Number(s.total_quantity), 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalInventoryValue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿{overallTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("valuationMethod")}: {t("weightedAverage")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalProductTypes")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallItems}</div>
            <p className="text-xs text-muted-foreground">
              {t("uniqueProducts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalQuantity")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallQuantity.toLocaleString("en-US")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("unitsInStock")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary by Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summaryByWarehouse")}</CardTitle>
          <CardDescription>{t("summaryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("warehouse")}</TableHead>
                <TableHead className="text-right">{t("products")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("totalValue")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((summary) => (
                <TableRow key={summary.warehouse_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-muted-foreground" />
                      {summary.warehouse_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {summary.total_items}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(summary.total_quantity).toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ฿
                    {Number(summary.total_value).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Valuation by Product */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detailedValuation")}</CardTitle>
          <CardDescription>{t("detailedDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead>{t("warehouse")}</TableHead>
                  <TableHead>{t("supplier")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead className="text-right">{t("avgCost")}</TableHead>
                  <TableHead className="text-right">{t("lastCost")}</TableHead>
                  <TableHead className="text-right">{t("totalValue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valuations.length > 0 ? (
                  valuations.map((item, index) => (
                    <TableRow key={`${item.product_id}-${item.warehouse_id}-${index}`}>
                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.warehouse_name}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.supplier_name || t("noSupplier")}
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(item.quantity).toLocaleString("en-US")}
                      </TableCell>
                      <TableCell className="text-right">
                        ฿
                        {Number(item.weighted_avg_cost).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        ฿
                        {Number(item.last_purchase_cost).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ฿
                        {Number(item.total_value).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t("noData")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
