import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  //CardDescription,
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

type QuotationItem = {
  quantity: number
  unitPrice: number
}

interface Quotation {
  id: number
  quotation_number: string
  issue_date: string
  items: QuotationItem[]
  status: string
  customers: { name: string } | null
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Accepted":
      return "success"
    case "Sent":
      return "default"
    case "Rejected":
      return "destructive"
    case "Draft":
    default:
      return "secondary"
  }
}

// const getStatusBadge = (status: string) => {
//   switch (status) {
//     case "Accepted":
//       return <Badge variant="success">อนุมัติแล้ว</Badge>
//     case "Sent":
//       return <Badge variant="default">ส่งแล้ว</Badge>
//     case "Rejected":
//       return <Badge variant="destructive">ไม่อนุมัติ</Badge>
//     case "Draft":
//     default:
//       return <Badge variant="secondary">ฉบับร่าง</Badge>
//   }
// }

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
const calculateTotal = (items: QuotationItem[]): number =>
  items?.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  ) || 0

export default async function QuotationsPage() {
  const t = await getTranslations("QuotationsPage")
  const tStatus = await getTranslations("QuotationStatus")

  const supabase = await createClient()

  const { data: quotations, error } = await supabase
    .from("quotations")
    .select(
      `id, quotation_number, issue_date, items, status, customers!left(name)`
    )
    .order("issue_date", { ascending: false })

  if (error) {
    return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}</p>
  }
  //const typedInvoices = (invoices || []) as unknown as InvoiceWithCustomer[]
  const typedQuotations = (quotations || []) as unknown as Quotation[]

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/quotations/new">
            <Plus size={20} className="mr-2" /> {t("addNew")}
          </Link>
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
                <TableHead>{t("tableHeaderCustomer")}</TableHead>
                <TableHead>{t("tableHeaderIssueDate")}</TableHead>
                <TableHead className="text-right">{t("tableHeaderTotal")}</TableHead>
                <TableHead className="text-center">{t("tableHeaderStatus")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedQuotations.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/quotations/${quote.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {quote.quotation_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {quote.customers?.name || "ไม่ระบุลูกค้า"}
                  </TableCell>
                  <TableCell>{formatDate(quote.issue_date)}</TableCell>
                  <TableCell className="text-right">
                    ฿
                    {calculateTotal(quote.items).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(quote.status)}>
                      {tStatus(quote.status.toLowerCase() as string)}
                    </Badge>
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