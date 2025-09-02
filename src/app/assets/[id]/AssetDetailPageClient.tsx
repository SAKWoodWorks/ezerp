"use client"

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
  ArrowLeft,
  Calendar,
  Tag,
  Hash,
  User,
  DollarSign,
  Warehouse,
  ClipboardList,
} from "lucide-react"
import { useTranslations } from "next-intl"
import ReturnAssetButton from "./ReturnAssetButton"
import EditAssetForm from "./EditAssetForm"
import UpdateStatusButton from "./UpdateStatusButton"
import { Badge } from "@/components/ui/badge"
import type { User as SupabaseUser } from "@supabase/supabase-js"

// Type Definitions
type Employee = {
  id: number
  full_name: string
}
type Warehouse = { id: number; name: string } // Add Warehouse type
type Assignment = {
  id: number
  assignment_date: string
  return_date: string | null
  employees: Employee | null
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
  warehouse_id: number | null
}

interface ClientProps {
  asset: Asset
  warehouses: Warehouse[] // Receive warehouses
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

const getStatusVariant = (status: string) => {
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

export default function AssetDetailPageClient({
  asset,
  warehouses,
  user,
}: ClientProps) {
  const t = useTranslations("AssetDetailPageClient")
  const currentAssignment = asset.asset_assignments.find(
    (a) => a.return_date === null
  )
  const assetWarehouse = warehouses.find((w) => w.id === asset.warehouse_id)
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
        <UpdateStatusButton assetId={asset.id} currentStatus={asset.status} />
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
            {/* --- 2. เพิ่มส่วนแสดงผลคลังสินค้า --- */}
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

      {/* ส่ง warehouses ไปให้ EditForm */}
      {user && <EditAssetForm asset={asset} warehouses={warehouses} />}

      <Card>
        <CardHeader>
          <CardTitle>{t("historyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("historyTableHeadEmployees")}</TableHead>
                <TableHead>{t("historyTableHeadAssignDate")}</TableHead>
                <TableHead>{t("historyTableHeadReturnDate")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asset.asset_assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.employees
                      ? assignment.employees.full_name
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatDate(assignment.assignment_date)}
                  </TableCell>
                  <TableCell>{formatDate(assignment.return_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
