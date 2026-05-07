"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProductBarcode } from "@/app/scanner/actions"
import { QrCode, Barcode, Save, Edit, Download, Printer } from "lucide-react"
import { useTranslations } from "next-intl"

interface BarcodeQRSectionProps {
  productId: number
  productName: string
  barcode: string | null
}

export function BarcodeQRSection({
  productId,
  productName,
  barcode: initialBarcode,
}: BarcodeQRSectionProps) {
  const t = useTranslations("ProductsPage")
  const [barcode, setBarcode] = useState(initialBarcode || "")
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await updateProductBarcode(productId, barcode)
    setSaving(false)

    if (result.success) {
      setIsEditing(false)
      window.location.reload() // Refresh to show updated data
    } else {
      alert(result.error)
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-code-${productId}`)
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL("image/png")

      const downloadLink = document.createElement("a")
      downloadLink.download = `${productName}-QR.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handlePrintQR = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const qrContent = document.getElementById(`qr-code-${productId}`)?.outerHTML

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${productName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            h2 { margin: 20px 0; }
            .barcode { font-size: 18px; font-weight: bold; margin: 10px 0; }
            @media print {
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h2>${productName}</h2>
          ${qrContent}
          <div class="barcode">Barcode: ${barcode || "N/A"}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Barcode / QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barcode Input Section */}
        <div className="space-y-2">
          <Label htmlFor="barcode" className="flex items-center gap-2">
            <Barcode className="h-4 w-4" />
            Barcode
          </Label>
          <div className="flex gap-2">
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter barcode number"
              disabled={!isEditing}
              className="font-mono"
            />
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="icon"
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                size="icon"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!barcode && (
            <p className="text-sm text-muted-foreground">
              Add a barcode to enable scanning and generate QR code
            </p>
          )}
        </div>

        {/* QR Code Display */}
        {barcode && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  id={`qr-code-${productId}`}
                  value={barcode}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR
                </Button>
                <Button
                  onClick={handlePrintQR}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print QR
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Barcode Number</p>
                <p className="font-mono text-lg font-semibold">{barcode}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
