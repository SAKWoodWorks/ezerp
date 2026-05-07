import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function StockByGradePage() {
  const supabase = await createClient()
  const t = await getTranslations("StockByGrade")

  const { data, error } = await supabase
    .from("product_stock_by_grade")
    .select(
      `grade_a, cca_ready, grade_cca, grade_b, synced_at,
       products (name, barcode),
       warehouses (name)`
    )
    .order("synced_at", { ascending: false })

  if (error) {
    console.error("Error fetching stock by grade:", error)
  }

  const rows = data ?? []
  const lastSync =
    rows[0]?.synced_at
      ? new Date(rows[0].synced_at).toLocaleString("th-TH")
      : "—"

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("lastSync")}: {lastSync}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("product")}</TableHead>
            <TableHead>{t("code")}</TableHead>
            <TableHead>{t("warehouse")}</TableHead>
            <TableHead className="text-right">{t("gradeA")}</TableHead>
            <TableHead className="text-right">{t("ccaReady")}</TableHead>
            <TableHead className="text-right">{t("gradeCCA")}</TableHead>
            <TableHead className="text-right">{t("gradeB")}</TableHead>
            <TableHead className="text-right">{t("total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const product = row.products as unknown as { name: string; barcode: string } | null
            const warehouse = row.warehouses as unknown as { name: string } | null
            const total =
              Number(row.grade_a) +
              Number(row.cca_ready) +
              Number(row.grade_cca) +
              Number(row.grade_b)
            return (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  {product?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {product?.barcode ?? "—"}
                </TableCell>
                <TableCell>{warehouse?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {Number(row.grade_a).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {Number(row.cca_ready).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {Number(row.grade_cca).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {Number(row.grade_b).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {total.toLocaleString()}
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center text-muted-foreground py-8"
              >
                {t("noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
