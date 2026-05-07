import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import DeleteButton from "./DeleteButton"
import UpdateStatusButton from "./UpdateStatusButton"
import ReceiveOrderButton from "./ReceiveOrderButton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "received":
      return "success"
    case "sent":
      return "default"
    case "cancelled":
      return "destructive"
    case "draft":
    default:
      return "secondary"
  }
}

export default async function PurchaseOrderDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations("PurchaseOrderDetailPage")
  const tStatus = await getTranslations("POStatus")
  const params = await props.params
  const { id } = params

  const supabase = await createClient()

  const [poRes, warehousesRes] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select(
        `
        *,
        suppliers ( id, name ),
        purchase_order_items ( id, product_id, description, quantity, unit_price, total_price, products ( id, name ) )
      `
      )
      .eq("id", id)
      .single(),
    supabase.from("warehouses").select("id, name"),
  ])

  const { data: purchaseOrder, error } = poRes
  const { data: warehouses } = warehousesRes

  if (error || !purchaseOrder) {
    console.error(error)
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateTotal = () => {
    return purchaseOrder.purchase_order_items.reduce(
      (sum: number, item: any) => sum + Number(item.total_price),
      0
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/purchase-orders"
            className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backLink")}
          </Link>
          <h1 className="text-3xl font-bold">
            {t("poTitle")} {purchaseOrder.po_number}
          </h1>
          <Badge variant={getStatusBadgeVariant(purchaseOrder.status)} className="mt-2">
            {tStatus(purchaseOrder.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {purchaseOrder.status !== "received" && purchaseOrder.status !== "cancelled" && (
            <Link href={`/purchase-orders/${purchaseOrder.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                {t("editButton")}
              </Button>
            </Link>
          )}
          {purchaseOrder.status === "sent" && warehouses && (
            <ReceiveOrderButton
              purchaseOrderId={purchaseOrder.id}
              warehouses={warehouses}
            />
          )}
          {purchaseOrder.status !== "received" && purchaseOrder.status !== "cancelled" && (
            <UpdateStatusButton
              purchaseOrderId={purchaseOrder.id}
              currentStatus={purchaseOrder.status}
            />
          )}
          <DeleteButton purchaseOrderId={purchaseOrder.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
            <CardDescription>{t("detailsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-gray-500">{t("supplier")}</p>
                <Link
                  href={`/suppliers/${purchaseOrder.suppliers.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {purchaseOrder.suppliers.name}
                </Link>
              </div>
              <div>
                <p className="font-medium text-gray-500">{t("orderDate")}</p>
                <p>{formatDate(purchaseOrder.order_date)}</p>
              </div>
              {purchaseOrder.expected_delivery_date && (
                <div>
                  <p className="font-medium text-gray-500">{t("expectedDate")}</p>
                  <p>{formatDate(purchaseOrder.expected_delivery_date)}</p>
                </div>
              )}
            </div>
            {purchaseOrder.notes && (
              <div>
                <p className="font-medium text-gray-500">{t("notes")}</p>
                <p>{purchaseOrder.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("summaryTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("totalItems")}</span>
                <span className="font-semibold">
                  {purchaseOrder.purchase_order_items.length}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">{t("totalAmount")}</span>
                <span className="text-xl font-bold">
                  ฿
                  {calculateTotal().toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("itemsTitle")}</CardTitle>
          <CardDescription>{t("itemsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableHeaderItem")}</TableHead>
                <TableHead className="text-right">{t("tableHeaderQuantity")}</TableHead>
                <TableHead className="text-right">{t("tableHeaderUnitPrice")}</TableHead>
                <TableHead className="text-right">{t("tableHeaderTotal")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.purchase_order_items.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.product_id ? (
                      <Link
                        href={`/products/${item.product_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {item.description}
                      </Link>
                    ) : (
                      item.description
                    )}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ฿
                    {Number(item.unit_price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ฿
                    {Number(item.total_price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
