"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { addAsset, assignAsset } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, UserPlus, ChevronsUpDown, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// *** CORRECTED TYPE DEFINITIONS ***
type Employee = { id: number; full_name: string }
type Warehouse = { id: number; name: string }
type Assignment = {
  id: number
  assignment_date: string
  return_date: string | null
  employee_id: number | null
}
type Asset = {
  id: number
  asset_tag: string
  type: string
  model: string | null
  serial_number: string | null
  status: string
  asset_assignments: Assignment[]
}

interface Props {
  initialAssets: Asset[]
  employees: Employee[]
  warehouses: Warehouse[] // Add warehouses to props
}
type BadgeVariant = "destructive" | "secondary" | "outline" | "success"

// Helper to get status badge color
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
export default function AssetClientPage({
  initialAssets,
  employees,
  warehouses,
}: // export default function AssetClientPage({
//   initialAssets = [],
//   employees = [],
//   warehouses = [], // Add default empty array
//}:
Props) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState<number | null>(
    null
  )
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations("AssetClientPage")
  const tCommon = useTranslations("Common")

  // State for the new asset form
  const [warehouseId, setWarehouseId] = useState<string>("")
  const [warehousePopoverOpen, setWarehousePopoverOpen] = useState(false)

  // const handleAddSubmit = (formData: FormData) => {
  //   startTransition(async () => {
  //     const result = await addAsset(formData)
  //     if (result.success) {
  //       setIsAddDialogOpen(false)
  //     } else {
  //       alert(`Error: ${result.error}`)
  //     }
  //   })
  // }
  const handleAddSubmit = (formData: FormData) => {
    // *** เพิ่มการตรวจสอบข้อมูลฝั่ง Client ***
    if (!warehouseId) {
      alert("กรุณาเลือกคลังสินค้า")
      return
    }

    // Manually append the selected warehouse ID
    formData.append("warehouseId", warehouseId)

    startTransition(async () => {
      const result = await addAsset(formData)
      if (result.success) {
        setIsAddDialogOpen(false)
        setWarehouseId("") // Reset state
      } else {
        alert(`Error: ${result.error}`)
      }
    })
  }

  const handleAssignSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await assignAsset(formData)
      if (result.success) {
        setIsAssignDialogOpen(null)
      } else {
        alert(`Error: ${result.error}`)
      }
    })
  }

  const handleRowClick = (assetId: number) => {
    router.push(`/assets/${assetId}`)
  }

  // Show loading or error state if data is missing
  if (!initialAssets || !employees || !warehouses) {
    return (
      <div className="p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading assets data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={20} className="mr-2" /> {t("addNew")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("DialogTitle")}</DialogTitle>
              <DialogDescription>{t("DialogDescription")}</DialogDescription>
            </DialogHeader>
            <form action={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t("type")}</Label>
                <Input
                  id="type"
                  name="type"
                  placeholder="e.g., Laptop, Monitor"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">{t("model")}</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g., Dell XPS 15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number</Label>
                <Input id="serial_number" name="serial_number" />
              </div>
              <div className="space-y-2">
                <Label>คลังสินค้า</Label>
                <Popover
                  open={warehousePopoverOpen}
                  onOpenChange={setWarehousePopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {warehouseId
                        ? warehouses.find((w) => String(w.id) === warehouseId)
                            ?.name
                        : "-- เลือกคลังสินค้า --"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="ค้นหาคลังสินค้า..." />
                      <CommandList>
                        <CommandEmpty>ไม่พบคลังสินค้า</CommandEmpty>
                        <CommandGroup>
                          {warehouses.map((w) => (
                            <CommandItem
                              key={w.id}
                              value={w.name}
                              onSelect={() => {
                                setWarehouseId(String(w.id))
                                setWarehousePopoverOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  warehouseId === String(w.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {w.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_date">{t("purchase_date")}</Label>
                <Input id="purchase_date" name="purchase_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_price">{t("purchase_price")}</Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="1.0"
                  placeholder="0.00"
                  defaultValue={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea id="notes" name="notes" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {tCommon("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tableHeaderTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableHeaderID")}</TableHead>
                <TableHead>{t("tableHeaderType")}</TableHead>
                <TableHead>{t("tableHeaderModel")}</TableHead>
                <TableHead>{t("tableHeaderStatus")}</TableHead>
                <TableHead>{t("tableHeaderUser")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialAssets && initialAssets.length > 0 ? (
                initialAssets.map((asset) => {
                  const currentAssignment = asset.asset_assignments?.find(
                    (a) => a.return_date === null
                  )
                  const assignedEmployee = employees?.find(
                    (emp) => emp.id === currentAssignment?.employee_id
                  )

                  return (
                    <TableRow
                      key={asset.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(asset.id)}
                    >
                      <TableCell className="font-medium">
                        {asset.asset_tag}
                      </TableCell>
                      <TableCell>{asset.type}</TableCell>
                      <TableCell>{asset.model}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getStatusVariant(asset.status) as BadgeVariant
                          }
                        >
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignedEmployee ? assignedEmployee.full_name : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {asset.status === "In Stock" && (
                          <Dialog
                            open={isAssignDialogOpen === asset.id}
                            onOpenChange={(isOpen) =>
                              setIsAssignDialogOpen(isOpen ? asset.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t("AssigntoButton")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t("AssigntoTitle")}</DialogTitle>
                                <DialogDescription>
                                  {t("AssigntoDescription")} {asset.asset_tag} (
                                  {asset.type})
                                </DialogDescription>
                              </DialogHeader>
                              <form action={handleAssignSubmit}>
                                <input
                                  type="hidden"
                                  name="assetId"
                                  value={asset.id}
                                />
                                <div className="py-4">
                                  <Label htmlFor="employeeId">
                                    {t("employee")}:
                                  </Label>
                                  <Select name="employeeId" required>
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={t("employeePlaceholder")}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {employees && employees.length > 0 ? (
                                        employees.map((emp) => (
                                          <SelectItem
                                            key={emp.id}
                                            value={String(emp.id)}
                                          >
                                            {emp.full_name}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="" disabled>
                                          No employees available
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button type="submit" disabled={isPending}>
                                    {isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {t("confirmButton")}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No assets found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
