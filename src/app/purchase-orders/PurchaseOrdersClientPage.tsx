"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PurchaseOrder = {
  id: number
  po_number: string
  order_date: string
  expected_delivery_date: string | null
  status: string
  total_amount: number
  suppliers: {
    name: string
  }
}

interface Props {
  initialPurchaseOrders: PurchaseOrder[]
}

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

export default function PurchaseOrdersClientPage({
  initialPurchaseOrders,
}: Props) {
  const t = useTranslations("PurchaseOrdersPage")
  const tStatus = useTranslations("POStatus")
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders)
  const router = useRouter()

  useEffect(() => {
    setPurchaseOrders(initialPurchaseOrders)
  }, [initialPurchaseOrders])

  const handleRowClick = (poId: number) => {
    router.push(`/purchase-orders/${poId}`)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button onClick={() => router.push("/purchase-orders/new")}>
          <Plus size={20} className="mr-2" /> {t("addNew")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("tableHeaderTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableHeaderNumber")}</TableHead>
                <TableHead>{t("tableHeaderSupplier")}</TableHead>
                <TableHead>{t("tableHeaderOrderDate")}</TableHead>
                <TableHead>{t("tableHeaderExpectedDate")}</TableHead>
                <TableHead className="text-right">{t("tableHeaderTotal")}</TableHead>
                <TableHead className="text-center">{t("tableHeaderStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((po) => (
                  <TableRow
                    key={po.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(po.id)}
                  >
                    <TableCell className="font-medium">{po.po_number}</TableCell>
                    <TableCell>{po.suppliers.name}</TableCell>
                    <TableCell>{formatDate(po.order_date)}</TableCell>
                    <TableCell>
                      {po.expected_delivery_date
                        ? formatDate(po.expected_delivery_date)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿
                      {Number(po.total_amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(po.status)}>
                        {tStatus(po.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    {t("noPurchaseOrders")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
