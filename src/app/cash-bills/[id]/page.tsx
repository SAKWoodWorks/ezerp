import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { ArrowLeft } from "lucide-react"
import PrintButton from "./PrintButton" // Component สำหรับปุ่มพิมพ์

// type Props = {
//   params: { id: string }
// }

// --- Define specific types for our data ---
type CustomerInfo = {
  name: string
  address: string | null
  phone: string | null
} | null

type ResponsiblePersonInfo = {
  name: string
} | null

type BillItem = {
  description: string
  quantity: number
  unitPrice: number
}

type CashBill = {
  id: number
  bill_number: string
  issue_date: string
  total_amount: number
  items: BillItem[]
  customers: CustomerInfo
  responsible_persons: ResponsiblePersonInfo
}
// -----------------------------------------

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

//export default async function CashBillDetailPage({ params }: Props) {
export default async function CashBillDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await props.params
  const { id } = params
  const t = await getTranslations("CashBillDetailPage")

  const { data, error } = await supabase
    .from("cash_bills")
    .select(
      `
      *,
      customers ( name, address, phone ),
      responsible_persons ( name )
    `
    )
    .eq("id", id)
    .single()

  if (error || !data) {
    notFound()
  }

  // Cast the fetched data to our specific CashBill type
  const bill = data as CashBill
  const items = bill.items

  //   const items = bill.items as {
  //     description: string
  //     quantity: number
  //     unitPrice: number
  //   }[]

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/cash-bills"
            className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backLink")}
          </Link>
          <h1 className="text-3xl font-bold">
            {t("title")} #{bill.bill_number}
          </h1>
        </div>
        <PrintButton bill={bill} />
      </div>

      <Card id="bill-to-print">
        <CardHeader>
          <CardTitle>{t("detailsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">{t("billTo")}</h3>
              <p>{bill.customers?.name || t("walkInCustomer")}</p>
              <p className="text-sm text-muted-foreground">
                {bill.customers?.address}
              </p>
              <p className="text-sm text-muted-foreground">
                {bill.customers?.phone}
              </p>
            </div>
            <div className="text-right">
              <p>
                <span className="font-semibold">{t("issueDate")}:</span>{" "}
                {formatDate(bill.issue_date)}
              </p>
              <p>
                <span className="font-semibold">{t("responsiblePerson")}:</span>{" "}
                {bill.responsible_persons?.name || "-"}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">{t("itemsTitle")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tableHeaderItem")}</TableHead>
                  <TableHead className="text-center">
                    {t("tableHeaderQuantity")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tableHeaderUnitPrice")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("tableHeaderAmount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.unitPrice).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {(item.quantity * item.unitPrice).toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2 }
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-right font-bold text-lg"
                  >
                    {t("total")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    ฿
                    {Number(bill.total_amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
