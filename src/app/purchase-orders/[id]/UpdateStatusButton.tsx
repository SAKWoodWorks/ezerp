"use client"

import { useState, useTransition } from "react"
import { updatePurchaseOrderStatus } from "../actions"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2 } from "lucide-react"

export default function UpdateStatusButton({
  purchaseOrderId,
  currentStatus,
}: {
  purchaseOrderId: number
  currentStatus: string
}) {
  const t = useTranslations("PurchaseOrderDetailPage")
  const tStatus = useTranslations("POStatus")
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(purchaseOrderId, newStatus)
      if (result.error) {
        alert(result.error)
      }
    })
  }

  const availableStatuses = ["draft", "sent", "cancelled"].filter(
    (status) => status !== currentStatus
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("updateStatus")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableStatuses.map((status) => (
          <DropdownMenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
          >
            {tStatus(status)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
