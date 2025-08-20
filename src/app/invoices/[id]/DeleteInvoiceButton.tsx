"use client"

import { deleteInvoice } from "../actions"
import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
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

export default function DeleteInvoiceButton({
  invoiceId,
}: {
  invoiceId: number
}) {
  const deleteInvoiceWithId = deleteInvoice.bind(null, invoiceId)
  const t = useTranslations("DeleteDialog")
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 size={16} className="mr-2" />
          {t("deleteInvoice")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={deleteInvoiceWithId}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">
                {t("confirm")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
