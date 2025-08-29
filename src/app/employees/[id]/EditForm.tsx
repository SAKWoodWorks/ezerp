"use client"

import { useState, useTransition } from "react"
import { updateEmployee } from "../actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Loader2, Check, ChevronsUpDown } from "lucide-react"
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

// Type Definitions
type Employee = {
  id: number
  full_name: string
  position: string | null
  start_date: string | null
  warehouse_id: number | null
}

type Warehouse = {
  id: number
  name: string
}

interface Props {
  employee: Employee
  warehouses: Warehouse[]
}

export default function EditForm({ employee, warehouses }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  // State for the warehouse popover
  const [warehousePopoverOpen, setWarehousePopoverOpen] = useState(false)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    String(employee.warehouse_id || "")
  )

  const handleFormSubmit = (formData: FormData) => {
    formData.set("warehouseId", selectedWarehouseId) // Add selected warehouse to form data
    startTransition(async () => {
      const result = await updateEmployee(employee.id, formData)
      if (result?.success) {
        alert("บันทึกข้อมูลพนักงานสำเร็จ!")
        setIsEditing(false) // ปิดฟอร์มเมื่อสำเร็จ
      } else {
        alert(`เกิดข้อผิดพลาด: ${result?.error}`)
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="mt-6">
        <Button onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          แก้ไขข้อมูลพนักงาน
        </Button>
      </div>
    )
  }

  return (
    <form action={handleFormSubmit}>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>แก้ไขข้อมูลพนักงาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
            <Input
              id="fullName"
              name="fullName"
              defaultValue={employee.full_name}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="position">ตำแหน่ง</Label>
            <Input
              id="position"
              name="position"
              defaultValue={employee.position ?? ""}
            />
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
                    ? warehouses.find(
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
                      {warehouses.map((wh) => (
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
          <div className="space-y-1">
            <Label htmlFor="startDate">วันเริ่มงาน</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={employee.start_date ?? ""}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
          >
            ยกเลิก
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            บันทึกการเปลี่ยนแปลง
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
