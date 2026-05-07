import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getStockAdjustments } from "./actions"
import { Plus } from "lucide-react"

const adjustmentTypeColors = {
  damage: "destructive",
  loss: "destructive",
  found: "default",
  count_correction: "secondary",
  return: "outline",
  other: "outline",
} as const

export default async function StockAdjustmentsPage() {
  const t = await getTranslations("StockAdjustments")
  const adjustments = await getStockAdjustments()

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/stock-adjustments/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("createNew")}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("adjustmentNumber")}</TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("warehouse")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead className="text-right">{t("quantity")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead>{t("adjustedBy")}</TableHead>
              <TableHead>{t("date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {t("noAdjustments")}
                </TableCell>
              </TableRow>
            ) : (
              adjustments.map((adjustment) => (
                <TableRow key={adjustment.id}>
                  <TableCell>
                    <Link
                      href={`/stock-adjustments/${adjustment.id}`}
                      className="font-medium hover:underline"
                    >
                      {adjustment.adjustment_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{adjustment.product?.name}</div>
                  </TableCell>
                  <TableCell>{adjustment.warehouse?.name}</TableCell>
                  <TableCell>
                    <Badge variant={adjustmentTypeColors[adjustment.adjustment_type]}>
                      {t(`types.${adjustment.adjustment_type}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        adjustment.quantity > 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {adjustment.quantity > 0 ? "+" : ""}
                      {adjustment.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {adjustment.reason}
                  </TableCell>
                  <TableCell>
                    {adjustment.employee?.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    {new Date(adjustment.adjustment_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
