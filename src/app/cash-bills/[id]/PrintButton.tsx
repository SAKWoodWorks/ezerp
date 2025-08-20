"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface Bill {
  bill_number: string
}
interface Props {
  bill: Bill // Pass the bill data to the component
}

export default function PrintButton({ bill }: Props) {
  const t = useTranslations("CashBillDetailPage")

  const handlePrint = () => {
    const printContent = document.getElementById("bill-to-print")?.innerHTML
    if (printContent) {
      const printWindow = window.open("", "", "height=600,width=800")
      printWindow?.document.write("<html><head><title>Print Bill</title>")
      // Optional: Add some basic styling for the printout
      printWindow?.document.write(`
        <style>
          body { font-family: sans-serif; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        </style>
      `)
      printWindow?.document.write("</head><body>")
      printWindow?.document.write(printContent)
      printWindow?.document.write("</body></html>")
      printWindow?.document.close()
      printWindow?.focus()
      printWindow?.print()
    }
  }

  return (
    <Button onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      {t("print")} - {bill.bill_number}
    </Button>
  )
}
