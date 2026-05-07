"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createStockAdjustment, type AdjustmentType } from "../actions"
import { AlertCircle } from "lucide-react"

interface StockAdjustmentFormProps {
  products: Array<{ id: string; name: string; stock_quantity: number }>
  warehouses: Array<{ id: string; name: string }>
  employees: Array<{ id: string; full_name: string }>
}

export function StockAdjustmentForm({
  products,
  warehouses,
  employees,
}: StockAdjustmentFormProps) {
  const t = useTranslations("StockAdjustments")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType | "">("")
  const [quantity, setQuantity] = useState<string>("")

  const currentProduct = products.find((p) => p.id === selectedProduct)

  const adjustmentTypes: AdjustmentType[] = [
    "damage",
    "loss",
    "found",
    "count_correction",
    "return",
    "other",
  ]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createStockAdjustment(formData)

    if (result.success) {
      router.push("/stock-adjustments")
      router.refresh()
    } else {
      setError(result.error || "Failed to create adjustment")
      setLoading(false)
    }
  }

  // Determine if quantity should be negative based on adjustment type
  const shouldBeNegative = adjustmentType === "damage" || adjustmentType === "loss" || adjustmentType === "return"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("adjustmentDetails")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="product_id">{t("product")}</Label>
            <Select
              name="product_id"
              value={selectedProduct}
              onValueChange={setSelectedProduct}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name} - {t("currentStock")}: {product.stock_quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentProduct && (
              <p className="text-sm text-muted-foreground">
                {t("currentStock")}: {currentProduct.stock_quantity} {t("units")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse_id">{t("warehouse")}</Label>
            <Select name="warehouse_id" required>
              <SelectTrigger>
                <SelectValue placeholder={t("selectWarehouse")} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment_type">{t("type")}</Label>
            <Select
              name="adjustment_type"
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as AdjustmentType)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectType")} />
              </SelectTrigger>
              <SelectContent>
                {adjustmentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t("quantity")}</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={shouldBeNegative ? "-10" : "+10"}
              required
            />
            <p className="text-sm text-muted-foreground">
              {shouldBeNegative
                ? t("quantityHintNegative")
                : t("quantityHintPositive")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t("reason")}</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder={t("reasonPlaceholder")}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("notes")} ({t("optional")})</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjusted_by">{t("adjustedBy")}</Label>
            <Select name="adjusted_by" required>
              <SelectTrigger>
                <SelectValue placeholder={t("selectEmployee")} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={String(employee.id)}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustment_date">{t("adjustmentDate")}</Label>
            <Input
              id="adjustment_date"
              name="adjustment_date"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("create")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
