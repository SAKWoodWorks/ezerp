"use client"

import { useState, useTransition } from "react"
import { addRepairHistory } from "../actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Wrench } from "lucide-react"

interface Props {
  assetId: number
}

export default function AddRepairDialog({ assetId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    formData.append("assetId", String(assetId))
    startTransition(async () => {
      const result = await addRepairHistory(formData)
      if (result.success) {
        setIsOpen(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wrench className="mr-2 h-4 w-4" />
          เพิ่มประวัติการซ่อม
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มประวัติการซ่อม</DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดการซ่อมอุปกรณ์ชิ้นนี้
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repair_date_in">วันที่ส่งซ่อม</Label>
              <Input
                id="repair_date_in"
                name="repair_date_in"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="repair_date_out">วันที่รับคืน (ถ้ามี)</Label>
              <Input id="repair_date_out" name="repair_date_out" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">อาการที่เสีย / เหตุผลที่ส่งซ่อม</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="เช่น เปิดไม่ติด, หน้าจอแตก"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repair_shop">ส่งซ่อมที่</Label>
            <Input
              id="repair_shop"
              name="repair_shop"
              placeholder="เช่น ชื่อร้าน, ศูนย์บริการ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repair_notes">บันทึกการซ่อม</Label>
            <Textarea
              id="repair_notes"
              name="repair_notes"
              placeholder="เช่น เปลี่ยนแบตเตอรี่, อัปเดตซอฟต์แวร์"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">ค่าใช้จ่าย (บาท)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              defaultValue={0}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              บันทึก
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
