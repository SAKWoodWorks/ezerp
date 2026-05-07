import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStockAdjustmentById } from "../actions";
import { DeleteButton } from "./DeleteButton";
import { ArrowLeft } from "lucide-react";

const adjustmentTypeColors = {
  damage: "destructive",
  loss: "destructive",
  found: "default",
  count_correction: "secondary",
  return: "outline",
  other: "outline",
} as const;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StockAdjustmentDetailPage(props: Props) {
  const params = await props.params;
  const t = await getTranslations("StockAdjustments");
  const adjustment = await getStockAdjustmentById(params.id);

  if (!adjustment) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/stock-adjustments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">
              {adjustment.adjustment_number}
            </h1>
            <p className="text-muted-foreground">
              {new Date(adjustment.adjustment_date).toLocaleString()}
            </p>
          </div>
          <DeleteButton id={adjustment.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("adjustmentInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("type")}</p>
              <Badge
                variant={adjustmentTypeColors[adjustment.adjustment_type]}
                className="mt-1"
              >
                {t(`types.${adjustment.adjustment_type}`)}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("quantity")}</p>
              <p
                className={`text-2xl font-bold ${
                  adjustment.quantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {adjustment.quantity > 0 ? "+" : ""}
                {adjustment.quantity} {t("units")}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("reason")}</p>
              <p className="font-medium">{adjustment.reason}</p>
            </div>

            {adjustment.notes && (
              <div>
                <p className="text-sm text-muted-foreground">{t("notes")}</p>
                <p className="font-medium">{adjustment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("relatedInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("product")}</p>
              <Link
                href={`/products/${adjustment.product_id}`}
                className="font-medium hover:underline"
              >
                {adjustment.product?.name}
              </Link>
              <p className="text-sm mt-1">
                {t("currentStock")}: {adjustment.product?.stock_quantity}{" "}
                {t("units")}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("warehouse")}</p>
              <Link
                href={`/warehouses/${adjustment.warehouse_id}`}
                className="font-medium hover:underline"
              >
                {adjustment.warehouse?.name}
              </Link>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("adjustedBy")}</p>
              <Link
                href={`/employees/${adjustment.adjusted_by}`}
                className="font-medium hover:underline"
              >
                {adjustment.employee?.full_name}
              </Link>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{t("createdAt")}</p>
              <p className="font-medium">
                {new Date(adjustment.created_at).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
