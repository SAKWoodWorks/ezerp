"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { deletePayment } from "./payment-actions"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"

interface Props {
  paymentId: number
  invoiceId: number
}

export default function DeletePaymentButton({ paymentId, invoiceId }: Props) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("DeletePaymentButton")

  const handleDelete = () => {
    if (!confirm(t("confirmMessage"))) {
      return
    }

    startTransition(async () => {
      const result = await deletePayment(paymentId, invoiceId)
      if (result?.error) {
        alert(result.error)
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 text-destructive" />
      )}
    </Button>
  )
}
