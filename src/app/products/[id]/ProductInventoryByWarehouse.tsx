"use client"
import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type ProductInventory = {
  quantity: number
  warehouses: {
    name: string
  } | null
}

interface Props {
  totalStock: number
  inventories: ProductInventory[]
}

export default function ProductInventoryByWarehouse({
  totalStock,
  inventories,
}: Props) {
  const t = useTranslations("ProductDetailPage")
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("stockInventoryTitle")}</CardTitle>
        <CardDescription>{t("stockInventoryDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("totalStock")}
          </p>
          <p className="text-2xl font-bold">
            {totalStock} {t("unitTitle")}
          </p>
        </div>
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium">{t("stockByWarehouse")}:</h4>
          {inventories.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {inventories.map((inv, index) => (
                <li key={index} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {inv.warehouses?.name || "N/A"}
                  </span>
                  <span className="font-medium">
                    {inv.quantity} {t("unitTitle")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center pt-2">
              {t("noStockInWarehouse")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
