/**
 * Import Shipment Detail Page
 * หน้ารายละเอียดการนำเข้าสินค้า
 *
 * This page displays detailed information about a single import shipment
 * หน้านี้แสดงรายละเอียดของการนำเข้าสินค้า
 */

import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getImportShipmentById } from "../actions"
import { DeleteButton } from "./DeleteButton"
import { ArrowLeft, Edit, Ship, Package, DollarSign, Calendar, FileText } from "lucide-react"

/**
 * Status badge colors / สีของ Badge สถานะ
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

/**
 * Page Props / คุณสมบัติของหน้า
 */
type Props = {
  params: Promise<{ id: string }>
}

export default async function ImportShipmentDetailPage(props: Props) {
  // Await params for Next.js 15 / รอ params สำหรับ Next.js 15
  const params = await props.params
  const { id } = params

  // Get translations / ดึงคำแปล
  const t = await getTranslations("ImportShipments")

  // Fetch shipment data / ดึงข้อมูลการนำเข้า
  const shipment = await getImportShipmentById(id)

  if (!shipment) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header Section / ส่วนหัว */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/import-shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ship className="h-8 w-8" />
              {shipment.shipment_number}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("createdAt")}: {new Date(shipment.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/import-shipments/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t("edit")}
              </Link>
            </Button>
            <DeleteButton id={shipment.id} />
          </div>
        </div>
      </div>

      {/* Status Badges / แถบสถานะ */}
      <div className="mb-6 flex gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("shipmentStatus")}</p>
          <Badge
            variant={statusColors[shipment.status as keyof typeof statusColors] || "default"}
            className="text-base py-1"
          >
            {t(`statuses.${shipment.status}`)}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("customsStatus")}</p>
          <Badge variant="outline" className="text-base py-1">
            {t(`customsStatuses.${shipment.customs_status}`)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipment Information / ข้อมูลการนำเข้า */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              {t("shipmentInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("supplier")}</p>
              {shipment.supplier_id ? (
                <Link
                  href={`/suppliers/${shipment.supplier_id}`}
                  className="font-medium hover:underline"
                >
                  {shipment.suppliers?.name}
                </Link>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("origin")}</p>
              <p className="font-medium">
                {shipment.origin_country}
                {shipment.origin_port && ` - ${shipment.origin_port}`}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("destination")}</p>
              <p className="font-medium">
                {shipment.destination_port || "Thailand"}
              </p>
            </div>

            {shipment.warehouse_id && (
              <div>
                <p className="text-sm text-muted-foreground">{t("warehouse")}</p>
                <Link
                  href={`/warehouses/${shipment.warehouse_id}`}
                  className="font-medium hover:underline"
                >
                  {shipment.warehouses?.name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Information / ข้อมูลสินค้า */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t("productInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("product")}</p>
              {shipment.product_id ? (
                <Link
                  href={`/products/${shipment.product_id}`}
                  className="font-medium hover:underline"
                >
                  {shipment.products?.name}
                </Link>
              ) : (
                <p className="font-medium">{shipment.product_name || "-"}</p>
              )}
              {shipment.product_description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {shipment.product_description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("quantity")}</p>
                <p className="text-2xl font-bold">
                  {shipment.quantity} {shipment.unit}
                </p>
              </div>
              {shipment.weight_kg && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("weight")}</p>
                  <p className="text-xl font-semibold">{shipment.weight_kg} kg</p>
                </div>
              )}
            </div>

            {shipment.volume_m3 && (
              <div>
                <p className="text-sm text-muted-foreground">{t("volume")}</p>
                <p className="font-medium">{shipment.volume_m3} m³</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information / ข้อมูลทางการเงิน */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("financialInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">{t("incoterm")}</p>
              <p className="font-medium">{shipment.incoterm}</p>
            </div>

            {shipment.unit_price && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">{t("unitPrice")}</p>
                <p className="font-medium">
                  {shipment.currency} {shipment.unit_price.toLocaleString()}
                </p>
              </div>
            )}

            {shipment.total_value && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">{t("totalValue")}</p>
                <p className="font-medium">
                  {shipment.currency} {shipment.total_value.toLocaleString()}
                </p>
              </div>
            )}

            <Separator />

            {shipment.freight_cost && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("freightCost")}</p>
                <p>{shipment.currency} {shipment.freight_cost.toLocaleString()}</p>
              </div>
            )}

            {shipment.insurance_cost && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("insuranceCost")}</p>
                <p>{shipment.currency} {shipment.insurance_cost.toLocaleString()}</p>
              </div>
            )}

            {shipment.customs_duty && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("customsDuty")}</p>
                <p>{shipment.currency} {shipment.customs_duty.toLocaleString()}</p>
              </div>
            )}

            {shipment.other_charges && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("otherCharges")}</p>
                <p>{shipment.currency} {shipment.other_charges.toLocaleString()}</p>
              </div>
            )}

            {shipment.total_landed_cost && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <p className="font-semibold">{t("totalLandedCost")}</p>
                  <p className="font-bold text-lg">
                    {shipment.currency} {shipment.total_landed_cost.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Shipping Details / รายละเอียดการจัดส่ง */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("shippingDetails")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipment.vessel_name && (
              <div>
                <p className="text-sm text-muted-foreground">{t("vessel")}</p>
                <p className="font-medium">{shipment.vessel_name}</p>
              </div>
            )}

            {shipment.voyage_number && (
              <div>
                <p className="text-sm text-muted-foreground">{t("voyageNumber")}</p>
                <p className="font-medium">{shipment.voyage_number}</p>
              </div>
            )}

            {shipment.shipping_line && (
              <div>
                <p className="text-sm text-muted-foreground">{t("shippingLine")}</p>
                <p className="font-medium">{shipment.shipping_line}</p>
              </div>
            )}

            {shipment.container_number && (
              <div>
                <p className="text-sm text-muted-foreground">{t("containerNumber")}</p>
                <p className="font-medium">
                  {shipment.container_number}
                  {shipment.container_type && ` (${shipment.container_type})`}
                </p>
              </div>
            )}

            {shipment.seal_number && (
              <div>
                <p className="text-sm text-muted-foreground">{t("sealNumber")}</p>
                <p className="font-medium">{shipment.seal_number}</p>
              </div>
            )}

            {shipment.bl_number && (
              <div>
                <p className="text-sm text-muted-foreground">{t("blNumber")}</p>
                <p className="font-medium">{shipment.bl_number}</p>
              </div>
            )}

            {shipment.tracking_url && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("tracking")}</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer">
                    {t("trackShipment")}
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline / ไทม์ไลน์ */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t("timeline")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shipment.order_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("orderDate")}</div>
                  <div className="font-medium">{new Date(shipment.order_date).toLocaleDateString()}</div>
                </div>
              )}
              {shipment.estimated_departure_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("estDeparture")}</div>
                  <div className="font-medium">{new Date(shipment.estimated_departure_date).toLocaleDateString()}</div>
                </div>
              )}
              {shipment.actual_departure_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("actualDeparture")}</div>
                  <div className="font-medium">{new Date(shipment.actual_departure_date).toLocaleDateString()}</div>
                </div>
              )}
              {shipment.estimated_arrival_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("estArrival")}</div>
                  <div className="font-medium">{new Date(shipment.estimated_arrival_date).toLocaleDateString()}</div>
                </div>
              )}
              {shipment.actual_arrival_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("actualArrival")}</div>
                  <div className="font-medium">{new Date(shipment.actual_arrival_date).toLocaleDateString()}</div>
                </div>
              )}
              {shipment.customs_clearance_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("customsClearance")}</div>
                  <div className="font-medium">{new Date(shipment.customs_clearance_date).toLocaleDateString()}</div>
                </div>
              )}
              {shipment.warehouse_receipt_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">{t("warehouseReceipt")}</div>
                  <div className="font-medium">{new Date(shipment.warehouse_receipt_date).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes / หมายเหตุ */}
        {(shipment.notes || shipment.internal_notes) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t("notes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shipment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("publicNotes")}</p>
                  <p className="whitespace-pre-wrap">{shipment.notes}</p>
                </div>
              )}
              {shipment.internal_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("internalNotes")}</p>
                  <p className="whitespace-pre-wrap">{shipment.internal_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
