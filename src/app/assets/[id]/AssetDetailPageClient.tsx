"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
import {
  ArrowLeft,
  Calendar,
  Tag,
  Hash,
  User,
  DollarSign,
  Warehouse,
  ClipboardList,
  Wrench,
  MessageSquare,
  //Tool,
  Store,
} from "lucide-react"
import { useTranslations } from "next-intl"
import ReturnAssetButton from "./ReturnAssetButton"
import EditAssetForm from "./EditAssetForm"
import UpdateStatusButton from "./UpdateStatusButton"
import AddRepairDialog from "./AddRepairDialog"
import { Badge } from "@/components/ui/badge"
import type { User as SupabaseUser } from "@supabase/supabase-js"

// Type Definitions
type Employee = {
  id: number
  full_name: string
}
type WarehouseInfo = { id: number; name: string }
type Assignment = {
  id: number
  assignment_date: string
  return_date: string | null
  employees: Employee | null
}
type RepairHistory = {
  id: number
  repair_date_in: string
  repair_date_out: string | null
  description: string | null
  repair_notes: string | null
  repair_shop: string | null
  cost: number | null
}
type Asset = {
  id: number
  asset_tag: string
  type: string
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_price: number | null
  status: string
  notes: string | null
  asset_assignments: Assignment[]
  asset_repairs: RepairHistory[]
  warehouse_id: number | null
}

interface ClientProps {
  asset: Asset
  warehouses: WarehouseInfo[]
  user: SupabaseUser | null
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
type BadgeVariant = "destructive" | "secondary" | "outline" | "success"

const getStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "Assigned":
      return "destructive"
    case "In Repair":
      return "secondary"
    case "Retired":
      return "outline"
    case "In Stock":
    default:
      return "success"
  }
}

// Timeline Item Component
const TimelineItem = ({
  date,
  title,
  description,
  icon,
  children,
}: {
  date: string
  title: string
  description?: string | null
  icon: React.ElementType
  children?: React.ReactNode
}) => {
  const Icon = icon
  return (
    <div className="flex gap-x-3">
      <div className="relative last:after:hidden after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-1/2 after:bg-border">
        <div className="relative z-10 size-7 flex justify-center items-center">
          <div className="size-2 rounded-full bg-muted-foreground/30 ring-4 ring-background"></div>
        </div>
      </div>
      <div className="grow pt-1 pb-8">
        <div className="flex gap-x-2 items-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground ml-auto">{date}</p>
        </div>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
    </div>
  )
}

export default function AssetDetailPageClient({
  asset,
  warehouses,
  user,
}: ClientProps) {
  const t = useTranslations("AssetDetailPageClient")
  const currentAssignment =
    asset.asset_assignments?.find((a) => a.return_date === null) || null
  const assetWarehouse = warehouses.find((w) => w.id === asset.warehouse_id)

  const timelineEvents = [
    ...(asset.asset_assignments || []).map((a) => ({
      date: new Date(a.assignment_date),
      type: "assignment" as const,
      data: a,
    })),
    ...(asset.asset_repairs || []).map((r) => ({
      date: new Date(r.repair_date_in),
      type: "repair" as const,
      data: r,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/assets"
            className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backlink")}
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">
              {asset.type}: {asset.model}
            </h1>
            <Badge
              variant={getStatusVariant(asset.status) as BadgeVariant}
              className="text-base"
            >
              {asset.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddRepairDialog assetId={asset.id} />
          <UpdateStatusButton assetId={asset.id} currentStatus={asset.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>{t("id")}:</strong>
              <span className="ml-2">{asset.asset_tag}</span>
            </div>
            <div className="flex items-center">
              <ClipboardList className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>{t("type")}:</strong>
              <span className="ml-2">{asset.type}</span>
            </div>
            <div className="flex items-center">
              <Hash className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>{t("serialNumber")}:</strong>
              <span className="ml-2">{asset.serial_number || "-"}</span>
            </div>
            <div className="flex items-center">
              <Warehouse className="w-4 h-4 mr-2 text-muted-foreground" />
              <strong>คลังสินค้า:</strong>
              <span className="ml-2">
                {assetWarehouse ? assetWarehouse.name : "-"}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>{t("purchaseDate")}:</strong>
              <span className="ml-2">{formatDate(asset.purchase_date)}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>{t("purchasePrice")}:</strong>
              <span className="ml-2">{asset.purchase_price || "-"} บาท</span>
            </div>
            <div>
              <strong>{t("notes")}:</strong>
              <p className="text-sm text-muted-foreground">
                {asset.notes || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("currentUser")}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAssignment && currentAssignment.employees ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />{" "}
                  <strong>{currentAssignment.employees.full_name}</strong>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("assignDate")}:{" "}
                  {formatDate(currentAssignment.assignment_date)}
                </p>
                <ReturnAssetButton
                  assignmentId={currentAssignment.id}
                  assetId={asset.id}
                />
              </div>
            ) : (
              <p className="text-muted-foreground">{t("inStock")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {user && <EditAssetForm asset={asset} warehouses={warehouses} />}

      <Card>
        <CardHeader>
          <CardTitle>ประวัติและไทม์ไลน์</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length > 0 ? (
            timelineEvents.map((event, index) => {
              if (event.type === "assignment") {
                const { data } = event
                return (
                  <TimelineItem
                    key={`assign-${index}`}
                    date={formatDate(data.assignment_date)}
                    title={`เบิกจ่ายให้: ${data.employees?.full_name || "N/A"}`}
                    description={
                      data.return_date
                        ? `คืนเมื่อ: ${formatDate(data.return_date)}`
                        : "กำลังใช้งาน"
                    }
                    icon={User}
                  />
                )
              } else if (event.type === "repair") {
                const { data } = event
                return (
                  <TimelineItem
                    key={`repair-${index}`}
                    date={formatDate(data.repair_date_in)}
                    title="ส่งซ่อม"
                    icon={Wrench}
                  >
                    <div className="mt-2 text-sm text-muted-foreground space-y-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5" />
                        <p>
                          <strong>อาการที่เสีย:</strong>{" "}
                          {data.description || "-"}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Store className="w-4 h-4 mt-0.5" />
                        <p>
                          <strong>ส่งซ่อมที่:</strong> {data.repair_shop || "-"}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Wrench className="w-4 h-4 mt-0.5" />
                        <p>
                          <strong>บันทึกการซ่อม:</strong>{" "}
                          {data.repair_notes || "-"}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="w-4 h-4 mt-0.5" />
                        <p>
                          <strong>ค่าใช้จ่าย:</strong>{" "}
                          {data.cost?.toLocaleString() || "0"} บาท
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-0.5" />
                        <p>
                          <strong>วันที่รับคืน:</strong>{" "}
                          {formatDate(data.repair_date_out)}
                        </p>
                      </div>
                    </div>
                  </TimelineItem>
                )
              }
              return null
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              ยังไม่มีประวัติ
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
