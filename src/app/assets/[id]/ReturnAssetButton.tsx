"use client"

import { useTransition } from "react"
import { useTranslations } from "next-intl"
import { returnAsset } from "../actions"
import { Button } from "@/components/ui/button"
import { Undo2, Loader2 } from "lucide-react"
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

interface Props {
  assignmentId: number
  assetId: number
}

export default function ReturnAssetButton({ assignmentId, assetId }: Props) {
  const t = useTranslations("AssetButton")
  const [isPending, startTransition] = useTransition()

  const handleReturn = () => {
    startTransition(async () => {
      await returnAsset(assignmentId, assetId)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <Undo2 className="mr-2 h-4 w-4" />
          {t("returnButton")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("returnButtonConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("returnButtonConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {t("returnButtonConfirmCancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleReturn} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("returnButtonConfirmConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
