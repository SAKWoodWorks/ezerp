"use client"

import { useState, useTransition } from "react"
import { updateAsset } from "../actions"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Pencil, Loader2, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Use the same Asset type from the detail page
type Warehouse = { id: number; name: string }
type Asset = {
  id: number
  asset_tag: string
  type: string
  model: string | null
  serial_number: string | null
  purchase_date: string | null
  status: string
  notes: string | null
  purchase_price: number | null
  warehouse_id: number | null
}

interface Props {
  asset: Asset
  warehouses: Warehouse[]
}

export default function EditAssetForm({ asset, warehouses }: Props) {
  const t = useTranslations("EditAssetForm")
  const tCommon = useTranslations("Common")

  // State for warehouse selection, initialized with the asset's current warehouse
  const [warehouseId, setWarehouseId] = useState<string>(
    String(asset.warehouse_id || "")
  )
  const [warehousePopoverOpen, setWarehousePopoverOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const updateAssetWithId = updateAsset.bind(null, asset.id)

  const handleSubmit = (formData: FormData) => {
    // Manually append the selected warehouse ID
    formData.append("warehouseId", warehouseId)

    startTransition(async () => {
      const result = await updateAssetWithId(formData)
      if (result.success) {
        setIsEditing(false)
      } else {
        alert(`Error: ${result.error}`)
      }
    })
  }

  if (!isEditing) {
    return (
      <div className="mt-6">
        <Button onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("editFormButton")}
        </Button>
      </div>
    )
  }

  return (
    <form action={handleSubmit}>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("editFormTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("editFormID")}</Label>
            <Input value={asset.asset_tag} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">{t("editFormType")}</Label>
            <Input id="type" name="type" defaultValue={asset.type} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">{t("editFormModel")}</Label>
            <Input id="model" name="model" defaultValue={asset.model ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial_number">{t("editFormSerialNumber")}</Label>
            <Input
              id="serial_number"
              name="serial_number"
              defaultValue={asset.serial_number ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>คลังสินค้า</Label>
            <Popover
              open={warehousePopoverOpen}
              onOpenChange={setWarehousePopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {warehouseId
                    ? warehouses.find((w) => String(w.id) === warehouseId)?.name
                    : "-- เลือกคลังสินค้า --"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="ค้นหาคลังสินค้า..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบคลังสินค้า</CommandEmpty>
                    <CommandGroup>
                      {warehouses.map((w) => (
                        <CommandItem
                          key={w.id}
                          value={w.name}
                          onSelect={() => {
                            setWarehouseId(String(w.id))
                            setWarehousePopoverOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              warehouseId === String(w.id)
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {w.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_date">{t("editFormPurchaseDate")}</Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={asset.purchase_date ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase_price">{t("editFormPurchasePrice")}</Label>
            <Input
              id="purchase_price"
              name="purchase_price"
              type="number"
              step="0.01"
              defaultValue={asset.purchase_price ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t("editFormNotes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={asset.notes ?? ""}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
