import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
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
import { AlertCircle, Clock, DollarSign, FileText } from "lucide-react"

type OutstandingInvoice = {
  invoice_id: number
  invoice_number: string
  customer_id: number
  customer_name: string
  issue_date: string
  due_date: string
  total_amount: number
  paid_amount: number
  balance_due: number
  days_overdue: number
  aging_category: string
}

const getAgingBadgeVariant = (category: string) => {
  switch (category) {
    case "Current":
      return "default"
    case "1-30 days":
      return "secondary"
    case "31-60 days":
      return "destructive"
    case "61-90 days":
      return "destructive"
    case "90+ days":
      return "destructive"
    default:
      return "outline"
  }
}

export default async function OutstandingInvoicesPage() {
  const t = await getTranslations("OutstandingInvoicesPage")
  const supabase = await createClient()

  const { data: invoices, error } = await supabase.rpc(
    "get_outstanding_invoices"
  )

  if (error) {
    console.error("Error fetching outstanding invoices:", error)
    return (
      <div className="p-8">
        <p className="text-red-600">{t("errorLoading")}</p>
      </div>
    )
  }

  const outstandingInvoices: OutstandingInvoice[] = invoices || []

  // Calculate totals
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + Number(inv.balance_due),
    0
  )
  const totalOverdue = outstandingInvoices
    .filter((inv) => inv.days_overdue > 0)
    .reduce((sum, inv) => sum + Number(inv.balance_due), 0)

  // Group by aging category
  const currentInvoices = outstandingInvoices.filter(
    (inv) => inv.aging_category === "Current"
  )
  const overdue30 = outstandingInvoices.filter(
    (inv) => inv.aging_category === "1-30 days"
  )
  const overdue60 = outstandingInvoices.filter(
    (inv) => inv.aging_category === "31-60 days"
  )
  const overdue90 = outstandingInvoices.filter(
    (inv) => inv.aging_category === "61-90 days"
  )
  const overdue90Plus = outstandingInvoices.filter(
    (inv) => inv.aging_category === "90+ days"
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalOutstanding")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿
              {totalOutstanding.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {outstandingInvoices.length} {t("invoices")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalOverdue")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ฿
              {totalOverdue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {outstandingInvoices.filter((inv) => inv.days_overdue > 0).length}{" "}
              {t("overdueInvoices")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("currentDue")}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ฿
              {currentInvoices
                .reduce((sum, inv) => sum + Number(inv.balance_due), 0)
                .toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentInvoices.length} {t("notYetDue")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("oldestInvoice")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outstandingInvoices.length > 0
                ? Math.max(...outstandingInvoices.map((inv) => inv.days_overdue))
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">{t("daysOverdue")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t("agingSummary")}</CardTitle>
          <CardDescription>{t("agingDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span>{t("current")}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {currentInvoices.length} {t("invoices")}
                </span>
                <span className="font-semibold">
                  ฿
                  {currentInvoices
                    .reduce((sum, inv) => sum + Number(inv.balance_due), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span>{t("days1to30")}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {overdue30.length} {t("invoices")}
                </span>
                <span className="font-semibold">
                  ฿
                  {overdue30
                    .reduce((sum, inv) => sum + Number(inv.balance_due), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span>{t("days31to60")}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {overdue60.length} {t("invoices")}
                </span>
                <span className="font-semibold">
                  ฿
                  {overdue60
                    .reduce((sum, inv) => sum + Number(inv.balance_due), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span>{t("days61to90")}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {overdue90.length} {t("invoices")}
                </span>
                <span className="font-semibold">
                  ฿
                  {overdue90
                    .reduce((sum, inv) => sum + Number(inv.balance_due), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg">
              <span>{t("days90Plus")}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {overdue90Plus.length} {t("invoices")}
                </span>
                <span className="font-semibold">
                  ฿
                  {overdue90Plus
                    .reduce((sum, inv) => sum + Number(inv.balance_due), 0)
                    .toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("detailedList")}</CardTitle>
          <CardDescription>{t("detailedDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("issueDate")}</TableHead>
                <TableHead>{t("dueDate")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
                <TableHead className="text-right">{t("paid")}</TableHead>
                <TableHead className="text-right">{t("balance")}</TableHead>
                <TableHead>{t("aging")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outstandingInvoices.length > 0 ? (
                outstandingInvoices.map((invoice) => (
                  <TableRow key={invoice.invoice_id}>
                    <TableCell>
                      <Link
                        href={`/invoices/${invoice.invoice_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/customers/${invoice.customer_id}`}
                        className="hover:underline"
                      >
                        {invoice.customer_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.issue_date)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.due_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿
                      {Number(invoice.total_amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ฿
                      {Number(invoice.paid_amount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ฿
                      {Number(invoice.balance_due).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getAgingBadgeVariant(invoice.aging_category)}
                      >
                        {invoice.aging_category}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground"
                  >
                    {t("noOutstanding")}
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
