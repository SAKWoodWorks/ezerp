import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import EditForm from "./EditForm"
import RecordLeaveButton from "./RecordLeaveButton"
import DeleteButton from "./DeleteButton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ArrowLeft, Warehouse } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// --- Type Definitions ---
type Employee = {
  id: number
  full_name: string
  position: string | null
  start_date: string | null
  warehouse_id: number | null
  warehouses: {
    // Added for warehouse name
    id: number
    name: string
  } | null
}

// type WarehouseInfo = {
//   id: number
//   name: string
// }

type AssignedAsset = {
  assignment_date: string
  office_assets:
    | {
        id: number
        asset_tag: string
        type: string
        model: string | null
      }[]
    | null
}

// Alternative approach: Create a separate type for the flattened data
type FlattenedAssignedAsset = {
  assignment_date: string
  office_asset: {
    id: number
    asset_tag: string
    type: string
    model: string | null
  } | null
}

type SupabaseLeaveBalance = {
  id: number
  remaining_days: number
  leave_type_id?: number
  leave_types:
    | {
        id: number
        name: string
        default_days_per_year: number
      }
    | {
        id: number
        name: string
        default_days_per_year: number
      }[]
    | null
}

type LeaveBalance = {
  id: number
  remaining_days: number
  leave_type_id?: number
  leave_types: {
    id: number
    name: string
    default_days_per_year: number
  } | null
}

type TransformedLeaveBalance = {
  id: number
  remaining_days: number
  leave_types: {
    id: number
    name: string
    default_days_per_year: number
  } | null
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch all necessary data in parallel
  const [employeeRes, leaveBalancesRes, warehousesRes, assignedAssetsRes] =
    await Promise.all([
      supabase
        .from("employees")
        .select("*, warehouses(id, name)")
        .eq("id", id)
        .single(),
      supabase
        .from("leave_balances")
        .select(
          "id, remaining_days, leave_type_id, leave_types(id, name, default_days_per_year)"
        )
        .eq("employee_id", id),
      supabase.from("warehouses").select("id, name").order("name"),
      supabase
        .from("asset_assignments")
        .select("assignment_date, office_assets(id, asset_tag, type, model)")
        .eq("employee_id", id)
        .is("return_date", null),
    ])

  const { data: employee, error: employeeError } = employeeRes
  const { data: leaveBalancesData, error: leaveBalancesError } =
    leaveBalancesRes
  const { data: warehouses, error: warehousesError } = warehousesRes
  const { data: assignedAssets, error: assetsError } = assignedAssetsRes

  if (employeeError || !employee) {
    notFound()
  }
  if (
    leaveBalancesError ||
    !leaveBalancesData ||
    warehousesError ||
    assetsError
  ) {
    console.error("Data fetching error:", {
      leaveBalancesError,
      warehousesError,
      assetsError,
    })
    notFound()
  }

  const rawLeaveBalances = (leaveBalancesData || []) as SupabaseLeaveBalance[]
  // Add this type annotation after your data fetching
  const typedAssignedAssets = (assignedAssets || []) as AssignedAsset[]

  const leaveBalances: LeaveBalance[] = rawLeaveBalances.map((balance) => ({
    id: balance.id,
    remaining_days: balance.remaining_days,
    leave_type_id: balance.leave_type_id,
    leave_types: Array.isArray(balance.leave_types)
      ? balance.leave_types.length > 0
        ? balance.leave_types[0]
        : null
      : balance.leave_types,
  }))

  const transformedLeaveBalances: TransformedLeaveBalance[] = leaveBalances.map(
    (balance) => ({
      id: balance.id,
      remaining_days: balance.remaining_days,
      leave_types: balance.leave_types || null,
    })
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Then update your flattening logic to use the typed data
  const flattenedAssignedAssets: FlattenedAssignedAsset[] =
    typedAssignedAssets.flatMap((item) =>
      (item.office_assets || []).map((asset) => ({
        assignment_date: item.assignment_date,
        office_asset: asset,
      }))
    )

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/employees"
            className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้ารายชื่อพนักงาน
          </Link>
          <h1 className="text-3xl font-bold">{employee.full_name}</h1>
          <p className="text-muted-foreground">
            {employee.position || "ไม่มีข้อมูลตำแหน่ง"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RecordLeaveButton
            employeeId={employee.id}
            leaveBalances={transformedLeaveBalances}
          />
          <DeleteButton employeeId={employee.id} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลพนักงาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-500">วันเริ่มงาน</p>
              <p className="text-lg font-semibold">
                {formatDate(employee.start_date)}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">คลังสินค้า</p>
              <p className="text-lg font-semibold flex items-center">
                <Warehouse className="w-4 h-4 mr-2 text-muted-foreground" />
                {employee.warehouses?.name || "ไม่ได้ระบุ"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ยอดวันลา</CardTitle>
            <CardDescription>สรุปจำนวนวันลาในปีนี้</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภทการลา</TableHead>
                  <TableHead className="text-right">วันลาที่ได้รับ</TableHead>
                  <TableHead className="text-right">วันลาคงเหลือ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveBalances.length > 0 ? (
                  leaveBalances.map((balance) => {
                    const leaveType = balance.leave_types
                    return (
                      <TableRow key={balance.id}>
                        <TableCell className="font-medium">
                          {leaveType?.name ??
                            `N/A (ID: ${balance.leave_type_id || "unknown"})`}
                        </TableCell>
                        <TableCell className="text-right">
                          {leaveType
                            ? `${leaveType.default_days_per_year} วัน`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {balance.remaining_days} วัน
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      ไม่พบข้อมูลวันลา
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Card for Assigned Assets */}
      <Card>
        <CardHeader>
          <CardTitle>ทรัพย์สินที่รับผิดชอบ</CardTitle>
          <CardDescription>
            รายการอุปกรณ์สำนักงานที่กำลังเบิกใช้งาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขทะเบียน</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>รุ่น/ยี่ห้อ</TableHead>
                <TableHead>วันที่เบิก</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flattenedAssignedAssets.length > 0 ? (
                flattenedAssignedAssets.map(
                  (item, index) =>
                    item.office_asset && (
                      <TableRow key={`${item.office_asset.id}-${index}`}>
                        <TableCell>
                          <Link
                            href={`/assets/${item.office_asset.id}`}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {item.office_asset.asset_tag}
                          </Link>
                        </TableCell>
                        <TableCell>{item.office_asset.type}</TableCell>
                        <TableCell>{item.office_asset.model || "-"}</TableCell>
                        <TableCell>
                          {formatDate(item.assignment_date)}
                        </TableCell>
                      </TableRow>
                    )
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    ไม่มีทรัพย์สินที่กำลังเบิกใช้งาน
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditForm employee={employee as Employee} warehouses={warehouses || []} />
    </div>
  )
}
