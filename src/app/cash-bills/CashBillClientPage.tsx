"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Bill = {
  id: number
  bill_number: string
  issue_date: string
  total_amount: number
  customers: { name: string } | null
}

interface Props {
  initialBills: Bill[]
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

export default function CashBillClientPage({ initialBills }: Props) {
  const router = useRouter()
  const t = useTranslations("CashBillsPage")

  const handleRowClick = (billId: number) => {
    router.push(`/cash-bills/${billId}`)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/cash-bills/new">
            <Plus size={20} className="mr-2" />
            {t("addNew")}
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableHeaderNumber")}</TableHead>
                <TableHead>{t("tableHeaderCustomer")}</TableHead>
                <TableHead>{t("tableHeaderIssueDate")}</TableHead>
                <TableHead className="text-right">
                  {t("tableHeaderTotal")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(initialBills || []).map((bill) => (
                <TableRow
                  key={bill.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(bill.id)}
                >
                  <TableCell className="font-medium">
                    {bill.bill_number}
                  </TableCell>
                  <TableCell>{bill.customers?.name || "-"}</TableCell>
                  <TableCell>{formatDate(bill.issue_date)}</TableCell>
                  <TableCell className="text-right">
                    ฿
                    {Number(bill.total_amount).toLocaleString("en-US", {
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
