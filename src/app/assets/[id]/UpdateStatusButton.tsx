"use client"

import { useTransition } from "react"
import { updateAssetStatus } from "../actions"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Wrench, Trash2, Loader2, Undo2 } from "lucide-react"

interface Props {
  assetId: number
  currentStatus: string
}

export default function AssetStatusActions({ assetId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === currentStatus) return
    startTransition(async () => {
      const result = await updateAssetStatus(assetId, newStatus)
      if (result?.error) {
        alert(`Error: ${result.error}`)
      }
    })
  }

  // --- 1. เพิ่มเงื่อนไขการแสดงผลปุ่มตามสถานะปัจจุบัน ---

  // กรณีที่สถานะเป็น "ส่งซ่อม"
  if (currentStatus === "In Repair") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isPending}>
            <Undo2 className="mr-2 h-4 w-4" />
            รับคืนจากซ่อม
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการรับคืนจากซ่อม?</AlertDialogTitle>
            <AlertDialogDescription>
              สถานะของทรัพย์สินจะเปลี่ยนกลับเป็น &quot;In Stock&quot;
              และพร้อมสำหรับการเบิกจ่ายอีกครั้ง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange("In Stock")}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // กรณีที่สถานะเป็น "อยู่ในสต็อก" (In Stock)
  if (currentStatus === "In Stock") {
    return (
      <div className="flex items-center gap-2">
        {/* --- ปุ่มส่งซ่อม --- */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              <Wrench className="mr-2 h-4 w-4" />
              ส่งซ่อม
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการส่งซ่อม?</AlertDialogTitle>
              <AlertDialogDescription>
                สถานะของทรัพย์สินจะเปลี่ยนเป็น &quot;In Repair&quot;
                และจะไม่สามารถเบิกจ่ายได้จนกว่าจะรับคืน
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusChange("In Repair")}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ยืนยัน
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- ปุ่มจำหน่าย/ตัดบัญชี --- */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              จำหน่าย
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการจำหน่ายทรัพย์สิน?</AlertDialogTitle>
              <AlertDialogDescription>
                สถานะของทรัพย์สินจะเปลี่ยนเป็น &quot;Retired&quot;
                และจะถูกนำออกจากระบบอย่างถาวร การกระทำนี้ไม่สามารถย้อนกลับได้
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusChange("Retired")}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                ยืนยัน
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // ถ้าสถานะเป็นอย่างอื่น (เช่น Assigned หรือ Retired) จะไม่แสดงปุ่มใดๆ
  return null
}
