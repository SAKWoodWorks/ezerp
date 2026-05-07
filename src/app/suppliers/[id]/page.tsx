import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import EditForm from "./EditForm"
import DeleteButton from "./DeleteButton"
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
import { ArrowLeft, Plus, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default async function SupplierDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations("SupplierDetailPage")
  const params = await props.params
  const { id } = params

  const supabase = await createClient()

  // Fetch supplier with related products and purchase orders
  const [supplierRes, purchaseOrdersRes] = await Promise.all([
    supabase
      .from("suppliers")
      .select(`*, products ( id, name, price, stock_quantity )`)
      .eq("id", id)
      .single(),
    supabase
      .from("purchase_orders")
      .select("id, po_number, order_date, status, total_amount")
      .eq("supplier_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const { data: supplier, error } = supplierRes
  const { data: purchaseOrders } = purchaseOrdersRes

  if (error || !supplier) {
    console.error(error)
    notFound()
  }

  // Helper function for status badge
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "received":
        return "default"
      case "sent":
        return "secondary"
      case "cancelled":
        return "destructive"
      case "draft":
      default:
        return "outline"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/suppliers"
            className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backLink")}
          </Link>
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-muted-foreground">
            {t("contactPerson")}: {supplier.contact_person || "-"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/purchase-orders/new?supplier=${supplier.id}`}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t("createPO")}
            </Button>
          </Link>
          <DeleteButton supplierId={supplier.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("contactInfoTitle")}</CardTitle>
          <CardDescription>{t("contactInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">{t("taxId")}</p>
              <p>{supplier.tax_id || "-"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t("phone")}</p>
              <p>{supplier.phone || "-"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t("email")}</p>
              <p>{supplier.email || "-"}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t("lineId")}</p>
              <p>{supplier.line_id || "-"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium text-gray-500">{t("address")}</p>
              <p>{supplier.address || "-"}</p>
            </div>
            {supplier.notes && (
              <div className="md:col-span-2">
                <p className="font-medium text-gray-500">{t("notes")}</p>
                <p>{supplier.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("productsTitle")}</CardTitle>
          <CardDescription>{t("productsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.products && supplier.products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("productName")}</TableHead>
                  <TableHead className="text-right">{t("price")}</TableHead>
                  <TableHead className="text-right">{t("stock")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.products.map((product: any) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{Number(product.price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.stock_quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">{t("noProducts")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                {t("purchaseOrdersTitle")}
              </CardTitle>
              <CardDescription>{t("purchaseOrdersDescription")}</CardDescription>
            </div>
            <Link href={`/purchase-orders?supplier=${supplier.id}`}>
              <Button variant="outline" size="sm">
                {t("viewAll")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {purchaseOrders && purchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("poNumber")}</TableHead>
                  <TableHead>{t("orderDate")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po: any) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link
                        href={`/purchase-orders/${po.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {po.po_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(po.order_date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(po.status)}>
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ฿
                      {Number(po.total_amount || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>{t("noPurchaseOrders")}</p>
              <Link href={`/purchase-orders/new?supplier=${supplier.id}`}>
                <Button variant="outline" size="sm" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("createFirstPO")}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <EditForm supplier={supplier} />
    </div>
  )
}
