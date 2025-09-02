"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Calendar, Tag, Hash, User, DollarSign, Warehouse } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Type Definitions
type Employee = {
  id: number
  full_name: string
}
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
  warehouses: { name: string } | null
}

interface Props {
  asset: Asset
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

export default function AssetPublicView({ asset }: Props) {
  const currentAssignment = asset.asset_assignments.find(
    (a) => a.return_date === null
  )

  return (
    <div className="p-4 sm:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">
          {asset.type}: {asset.model}
        </h1>
        <Badge variant={getStatusVariant(asset.status)} className="text-base">
          {asset.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>ข้อมูลทรัพย์สิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>ID:</strong>
              <span className="ml-2">{asset.asset_tag}</span>
            </div>
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>ประเภท:</strong>
              <span className="ml-2">{asset.type}</span>
            </div>
            <div className="flex items-center">
              <Hash className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>Serial Number:</strong>
              <span className="ml-2">{asset.serial_number || "-"}</span>
            </div>
            <div className="flex items-center">
              <Warehouse className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>คลังสินค้า:</strong>
              <span className="ml-2">{asset.warehouses?.name || "-"}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>วันที่ซื้อ:</strong>
              <span className="ml-2">{formatDate(asset.purchase_date)}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />{" "}
              <strong>ราคาซื้อ:</strong>
              <span className="ml-2">{asset.purchase_price || "-"} บาท</span>
            </div>
            <div>
              <strong>หมายเหตุ:</strong>
              <p className="text-sm text-muted-foreground">
                {asset.notes || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ผู้ใช้งานปัจจุบัน</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAssignment && currentAssignment.employees ? (
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2" />{" "}
                  <strong>{currentAssignment.employees.full_name}</strong>
                </div>
                <p className="text-sm text-muted-foreground">
                  วันที่เบิกจ่าย:{" "}
                  {formatDate(currentAssignment.assignment_date)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">อยู่ในสต็อก</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเบิกจ่าย</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>พนักงาน</TableHead>
                <TableHead>วันที่เบิกจ่าย</TableHead>
                <TableHead>วันที่คืน</TableHead>
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
