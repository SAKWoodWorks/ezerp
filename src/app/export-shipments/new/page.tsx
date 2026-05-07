/**
 * New Export Shipment Page
 * หน้าสร้างการส่งออกสินค้าใหม่
 *
 * This page provides a form to create a new export shipment
 * หน้านี้แสดงฟอร์มสำหรับสร้างการส่งออกสินค้าใหม่
 */

import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plane } from "lucide-react"
import { createExportShipment } from "../actions"
import { createClient } from "@/lib/supabase/server"

export default async function NewExportShipmentPage() {
  // Get translations / ดึงคำแปล
  const t = await getTranslations("ExportShipments")

  // Fetch customers, products, and warehouses for dropdowns
  // ดึงข้อมูล customers, products และ warehouses สำหรับ dropdown
  const supabase = await createClient()

  const [customersRes, productsRes, warehousesRes] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("products").select("id, name, sku").order("name"),
    supabase.from("warehouses").select("id, name").order("name"),
  ])

  const customers = customersRes.data || []
  const products = productsRes.data || []
  const warehouses = warehousesRes.data || []

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header / ส่วนหัว */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/export-shipments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Plane className="h-8 w-8" />
          {t("createNew")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("createNewDescription")}</p>
      </div>

      {/* Form / ฟอร์ม */}
      <form action={createExportShipment}>
        <div className="space-y-6">
          {/* Basic Information / ข้อมูลพื้นฐาน */}
          <Card>
            <CardHeader>
              <CardTitle>{t("basicInfo")}</CardTitle>
              <CardDescription>{t("basicInfoDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer / ลูกค้า */}
              <div className="space-y-2">
                <Label htmlFor="customer_id">{t("customer")}</Label>
                <Select name="customer_id">
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCustomer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Destination Country / ประเทศปลายทาง */}
                <div className="space-y-2">
                  <Label htmlFor="destination_country">{t("destinationCountry")} *</Label>
                  <Input
                    id="destination_country"
                    name="destination_country"
                    placeholder={t("destinationCountryPlaceholder")}
                    required
                  />
                </div>

                {/* Destination Port / ท่าเรือปลายทาง */}
                <div className="space-y-2">
                  <Label htmlFor="destination_port">{t("destinationPort")}</Label>
                  <Input
                    id="destination_port"
                    name="destination_port"
                    placeholder={t("destinationPortPlaceholder")}
                  />
                </div>
              </div>

              {/* Origin Port / ท่าเรือต้นทาง */}
              <div className="space-y-2">
                <Label htmlFor="origin_port">{t("originPort")}</Label>
                <Input
                  id="origin_port"
                  name="origin_port"
                  defaultValue="Thailand"
                />
              </div>

              {/* Warehouse / คลังสินค้า */}
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">{t("warehouse")}</Label>
                <Select name="warehouse_id">
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectWarehouse")} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Product Information / ข้อมูลสินค้า */}
          <Card>
            <CardHeader>
              <CardTitle>{t("productInfo")}</CardTitle>
              <CardDescription>{t("productInfoDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Selection / เลือกสินค้า */}
              <div className="space-y-2">
                <Label htmlFor="product_id">{t("product")} ({t("optional")})</Label>
                <Select name="product_id">
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectProduct")} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Name / ชื่อสินค้า */}
              <div className="space-y-2">
                <Label htmlFor="product_name">{t("productName")} *</Label>
                <Input
                  id="product_name"
                  name="product_name"
                  placeholder={t("productNamePlaceholder")}
                  required
                />
              </div>

              {/* Product Description / รายละเอียดสินค้า */}
              <div className="space-y-2">
                <Label htmlFor="product_description">{t("productDescription")}</Label>
                <Textarea
                  id="product_description"
                  name="product_description"
                  placeholder={t("productDescriptionPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Quantity / ปริมาณ */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t("quantity")} *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    required
                  />
                </div>

                {/* Unit / หน่วย */}
                <div className="space-y-2">
                  <Label htmlFor="unit">{t("unit")}</Label>
                  <Select name="unit" defaultValue="m³">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m³">m³</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ton">ton</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Weight / น้ำหนัก */}
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">{t("weightKg")}</Label>
                  <Input
                    id="weight_kg"
                    name="weight_kg"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Volume / ปริมาตร */}
              <div className="space-y-2">
                <Label htmlFor="volume_m3">{t("volumeM3")}</Label>
                <Input
                  id="volume_m3"
                  name="volume_m3"
                  type="number"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information / ข้อมูลทางการเงิน */}
          <Card>
            <CardHeader>
              <CardTitle>{t("financialInfo")}</CardTitle>
              <CardDescription>{t("financialInfoDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Currency / สกุลเงิน */}
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("currency")}</Label>
                  <Select name="currency" defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="THB">THB</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Incoterm */}
                <div className="space-y-2">
                  <Label htmlFor="incoterm">{t("incoterm")}</Label>
                  <Select name="incoterm" defaultValue="FOB">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="CFR">CFR</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                      <SelectItem value="DAP">DAP</SelectItem>
                      <SelectItem value="DDP">DDP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unit Price / ราคาต่อหน่วย */}
                <div className="space-y-2">
                  <Label htmlFor="unit_price">{t("unitPrice")}</Label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    step="0.01"
                  />
                </div>

                {/* Total Value / มูลค่ารวม */}
                <div className="space-y-2">
                  <Label htmlFor="total_value">{t("totalValue")}</Label>
                  <Input
                    id="total_value"
                    name="total_value"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Freight Cost / ค่าขนส่ง */}
                <div className="space-y-2">
                  <Label htmlFor="freight_cost">{t("freightCost")}</Label>
                  <Input
                    id="freight_cost"
                    name="freight_cost"
                    type="number"
                    step="0.01"
                  />
                </div>

                {/* Insurance Cost / ค่าประกัน */}
                <div className="space-y-2">
                  <Label htmlFor="insurance_cost">{t("insuranceCost")}</Label>
                  <Input
                    id="insurance_cost"
                    name="insurance_cost"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Export Duty / ภาษีส่งออก */}
                <div className="space-y-2">
                  <Label htmlFor="export_duty">{t("exportDuty")}</Label>
                  <Input
                    id="export_duty"
                    name="export_duty"
                    type="number"
                    step="0.01"
                  />
                </div>

                {/* Other Charges / ค่าใช้จ่ายอื่นๆ */}
                <div className="space-y-2">
                  <Label htmlFor="other_charges">{t("otherCharges")}</Label>
                  <Input
                    id="other_charges"
                    name="other_charges"
                    type="number"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Details / รายละเอียดการจัดส่ง */}
          <Card>
            <CardHeader>
              <CardTitle>{t("shippingDetails")}</CardTitle>
              <CardDescription>{t("shippingDetailsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Vessel Name / ชื่อเรือ */}
                <div className="space-y-2">
                  <Label htmlFor="vessel_name">{t("vesselName")}</Label>
                  <Input
                    id="vessel_name"
                    name="vessel_name"
                    placeholder={t("vesselNamePlaceholder")}
                  />
                </div>

                {/* Voyage Number / เที่ยวเรือ */}
                <div className="space-y-2">
                  <Label htmlFor="voyage_number">{t("voyageNumber")}</Label>
                  <Input
                    id="voyage_number"
                    name="voyage_number"
                  />
                </div>
              </div>

              {/* Shipping Line / สายเรือ */}
              <div className="space-y-2">
                <Label htmlFor="shipping_line">{t("shippingLine")}</Label>
                <Input
                  id="shipping_line"
                  name="shipping_line"
                  placeholder={t("shippingLinePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Container Number / เลขตู้คอนเทนเนอร์ */}
                <div className="space-y-2">
                  <Label htmlFor="container_number">{t("containerNumber")}</Label>
                  <Input
                    id="container_number"
                    name="container_number"
                  />
                </div>

                {/* Container Type / ประเภทตู้ */}
                <div className="space-y-2">
                  <Label htmlFor="container_type">{t("containerType")}</Label>
                  <Select name="container_type">
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectContainerType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20ft">20ft</SelectItem>
                      <SelectItem value="40ft">40ft</SelectItem>
                      <SelectItem value="40ft HC">40ft HC</SelectItem>
                      <SelectItem value="45ft HC">45ft HC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Seal Number / เลขซีล */}
                <div className="space-y-2">
                  <Label htmlFor="seal_number">{t("sealNumber")}</Label>
                  <Input
                    id="seal_number"
                    name="seal_number"
                  />
                </div>

                {/* B/L Number / เลข Bill of Lading */}
                <div className="space-y-2">
                  <Label htmlFor="bl_number">{t("blNumber")}</Label>
                  <Input
                    id="bl_number"
                    name="bl_number"
                  />
                </div>
              </div>

              {/* Tracking URL / ลิงก์ติดตามสถานะ */}
              <div className="space-y-2">
                <Label htmlFor="tracking_url">{t("trackingUrl")}</Label>
                <Input
                  id="tracking_url"
                  name="tracking_url"
                  type="url"
                  placeholder="https://"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates / วันที่ต่างๆ */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dates")}</CardTitle>
              <CardDescription>{t("datesDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Order Date / วันสั่งซื้อ */}
                <div className="space-y-2">
                  <Label htmlFor="order_date">{t("orderDate")}</Label>
                  <Input
                    id="order_date"
                    name="order_date"
                    type="date"
                  />
                </div>

                {/* Estimated Departure / วันออกเดินทาง (โดยประมาณ) */}
                <div className="space-y-2">
                  <Label htmlFor="estimated_departure_date">{t("estDeparture")}</Label>
                  <Input
                    id="estimated_departure_date"
                    name="estimated_departure_date"
                    type="date"
                  />
                </div>

                {/* Estimated Arrival / วันถึง (โดยประมาณ) */}
                <div className="space-y-2">
                  <Label htmlFor="estimated_arrival_date">{t("estArrival")}</Label>
                  <Input
                    id="estimated_arrival_date"
                    name="estimated_arrival_date"
                    type="date"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes / หมายเหตุ */}
          <Card>
            <CardHeader>
              <CardTitle>{t("notes")}</CardTitle>
              <CardDescription>{t("notesDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Public Notes / หมายเหตุทั่วไป */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t("publicNotes")}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder={t("publicNotesPlaceholder")}
                />
              </div>

              {/* Internal Notes / หมายเหตุภายใน */}
              <div className="space-y-2">
                <Label htmlFor="internal_notes">{t("internalNotes")}</Label>
                <Textarea
                  id="internal_notes"
                  name="internal_notes"
                  rows={3}
                  placeholder={t("internalNotesPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button / ปุ่มบันทึก */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/export-shipments">{t("cancel")}</Link>
            </Button>
            <Button type="submit">{t("create")}</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
