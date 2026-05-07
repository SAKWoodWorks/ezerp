/**
 * Import Shipments List Page
 * หน้ารายการนำเข้าสินค้า (ไม้สนจากรัสเซีย)
 *
 * This page displays all import shipments from Russia
 * หน้านี้แสดงรายการนำเข้าสินค้าทั้งหมดจากรัสเซีย
 */

import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Ship } from "lucide-react"
import { getImportShipments } from "./actions"

/**
 * Status badge color mapping
 * การกำหนดสีตามสถานะ
 */
const statusColors = {
  pending: "secondary",
  shipped: "default",
  in_transit: "default",
  customs: "outline",
  cleared: "default",
  received: "default",
  completed: "default",
  cancelled: "destructive",
} as const

export default async function ImportShipmentsPage() {
  // Get translations / ดึงข้อมูลคำแปล
  const t = await getTranslations("ImportShipments")

  // Fetch all import shipments / ดึงข้อมูลการนำเข้าทั้งหมด
  const shipments = await getImportShipments()

  return (
    <div className="container mx-auto py-6">
      {/* Header Section / ส่วนหัว */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ship className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/import-shipments/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("createNew")}
          </Link>
        </Button>
      </div>

      {/* Summary Cards / การ์ดสรุปข้อมูล */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalShipments")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("inTransit")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments.filter((s) => s.status === "in_transit").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("atCustoms")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments.filter((s) => s.status === "customs").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("completed")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {shipments.filter((s) => s.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table / ตารางรายการนำเข้า */}
      <Card>
        <CardContent className="pt-6">
          {shipments.length === 0 ? (
            // Empty state / สถานะว่างเปล่า
            <div className="text-center py-12">
              <Ship className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">{t("noShipments")}</h3>
              <p className="text-muted-foreground mt-2">
                {t("noShipmentsDescription")}
              </p>
              <Button asChild className="mt-4">
                <Link href="/import-shipments/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("createNew")}
                </Link>
              </Button>
            </div>
          ) : (
            // Table with data / ตารางที่มีข้อมูล
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("shipmentNumber")}</TableHead>
                  <TableHead>{t("supplier")}</TableHead>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead className="text-right">{t("quantity")}</TableHead>
                  <TableHead>{t("estimatedArrival")}</TableHead>
                  <TableHead className="text-right">{t("totalValue")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Link
                        href={`/import-shipments/${shipment.id}`}
                        className="font-medium hover:underline"
                      >
                        {shipment.shipment_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {shipment.suppliers?.name || "-"}
                    </TableCell>
                    <TableCell>
                      {shipment.product_name || shipment.products?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.quantity} {shipment.unit}
                    </TableCell>
                    <TableCell>
                      {shipment.estimated_arrival_date
                        ? new Date(
                            shipment.estimated_arrival_date
                          ).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {shipment.total_value
                        ? `${shipment.currency} ${shipment.total_value.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColors[
                            shipment.status as keyof typeof statusColors
                          ] || "default"
                        }
                      >
                        {t(`statuses.${shipment.status}`)}
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
