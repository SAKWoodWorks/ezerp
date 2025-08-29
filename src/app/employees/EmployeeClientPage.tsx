"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addEmployee } from "./actions"
import { Plus, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

// Updated Employee type to include warehouse information
type Employee = {
  id: number
  full_name: string
  position: string | null
  start_date: string | null
  warehouses: { name: string } | null // Can be an object or null
}

type Warehouse = {
  id: number
  name: string
}

// --- FIX: Make 'warehouses' a required prop ---
interface Props {
  initialEmployees: Employee[]
  warehouses?: Warehouse[]
}

export default function EmployeeClientPage({
  initialEmployees,
  warehouses,
}: Props) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // State for the warehouse popover
  const [warehousePopoverOpen, setWarehousePopoverOpen] = useState(false)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")

  useEffect(() => {
    setEmployees(initialEmployees)
  }, [initialEmployees])

  const handleFormSubmit = (formData: FormData) => {
    // Manually set warehouseId from state to FormData
    formData.set("warehouseId", selectedWarehouseId)
    startTransition(async () => {
      await addEmployee(formData)
      setIsDialogOpen(false)
      setSelectedWarehouseId("") // Reset selection after submit
    })
  }

  const handleRowClick = (employeeId: number) => {
    router.push(`/employees/${employeeId}`)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">พนักงาน</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={20} className="mr-2" /> เพิ่มพนักงานใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มพนักงานใหม่</DialogTitle>
            </DialogHeader>
            <form action={handleFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                  <Input id="fullName" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">ตำแหน่ง</Label>
                  <Input id="position" name="position" />
                </div>

                {/* Warehouse Selection Popover */}
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
                        aria-expanded={warehousePopoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedWarehouseId
                          ? warehouses?.find(
                              (wh) => String(wh.id) === selectedWarehouseId
                            )?.name
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
                            {warehouses &&
                              warehouses.map((wh) => (
                                <CommandItem
                                  key={wh.id}
                                  value={wh.name}
                                  onSelect={() => {
                                    setSelectedWarehouseId(String(wh.id))
                                    setWarehousePopoverOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedWarehouseId === String(wh.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {wh.name}
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">วันเริ่มงาน</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  บันทึก
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพนักงานทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ-นามสกุล</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead>คลังสินค้า</TableHead> {/* New Column */}
                <TableHead>วันเริ่มงาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(employee.id)}
                >
                  <TableCell className="font-medium">
                    {employee.full_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.position}
                  </TableCell>
                  {/* Display Warehouse Name */}
                  <TableCell className="text-muted-foreground">
                    {employee.warehouses?.name || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(employee.start_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
