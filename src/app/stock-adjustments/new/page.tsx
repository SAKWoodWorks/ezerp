import { getTranslations } from "next-intl/server"
import { StockAdjustmentForm } from "./StockAdjustmentForm"
import { getProducts, getWarehouses, getEmployees } from "../actions"

export default async function NewStockAdjustmentPage() {
  const t = await getTranslations("StockAdjustments")
  const [products, warehouses, employees] = await Promise.all([
    getProducts(),
    getWarehouses(),
    getEmployees(),
  ])

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">{t("createNew")}</h1>
      <StockAdjustmentForm
        products={products}
        warehouses={warehouses}
        employees={employees}
      />
    </div>
  )
}
