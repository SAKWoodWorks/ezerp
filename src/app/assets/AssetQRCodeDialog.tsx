"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { QrCode, Printer } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

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

  // แก้ไข: สร้าง URL ให้ชี้ไปที่หน้า /public/asset/[id]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const assetUrl = `${appUrl}/public/asset/${asset.id}`

  const handlePrint = () => {
    const qrCodeSvgElement = document.getElementById(
      `qr-code-for-print-${asset.id}`
    )
    if (!qrCodeSvgElement) return

    const svgClone = qrCodeSvgElement.cloneNode(true) as SVGElement
    svgClone.setAttribute("width", "150px")
    svgClone.setAttribute("height", "150px")

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code</title>
            <style>
              @media print {
                @page { size: 54mm 30mm; margin: 0; }
                body { margin: 0; padding: 4mm; font-family: sans-serif; display: flex; align-items: center; justify-content: center; }
              }
              body {
                margin: 0;
                display: flex;
                align-items: center;
                font-family: sans-serif;
                text-align: left;
                gap: 8px;
              }
              .details {
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              p { margin: 0; font-size: 10px; line-height: 1.4; }
              p.tag { font-size: 14px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div>${svgClone.outerHTML}</div>
            <div class="details">
              <p class="tag">${asset.asset_tag}</p>
              <p>${asset.type}</p>
              <p>${asset.model || ""}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <QrCode className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>QR Code for {asset.asset_tag}</DialogTitle>
          <DialogDescription>
            สแกนเพื่อดูรายละเอียดของอุปกรณ์ชิ้นนี้
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG
              id={`qr-code-for-print-${asset.id}`}
              value={assetUrl}
              size={200}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={false}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground break-all">
            {assetUrl}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            พิมพ์สติ๊กเกอร์
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
