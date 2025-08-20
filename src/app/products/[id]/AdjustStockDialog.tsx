"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { adjustStock } from "../actions"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Warehouse } from "lucide-react"

// Add Warehouse type
type Warehouse = {
  id: number
  name: string
}

interface Props {
  productId: number
  currentStock: number
  warehouses: Warehouse[] // Pass warehouses as a prop
}

type AdjustmentType = "receive" | "adjustment"

export default function AdjustStockDialog({
  productId,
  currentStock,
  warehouses,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<AdjustmentType>("receive")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const t = useTranslations("AdjustStockDialog")
  const handleFormSubmit = () => {
    if (!selectedWarehouseId) {
      alert("กรุณาเลือกคลังสินค้า")
      return
    }
    if (!quantity || Number(quantity) === 0) {
      alert("กรุณากรอกจำนวนให้ถูกต้อง")
      return
    }

    const formData = new FormData()
    formData.append("productId", String(productId))
    formData.append("type", type)
    formData.append("quantityChange", quantity)
    formData.append("notes", notes)
    formData.append("warehouseId", selectedWarehouseId) // Add warehouseId

    startTransition(async () => {
      const result = await adjustStock(formData)
      if (result.success) {
        alert("ปรับปรุงสต็อกสำเร็จ!")
        setIsOpen(false)
        // Reset form state
        setQuantity("")
        setNotes("")
        setType("receive")
        setSelectedWarehouseId("")
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.error}`)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Warehouse className="mr-2 h-4 w-4" />
          {t("buttonTitle")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialogDescriptionMessage")} (
            {t("dialogDescription", { currentStock })})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse">{t("warehouseLabel")}</Label>
            <Select
              required
              value={selectedWarehouseId}
              onValueChange={setSelectedWarehouseId}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder={t("warehousePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={String(wh.id)}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("stockType")}</Label>
            <RadioGroup
              value={type}
              onValueChange={(value: AdjustmentType) => setType(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="receive" id="r-receive" />
                <Label htmlFor="r-receive">{t("typeReceive")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adjustment" id="r-adjustment" />
                <Label htmlFor="r-adjustment">{t("typeAdjust")}</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-1">
            <Label htmlFor="quantity">
              {type === "receive"
                ? t("quantityReceiveLabel")
                : t("quantityAdjustLabel")}
            </Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              placeholder={t("quantityAdjustPlaceholder")}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            {t("cancelButton")}
          </Button>
          <Button onClick={handleFormSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("confirmButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
