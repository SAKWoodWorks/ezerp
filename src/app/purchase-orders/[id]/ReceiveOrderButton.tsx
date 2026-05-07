"use client"

import { useState, useTransition } from "react"
import { receiveOrderItems } from "../actions"
import { useTranslations } from "next-intl"
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
import { Label } from "@/components/ui/label"
import { Loader2, PackageCheck } from "lucide-react"

type Warehouse = {
  id: number
  name: string
}

export default function ReceiveOrderButton({
  purchaseOrderId,
  warehouses,
}: {
  purchaseOrderId: number
  warehouses: Warehouse[]
}) {
  const t = useTranslations("PurchaseOrderDetailPage")
  const [isOpen, setIsOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleReceive = () => {
    if (!selectedWarehouse) {
      alert(t("selectWarehouse"))
      return
    }

    startTransition(async () => {
      const result = await receiveOrderItems(purchaseOrderId, selectedWarehouse)
      if (result.error) {
        alert(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PackageCheck size={16} className="mr-2" />
          {t("receiveButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("receiveDialogTitle")}</DialogTitle>
          <DialogDescription>{t("receiveDialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">{t("warehouseLabel")}</Label>
            <select
              id="warehouse"
              value={selectedWarehouse || ""}
              onChange={(e) => setSelectedWarehouse(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">{t("selectWarehouse")}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            {t("cancelButton")}
          </Button>
          <Button onClick={handleReceive} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirmReceive")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
