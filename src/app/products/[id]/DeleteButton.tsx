"use client"
import { useTranslations } from "next-intl"
import { deleteProduct } from "../actions"
import { Trash2 } from "lucide-react"
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

export default function DeleteButton({ productId }: { productId: number }) {
  const deleteProductWithId = deleteProduct.bind(null, productId)
  const t = useTranslations("DeleteDialog")
  const tCommon = useTranslations("Common")
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 size={16} className="mr-2" />
          {t("deleteProduct")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={deleteProductWithId}>
          <AlertDialogHeader>
            <AlertDialogTitle>{tCommon("areYouSure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon("actionCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">
                {tCommon("confirmDelete")}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
