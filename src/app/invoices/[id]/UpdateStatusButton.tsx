"use client"

import { updateInvoiceStatus } from "../actions"
import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Send, Loader2 } from "lucide-react"

interface Props {
  invoiceId: number
  currentStatus: string
}

export default function UpdateStatusButton({
  invoiceId,
  currentStatus,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("UpdateStatusBUtton")

  const handleUpdateStatus = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, newStatus)
      if (result?.message === "Success") {
        router.refresh()
      } else {
        alert(result?.message || t("errorUpdate"))
      }
    })
  }

  if (currentStatus === "Paid") {
    return (
      <span className="text-green-600 font-bold flex items-center h-10 px-4">
        <CheckCircle size={20} className="mr-2" /> {t("paidSuccess")}
      </span>
    )
  }

  return (
    <div className="flex gap-2">
      {currentStatus === "Draft" && (
        <Button onClick={() => handleUpdateStatus("Sent")} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send size={16} className="mr-2" />
          )}
          {isPending ? t("saving") : t("sentSuccess")}
        </Button>
      )}
      {currentStatus !== "Draft" && (
        <Button
          onClick={() => handleUpdateStatus("Paid")}
          disabled={isPending}
          variant="success"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle size={16} className="mr-2" />
          )}
          {isPending ? t("saving") : t("paid")}
        </Button>
      )}
    </div>
  )
}
