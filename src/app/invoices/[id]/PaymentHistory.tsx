import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
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
import DeletePaymentButton from "./DeletePaymentButton"

interface Props {
  invoiceId: number
}

type Payment = {
  payment_id: number
  payment_date: string
  amount: number
  payment_method: string
  reference_number: string | null
  notes: string | null
}

const getPaymentMethodLabel = (method: string, t: any) => {
  const methods: { [key: string]: string } = {
    cash: t("methods.cash"),
    bank_transfer: t("methods.bankTransfer"),
    check: t("methods.check"),
    credit_card: t("methods.creditCard"),
    other: t("methods.other"),
  }
  return methods[method] || method
}

export default async function PaymentHistory({ invoiceId }: Props) {
  const t = await getTranslations("PaymentHistory")
  const supabase = await createClient()

  const { data: payments, error } = await supabase.rpc("get_invoice_payments", {
    p_invoice_id: invoiceId,
  })

  if (error) {
    console.error("Error fetching payments:", error)
    return null
  }

  const paymentList: Payment[] = payments || []

  if (paymentList.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead>{t("method")}</TableHead>
              <TableHead>{t("reference")}</TableHead>
              <TableHead>{t("notes")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paymentList.map((payment) => (
              <TableRow key={payment.payment_id}>
                <TableCell>{formatDate(payment.payment_date)}</TableCell>
                <TableCell className="font-semibold">
                  ฿
                  {Number(payment.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getPaymentMethodLabel(payment.payment_method, t)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {payment.reference_number || "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {payment.notes || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <DeletePaymentButton
                    paymentId={payment.payment_id}
                    invoiceId={invoiceId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("totalPaid")}</p>
            <p className="text-xl font-bold">
              ฿
              {paymentList
                .reduce((sum, p) => sum + Number(p.amount), 0)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
