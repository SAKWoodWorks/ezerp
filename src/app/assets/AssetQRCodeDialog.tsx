"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react" // อัปเดตการ import ที่นี่
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { QrCode, Printer } from "lucide-react"

// Define the type for the asset prop
type Asset = {
  id: number
  asset_tag: string
  type: string
  model: string | null
}

interface Props {
  asset: Asset
}

export default function AssetQRCodeDialog({ asset }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  // Construct the full URL to the asset detail page
  // This uses an environment variable for the base URL to work across different environments
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const assetUrl = `${appUrl}/assets/${asset.id}`

  const handlePrint = () => {
    const qrCodeElement = document.getElementById(
      `qr-code-to-print-${asset.id}`
    )
    if (qrCodeElement) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Print QR Code</title>")
        printWindow.document.write(`
          <style>
            @media print {
              @page {
                size: 40mm 30mm; /* Common sticker size */
                margin: 0;
              }
              body {
                margin: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                font-family: sans-serif;
              }
              .sticker {
                text-align: center;
                page-break-after: always;
              }
              .qr-code {
                width: 75px !important;
                height: 75px !important;
              }
              .asset-tag {
                font-weight: bold;
                font-size: 10pt;
                margin-top: 2mm;
              }
            }
          </style>
        `)
        printWindow.document.write("</head><body>")
        printWindow.document.write(qrCodeElement.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code สำหรับ Asset: {asset.asset_tag}</DialogTitle>
          <DialogDescription>
            สแกนโค้ดนี้เพื่อดูรายละเอียดของอุปกรณ์
          </DialogDescription>
        </DialogHeader>
        <div
          id={`qr-code-to-print-${asset.id}`}
          className="sticker flex flex-col items-center justify-center p-4"
        >
          {/* อัปเดตชื่อ Component ที่นี่ */}
          <QRCodeSVG
            value={assetUrl}
            size={200}
            level={"H"}
            includeMargin={true}
            className="qr-code"
          />
          <p className="asset-tag mt-4 text-lg font-semibold">
            {asset.asset_tag}
          </p>
          <p className="text-sm text-muted-foreground">
            {asset.type} - {asset.model}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์สติ๊กเกอร์
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
