/**
 * Advanced Analytics Dashboard
 * Comprehensive analytics and reports for business intelligence
 */

import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  Package,
  DollarSign,
  Truck,
  Warehouse,
  Ship,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import {
  getTopCustomers,
  getSalesConversionRate,
  getCustomerSegmentation,
  getProductPerformance,
  getSlowMovingInventory,
  getProfitLossStatement,
  getAccountsReceivableAging,
  getSupplierPerformance,
  getShipmentAnalytics,
  getCustomsClearanceStats,
} from "./actions";

export default async function AdvancedAnalyticsPage() {
  const t = await getTranslations("Analytics");

  // Set date range (last 30 days)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch all data in parallel
  const [
    topCustomers,
    conversionRate,
    customerSegments,
    productPerformance,
    slowMovingInventory,
    profitLoss,
    arAging,
    supplierPerformance,
    shipmentAnalytics,
    customsStats,
  ] = await Promise.all([
    getTopCustomers(startDate, endDate, 10),
    getSalesConversionRate(startDate, endDate),
    getCustomerSegmentation(),
    getProductPerformance(startDate, endDate),
    getSlowMovingInventory(90),
    getProfitLossStatement(startDate, endDate),
    getAccountsReceivableAging(),
    getSupplierPerformance(),
    getShipmentAnalytics(startDate, endDate),
    getCustomsClearanceStats(),
  ]);

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")} • {t("dateRange")}: {startDate} {t("to")} {endDate}
        </p>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("conversionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionRate?.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {conversionRate?.converted_quotations} /{" "}
              {conversionRate?.total_quotations} {t("quotations")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalCustomers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerSegments.reduce(
                (sum, seg) => sum + seg.customer_count,
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {customerSegments.find((s) => s.segment === "VIP")
                ?.customer_count || 0}{" "}
              VIP {t("customers")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("slowMovingItems")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {slowMovingInventory.length}
            </div>
            <p className="text-xs text-muted-foreground">{t("over90Days")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("avgCustomsClearance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customsStats?.average_clearance_days.toFixed(1) || 0} {t("days")}
            </div>
            <p className="text-xs text-muted-foreground">
              {customsStats?.total_cleared || 0} {t("shipments")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("topCustomers")}
            </CardTitle>
            <CardDescription>{t("topCustomersDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead className="text-right">{t("orders")}</TableHead>
                  <TableHead className="text-right">{t("revenue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.slice(0, 5).map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-medium">
                      {customer.customer_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.total_invoices}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{customer.total_revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Customer Segmentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("customerSegmentation")}
            </CardTitle>
            <CardDescription>{t("customerSegmentationDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("segment")}</TableHead>
                  <TableHead className="text-right">{t("count")}</TableHead>
                  <TableHead className="text-right">{t("revenue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerSegments.map((segment) => (
                  <TableRow key={segment.segment}>
                    <TableCell className="font-medium">
                      {segment.segment}
                    </TableCell>
                    <TableCell className="text-right">
                      {segment.customer_count}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{segment.total_revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("bestSellingProducts")}
            </CardTitle>
            <CardDescription>{t("bestSellingProductsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead className="text-right">{t("qtySold")}</TableHead>
                  <TableHead className="text-right">{t("revenue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productPerformance.slice(0, 5).map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.total_quantity_sold}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{product.total_revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Slow Moving Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              {t("slowMovingInventory")}
            </CardTitle>
            <CardDescription>{t("slowMovingInventoryDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead className="text-right">{t("stock")}</TableHead>
                  <TableHead className="text-right">
                    {t("daysSinceLastSale")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowMovingInventory.slice(0, 5).map((product) => (
                  <TableRow key={product.product_id}>
                    <TableCell className="font-medium">
                      {product.product_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.current_stock}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {product.days_since_last_sale} {t("days")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Profit & Loss */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("profitLoss")}
            </CardTitle>
            <CardDescription>{t("profitLossDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profitLoss.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.category}
                    </TableCell>
                    <TableCell
                      className={`text-right ${item.amount < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      ฿{Math.abs(item.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* AR Aging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("arAging")}
            </CardTitle>
            <CardDescription>{t("arAgingDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ageBucket")}</TableHead>
                  <TableHead className="text-right">{t("invoices")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arAging.map((bucket, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {bucket.age_bucket}
                    </TableCell>
                    <TableCell className="text-right">
                      {bucket.invoice_count}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{bucket.total_amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {t("supplierPerformance")}
            </CardTitle>
            <CardDescription>{t("supplierPerformanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("supplier")}</TableHead>
                  <TableHead className="text-right">{t("orders")}</TableHead>
                  <TableHead className="text-right">
                    {t("onTimeRate")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierPerformance.slice(0, 5).map((supplier) => (
                  <TableRow key={supplier.supplier_id}>
                    <TableCell className="font-medium">
                      {supplier.supplier_name}
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.total_orders}
                    </TableCell>
                    <TableCell
                      className={`text-right ${supplier.on_time_percentage >= 80 ? "text-green-600" : "text-orange-600"}`}
                    >
                      {supplier.on_time_percentage.toFixed(0)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Shipment Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              {t("shipmentAnalytics")}
            </CardTitle>
            <CardDescription>{t("shipmentAnalyticsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead className="text-right">{t("shipments")}</TableHead>
                  <TableHead className="text-right">{t("volume")}</TableHead>
                  <TableHead className="text-right">{t("value")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipmentAnalytics.map((shipment, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {shipment.shipment_type}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.total_shipments}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.total_volume.toFixed(2)} m³
                    </TableCell>
                    <TableCell className="text-right">
                      ${shipment.total_value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
