"use client"

import { useTransition } from "react"
//import { useRouter } from "next/navigation"
import { createReceiptFromInvoiceAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Receipt, Loader2 } from "lucide-react"

interface Props {
  invoiceId: number
}

export default function PrintReceiptButton({ invoiceId }: Props) {
  const [isPending, startTransition] = useTransition()
  //const router = useRouter()

  const handleCreateAndPrint = () => {
    startTransition(async () => {
      const result = await createReceiptFromInvoiceAction(invoiceId)
      if (result.success && result.newReceiptId) {
        // เมื่อสร้างใบเสร็จสำเร็จ ให้เปิดหน้าใบเสร็จในแท็บใหม่เพื่อพิมพ์
        window.open(`/cash-bills/${result.newReceiptId}`, "_blank")
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`)
      }
    })
  }

  return (
    <Button
      onClick={handleCreateAndPrint}
      disabled={isPending}
      variant="outline"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Receipt className="mr-2 h-4 w-4" />
      )}
      {isPending ? "กำลังสร้าง..." : "พิมพ์ใบเสร็จรับเงิน"}
    </Button>
  )
}
