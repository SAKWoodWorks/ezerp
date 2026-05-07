/**
 * Export Shipment Detail Page
 * หน้ารายละเอียดการส่งออกสินค้า
 *
 * This page displays detailed information about a single export shipment
 * หน้านี้แสดงรายละเอียดของการส่งออกสินค้า
 */

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getExportShipmentById } from "../actions";
import { DeleteButton } from "./DeleteButton";
import {
  ArrowLeft,
  Edit,
  Plane,
  Package,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

/**
 * Status badge colors / สีของ Badge สถานะ
 */
const statusColors = {
  pending: "secondary",
  packed: "default",
  ready: "default",
  shipped: "default",
  in_transit: "default",
  delivered: "default",
  completed: "default",
  cancelled: "destructive",
} as const;

/**
 * Page Props / คุณสมบัติของหน้า
 */
type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExportShipmentDetailPage(props: Props) {
  // Await params for Next.js 15 / รอ params สำหรับ Next.js 15
  const params = await props.params;
  const { id } = params;

  // Get translations / ดึงคำแปล
  const t = await getTranslations("ExportShipments");

  // Fetch shipment data / ดึงข้อมูลการส่งออก
  const shipment = await getExportShipmentById(id);

  if (!shipment) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      {/* Header Section / ส่วนหัว */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/export-shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Plane className="h-8 w-8" />
              {shipment.shipment_number}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("createdAt")}: {new Date(shipment.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/export-shipments/${id}/edit`}>
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
          <p className="text-sm text-muted-foreground mb-1">
            {t("shipmentStatus")}
          </p>
          <Badge
            variant={
              statusColors[shipment.status as keyof typeof statusColors] ||
              "default"
            }
            className="text-base py-1"
          >
            {t(`statuses.${shipment.status}`)}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            {t("permitStatus")}
          </p>
          <Badge variant="outline" className="text-base py-1">
            {t(`permitStatuses.${shipment.export_permit_status}`)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Shipment Information / ข้อมูลการส่งออก */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              {t("shipmentInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("customer")}</p>
              {shipment.customer_id ? (
                <Link
                  href={`/customers/${shipment.customer_id}`}
                  className="font-medium hover:underline"
                >
                  {shipment.customers?.name}
                </Link>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                {t("destination")}
              </p>
              <p className="font-medium">
                {shipment.destination_country}
                {shipment.destination_port && ` - ${shipment.destination_port}`}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("origin")}</p>
              <p className="font-medium">
                {shipment.origin_port || "Thailand"}
              </p>
            </div>

            {shipment.warehouse_id && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("warehouse")}
                </p>
                <Link
                  href={`/warehouses/${shipment.warehouse_id}`}
                  className="font-medium hover:underline"
                >
                  {shipment.warehouses?.name}
                </Link>
              </div>
            )}

            {shipment.invoice_id && (
              <div>
                <p className="text-sm text-muted-foreground">{t("invoice")}</p>
                <Link
                  href={`/invoices/${shipment.invoice_id}`}
                  className="font-medium hover:underline"
                >
                  {shipment.invoices?.invoice_number}
                </Link>
              </div>
            )}

            {shipment.permit_number && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("permitNumber")}
                </p>
                <p className="font-medium">{shipment.permit_number}</p>
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
                  <p className="text-xl font-semibold">
                    {shipment.weight_kg} kg
                  </p>
                </div>
              )}
            </div>

            {shipment.volume_m3 && (
              <div>
                <p className="text-sm text-muted-foreground">{t("volume")}</p>
                <p className="font-medium">{shipment.volume_m3} m³</p>
              </div>
            )}

            {shipment.packing_date && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("packingDate")}
                </p>
                <p className="font-medium">
                  {new Date(shipment.packing_date).toLocaleDateString()}
                </p>
              </div>
            )}

            {shipment.packed_by && (
              <div>
                <p className="text-sm text-muted-foreground">{t("packedBy")}</p>
                <p className="font-medium">{shipment.employees?.full_name}</p>
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
                <p className="text-sm text-muted-foreground">
                  {t("unitPrice")}
                </p>
                <p className="font-medium">
                  {shipment.currency} {shipment.unit_price.toLocaleString()}
                </p>
              </div>
            )}

            {shipment.total_value && (
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("totalValue")}
                </p>
                <p className="font-medium">
                  {shipment.currency} {shipment.total_value.toLocaleString()}
                </p>
              </div>
            )}

            <Separator />

            {shipment.freight_cost && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("freightCost")}</p>
                <p>
                  {shipment.currency} {shipment.freight_cost.toLocaleString()}
                </p>
              </div>
            )}

            {shipment.insurance_cost && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("insuranceCost")}</p>
                <p>
                  {shipment.currency} {shipment.insurance_cost.toLocaleString()}
                </p>
              </div>
            )}

            {shipment.export_duty && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("exportDuty")}</p>
                <p>
                  {shipment.currency} {shipment.export_duty.toLocaleString()}
                </p>
              </div>
            )}

            {shipment.other_charges && (
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">{t("otherCharges")}</p>
                <p>
                  {shipment.currency} {shipment.other_charges.toLocaleString()}
                </p>
              </div>
            )}

            {shipment.total_cost && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <p className="font-semibold">{t("totalCost")}</p>
                  <p className="font-bold text-lg">
                    {shipment.currency} {shipment.total_cost.toLocaleString()}
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
                <p className="text-sm text-muted-foreground">
                  {t("voyageNumber")}
                </p>
                <p className="font-medium">{shipment.voyage_number}</p>
              </div>
            )}

            {shipment.shipping_line && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("shippingLine")}
                </p>
                <p className="font-medium">{shipment.shipping_line}</p>
              </div>
            )}

            {shipment.container_number && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("containerNumber")}
                </p>
                <p className="font-medium">
                  {shipment.container_number}
                  {shipment.container_type && ` (${shipment.container_type})`}
                </p>
              </div>
            )}

            {shipment.seal_number && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("sealNumber")}
                </p>
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
                <p className="text-sm text-muted-foreground mb-1">
                  {t("tracking")}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={shipment.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("orderDate")}
                  </div>
                  <div className="font-medium">
                    {new Date(shipment.order_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.packing_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("packingDate")}
                  </div>
                  <div className="font-medium">
                    {new Date(shipment.packing_date).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.estimated_departure_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("estDeparture")}
                  </div>
                  <div className="font-medium">
                    {new Date(
                      shipment.estimated_departure_date,
                    ).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.actual_departure_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("actualDeparture")}
                  </div>
                  <div className="font-medium">
                    {new Date(
                      shipment.actual_departure_date,
                    ).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.estimated_arrival_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("estArrival")}
                  </div>
                  <div className="font-medium">
                    {new Date(
                      shipment.estimated_arrival_date,
                    ).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.actual_arrival_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("actualArrival")}
                  </div>
                  <div className="font-medium">
                    {new Date(
                      shipment.actual_arrival_date,
                    ).toLocaleDateString()}
                  </div>
                </div>
              )}
              {shipment.delivery_confirmation_date && (
                <div className="flex items-start gap-4">
                  <div className="w-32 text-sm text-muted-foreground">
                    {t("deliveryConfirmed")}
                  </div>
                  <div className="font-medium">
                    {new Date(
                      shipment.delivery_confirmation_date,
                    ).toLocaleDateString()}
                  </div>
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
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("publicNotes")}
                  </p>
                  <p className="whitespace-pre-wrap">{shipment.notes}</p>
                </div>
              )}
              {shipment.internal_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("internalNotes")}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {shipment.internal_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
