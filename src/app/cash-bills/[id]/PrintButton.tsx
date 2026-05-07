"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

// --- อัปเดต Type Definitions ให้ตรงกับ page.tsx ---
type BillItem = {
  description: string
  quantity: number
  unitPrice: number
  ecommerce_size: number | null
}

interface Bill {
  bill_number: string
  items: BillItem[]
  sales_channel: string
}
interface Props {
  bill: Bill
}
// -----------------------------------------

export default function PrintButton({ bill }: Props) {
  const t = useTranslations("CashBillDetailPage")

  // ฟังก์ชันสำหรับสร้างตารางรายการสินค้าเป็น HTML
  const generateItemsTable = () => {
    // สร้าง Header ของตาราง
    const isEcommerce = bill.sales_channel === "e-commerce"
    //let header = `
    const header = `
      <thead>
        <tr>
          <th>รายการ</th>
          ${isEcommerce ? `<th class="text-center">ขนาด (cm)</th>` : ""}
          <th class="text-center">จำนวน</th>
          <th class="text-right">ราคา/หน่วย</th>
          <th class="text-right">รวม</th>
        </tr>
      </thead>
    `

    // สร้าง Body ของตาราง
    let body = "<tbody>"
    bill.items.forEach((item) => {
      body += `
        <tr>
          <td>${item.description}</td>
          ${
            isEcommerce
              ? `<td class="text-center">${item.ecommerce_size || "-"}</td>`
              : ""
          }
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${Number(item.unitPrice).toLocaleString(
            "en-US",
            { minimumFractionDigits: 2 }
          )}</td>
          <td class="text-right">${(
            item.quantity * item.unitPrice
          ).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
        </tr>
      `
    })
    body += "</tbody>"

    // สร้าง Footer ของตาราง
    //let footer = `
    const footer = `
      <tfoot>
        <tr>
          <td colspan="${
            isEcommerce ? "4" : "3"
          }" class="text-right total-label">ยอดรวมทั้งสิ้น</td>
          <td class="text-right total-amount">฿ ${
            // คำนวณยอดรวมใหม่เพื่อให้แน่ใจว่าถูกต้อง
            bill.items
              .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
              .toLocaleString("en-US", { minimumFractionDigits: 2 })
          }</td>
        </tr>
      </tfoot>
    `

    return `<table>${header}${body}${footer}</table>`
  }

  const handlePrint = () => {
    const printContentElement = document.getElementById("bill-to-print")
    if (!printContentElement) return

    // ดึงข้อมูลส่วนหัวจากหน้าเว็บ
    const headerContent =
      printContentElement.querySelector(".card-header")?.innerHTML || ""
    const customerInfo =
      printContentElement.querySelector(".grid.md\\:grid-cols-2")?.innerHTML ||
      ""

    const printWindow = window.open("", "", "height=800,width=800")
    printWindow?.document.write("<html><head><title>Print Bill</title>")
    printWindow?.document.write(`
        <style>
          body { font-family: Sarabun, sans-serif; font-size: 12pt; }
          .card-header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 1rem; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-semibold { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; text-align: left; }
          tfoot td { border-bottom: none; }
          .total-label { font-size: 1.1em; font-weight: bold; }
          .total-amount { font-size: 1.1em; font-weight: bold; }
        </style>
      `)
    printWindow?.document.write("</head><body>")
    printWindow?.document.write(
      `<div class="card-header">${headerContent}</div>`
    )
    printWindow?.document.write(`<div class="grid">${customerInfo}</div>`)
    // ใช้ฟังก์ชันใหม่ในการสร้างตาราง
    printWindow?.document.write(generateItemsTable())
    printWindow?.document.write("</body></html>")
    printWindow?.document.close()
    printWindow?.focus()
    printWindow?.print()
  }

  return (
    <Button onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      {t("print")} - {bill.bill_number}
    </Button>
  )
}
