"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Printer, Loader2, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"

interface Props {
  invoiceNumber: string
}

export default function InvoicePrintDropdown({ invoiceNumber }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const t = useTranslations("PrintButton")
  // ฟังก์ชันสำหรับ "อ่าน" ข้อมูลจากหน้าเว็บแล้วสร้างเป็น HTML สำหรับพิมพ์
  const generateInvoiceHTML = (
    element: HTMLElement,
    type: "Original" | "Copy"
  ) => {
    // ดึงข้อมูลจากองค์ประกอบต่างๆ โดยใช้ className ที่เรากำหนดไว้
    const logoSrc = element.querySelector("img")?.src || ""
    const companyName = element.querySelector("h2")?.textContent || ""
    const companyAddress = element.querySelector("h2 + p")?.textContent || ""
    const invoiceTitle =
      element.querySelector(".invoice-title-text")?.textContent || "INVOICE"
    const invoiceNumberText =
      element.querySelector(".invoice-title-text + p")?.textContent ||
      `#${invoiceNumber}`

    const customerName =
      element.querySelector(".customer-name")?.textContent || ""
    const customerAddress =
      element.querySelector(".customer-address")?.textContent || ""
    const customerTaxId =
      element.querySelector(".customer-tax-id")?.textContent ||
      "เลขประจำตัวผู้เสียภาษี: -"
    const customerResponsiblePerson =
      element.querySelector(".customer-responsible-person")?.textContent ||
      "ผู้รับผิดชอบ: -"

    const issueDateText =
      element.querySelector(".invoice-issue-date span")?.textContent || ""
    const dueDateText =
      element.querySelector(".invoice-due-date span")?.textContent || ""
    const statusBadgeHTML =
      element.querySelector(".invoice-status span:last-child")?.outerHTML || ""

    const tableRows = Array.from(element.querySelectorAll("tbody tr"))
      .map((row) => {
        const cells = row.querySelectorAll("td")
        if (cells.length < 4) return ""
        return `<tr><td>${cells[0].textContent}</td><td class="text-center">${cells[1].textContent}</td><td class="text-right">${cells[2].textContent}</td><td class="text-right">${cells[3].textContent}</td></tr>`
      })
      .join("")

    const totalsSection = element.querySelectorAll(
      "section:last-of-type .w-full.max-w-sm.space-y-2 > div"
    )
    let subtotal = ""
    let vat = ""
    let grandTotal = ""
    totalsSection.forEach((line) => {
      const label = line.querySelector("span:first-child")?.textContent || ""
      const value = line.querySelector("span:last-child")?.textContent || ""
      if (label.includes("ยอดรวมก่อนภาษี")) subtotal = value
      else if (label.includes("ภาษีมูลค่าเพิ่ม")) vat = value
      else if (label.includes("ยอดรวมทั้งสิ้น")) grandTotal = value
    })

    const typeText =
      type === "Original" ? "ต้นฉบับ (สำหรับลูกค้า)" : "สำเนา (สำหรับกิจการ)"

    // สร้างโครงสร้าง HTML สำหรับหน้าพิมพ์ทั้งหมด
    return `
            <header class="header">
                <div class="company-info">
                    ${
                      logoSrc
                        ? `<img src="${logoSrc}" alt="Logo" style="width: 100px; margin-bottom: 1rem;" />`
                        : ""
                    }
                    <h2>${companyName}</h2>
                    <p>${companyAddress}</p>
                </div>
                <div class="invoice-title">
                    <h1>${invoiceTitle}</h1>
                    <p>${invoiceNumberText}</p>
                    <p class="print-type">${typeText}</p>
                </div>
            </header>

            <section class="details-section">
                <div class="customer-info">
                    <div class="detail-grid">
                        <span class="label">ลูกค้า:</span><span class="value name">${customerName}</span>
                        <span class="label">ที่อยู่:</span><span class="value">${customerAddress}</span>
                        <span class="label">${
                          customerTaxId.split(":")[0]
                        }:</span><span class="value">${
      customerTaxId.split(":")[1]?.trim() || "-"
    }</span>
                    </div>
                </div>
                <div class="invoice-meta">
                     <div class="detail-grid">
                        <span class="label">วันที่ออก:</span><span class="value">${issueDateText
                          .replace("วันที่ออก:", "")
                          .trim()}</span>
                        <span class="label">ครบกำหนดชำระ:</span><span class="value">${dueDateText
                          .replace("ครบกำหนดชำระ:", "")
                          .trim()}</span>
                        <span class="label">สถานะ:</span><span class="value">${statusBadgeHTML}</span>
                         <span class="label">${
                           customerResponsiblePerson.split(":")[0]
                         }:</span><span class="value">${
      customerResponsiblePerson.split(":")[1]?.trim() || "-"
    }</span>
                    </div>
                </div>
            </section>

            <table class="items-table">
                <thead><tr><th>รายการ</th><th class="text-center">จำนวน</th><th class="text-right">ราคา/หน่วย (รวม VAT)</th><th class="text-right">รวม</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>

            <section class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr><td>ยอดรวมก่อนภาษี</td><td class="text-right">${subtotal}</td></tr>
                        <tr><td>ภาษีมูลค่าเพิ่ม (7%)</td><td class="text-right">${vat}</td></tr>
                        <tr class="grand-total"><td>ยอดรวมทั้งสิ้น</td><td class="text-right">${grandTotal}</td></tr>
                    </tbody>
                </table>
            </section>
        `
  }

  const handlePrint = (type: "Original" | "Copy") => {
    setIsGenerating(true)

    const invoiceElement = document.getElementById("printable-area")
    if (!invoiceElement) {
      alert("ไม่พบส่วนของใบแจ้งหนี้ที่สามารถพิมพ์ได้")
      setIsGenerating(false)
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เปิด popup window")
      setIsGenerating(false)
      return
    }

    const printContent = `
            <!DOCTYPE html>
            <html lang="th">
            <head>
                <title>Invoice ${invoiceNumber}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Sarabun', sans-serif; background: #fff; color: #111; font-size: 11pt; line-height: 1.6; }
                    .print-container { max-width: 19cm; margin: auto; }
                    header, .details-section, .items-table, .totals-section { width: 100%; margin-bottom: 1.5rem; }
                    header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ccc; padding-bottom: 1rem; }
                    .company-info h2 { font-size: 16pt; font-weight: 700; margin: 0; }
                    .company-info p { font-size: 10pt; color: #555; margin: 0; }
                    .invoice-title { text-align: right; }
                    .invoice-title h1 { font-size: 28pt; font-weight: 700; margin: 0; }
                    .invoice-title p { font-size: 11pt; color: #555; }
                    .invoice-title .print-type { font-size: 12pt; font-weight: 700; margin-top: 0.5rem; }
                    .details-section { display: flex; justify-content: space-between; align-items: flex-start; }
                    .detail-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.2rem 1rem; align-items: baseline; }
                    .detail-grid .label { font-weight: 700; color: #444; }
                    .detail-grid .value { word-break: break-word; }
                    .detail-grid .value.name { font-weight: 700; font-size: 12pt; }
                    .items-table { width: 100%; border-collapse: collapse; }
                    .items-table th, .items-table td { padding: 0.6rem; border-bottom: 1px solid #eee; }
                    .items-table th { background-color: #f9f9f9; text-align: left; font-weight: 700; font-size: 10pt; }
                    .footer-section, .totals-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem; }
                    .totals-table { width: 280px; }
                    .totals-table td { padding: 0.4rem 0; }
                    .grand-total td { font-weight: 700; font-size: 13pt; border-top: 2px solid #333; padding-top: 0.5rem; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10pt; font-weight: 600; border: 1px solid transparent; }
                    span[data-variant="success"], .badge[style*="background-color: #dcfce7"] { background-color: #dcfce7 !important; color: #166534 !important; }
                    span[data-variant="default"], .badge[style*="background-color: #dbeafe"] { background-color: #dbeafe !important; color: #1e40af !important; }
                    span[data-variant="destructive"], .badge[style*="background-color: #fee2e2"] { background-color: #991b1b !important; }
                    span[data-variant="secondary"], .badge[style*="background-color: #f1f5f9"] { background-color: #f1f5f9 !important; color: #1f2937 !important; }
                    @media print {
                        body { margin: 0; }
                        .print-container { margin: 0; max-width: 100%; }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    ${generateInvoiceHTML(invoiceElement, type)}
                </div>
                <script>
                    setTimeout(function() { window.print(); window.close(); }, 500);
                </script>
            </body>
            </html>
        `

    printWindow.document.write(printContent)
    printWindow.document.close()
    setIsGenerating(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <Printer size={16} className="mr-2" />
          )}
          {t("printText")}
          <ChevronDown size={16} className="ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlePrint("Original")}>
          {t("originalText")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint("Copy")}>
          {t("copyText")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
