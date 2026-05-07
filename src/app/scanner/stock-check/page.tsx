"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import BarcodeScanner from "@/components/barcode/BarcodeScanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { findProductByBarcode, type Product } from "../actions"
import { Package, AlertTriangle, CheckCircle, History } from "lucide-react"
import Link from "next/link"

interface ScannedProduct extends Product {
  scannedAt: string
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
}

export default function StockCheckPage() {
  const t = useTranslations("StockCheck")
  const [scannedProducts, setScannedProducts] = useState<ScannedProduct[]>([])
  const [currentProduct, setCurrentProduct] = useState<ScannedProduct | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getStockStatus = (quantity: number): "in_stock" | "low_stock" | "out_of_stock" => {
    if (quantity === 0) return "out_of_stock"
    if (quantity <= 10) return "low_stock"
    return "in_stock"
  }

  const handleScan = async (barcode: string) => {
    setError(null)
    setLoading(true)

    const result = await findProductByBarcode(barcode)

    if (result.success && result.product) {
      const product = result.product
      const scannedProduct: ScannedProduct = {
        ...product,
        scannedAt: new Date().toISOString(),
        stockStatus: getStockStatus(product.stock_quantity),
      }

      setCurrentProduct(scannedProduct)

      // Add to history if not already scanned
      setScannedProducts((prev) => {
        const exists = prev.find((p) => p.id === product.id)
        if (exists) {
          return prev.map((p) =>
            p.id === product.id ? scannedProduct : p
          )
        }
        return [scannedProduct, ...prev]
      })
    } else {
      setError(`Product not found: ${barcode}`)
      setCurrentProduct(null)
    }

    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return <Badge variant="default" className="bg-green-500">In Stock</Badge>
      case "low_stock":
        return <Badge variant="secondary" className="bg-yellow-500">Low Stock</Badge>
      case "out_of_stock":
        return <Badge variant="destructive">Out of Stock</Badge>
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Section */}
        <div className="space-y-6">
          <BarcodeScanner
            onScanSuccess={handleScan}
            title={t("scannerTitle")}
            description={t("scannerDescription")}
          />

          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {t("loading")}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Product Details */}
          {currentProduct && !loading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t("productInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("productName")}</p>
                  <p className="text-xl font-bold">{currentProduct.name}</p>
                </div>

                {currentProduct.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("description")}</p>
                    <p>{currentProduct.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("price")}</p>
                    <p className="text-lg font-semibold">
                      ฿{currentProduct.price.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">{t("barcode")}</p>
                    <p className="font-mono">{currentProduct.barcode || "-"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("stockQuantity")}</p>
                      <p className="text-3xl font-bold">
                        {currentProduct.stock_quantity} {t("units")}
                      </p>
                    </div>
                    <div>
                      {getStatusBadge(currentProduct.stockStatus)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link href={`/products/${currentProduct.id}`}>
                      {t("viewProduct")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/stock-adjustments/new?product_id=${currentProduct.id}`}>
                      {t("adjustStock")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Scan History */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t("scanHistory")} ({scannedProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scannedProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>{t("noScans")}</p>
                  <p className="text-sm mt-2">{t("startScanning")}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("product")}</TableHead>
                        <TableHead className="text-right">{t("stock")}</TableHead>
                        <TableHead className="text-right">{t("status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scannedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.barcode}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="font-semibold">{product.stock_quantity}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            {getStatusBadge(product.stockStatus)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {scannedProducts.length > 0 && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setScannedProducts([])
                      setCurrentProduct(null)
                    }}
                  >
                    {t("clearHistory")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
