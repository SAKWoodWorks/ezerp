"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner"
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
import { Input } from "@/components/ui/input"
import { findProductByBarcode, type Product } from "../actions"
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"

interface CartItem extends Product {
  quantity: number
}

export default function QuickSalePage() {
  const t = useTranslations("QuickSale")
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string>("")

  const handleScan = async (barcode: string) => {
    setError(null)
    setLoading(true)
    setLastScanned(barcode)

    const result = await findProductByBarcode(barcode)

    if (result.success && result.product) {
      addToCart(result.product)
    } else {
      setError(`Product not found: ${barcode}`)
    }

    setLoading(false)
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleCheckout = () => {
    // Navigate to cash bill creation with cart data
    const cartData = encodeURIComponent(JSON.stringify(cart))
    router.push(`/cash-bills/new?cart=${cartData}`)
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scanner Section */}
        <div>
          <BarcodeScanner
            onScanSuccess={handleScan}
            title={t("scannerTitle")}
            description={t("scannerDescription")}
          />

          {loading && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              {t("loading")}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          {lastScanned && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">{t("lastScanned")}</p>
              <p className="font-mono">{lastScanned}</p>
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {t("cart")} ({cart.length} {t("items")})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>{t("emptyCart")}</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("product")}</TableHead>
                        <TableHead className="text-center">{t("qty")}</TableHead>
                        <TableHead className="text-right">{t("price")}</TableHead>
                        <TableHead className="text-right">{t("total")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.id,
                                    parseInt(e.target.value) - item.quantity
                                  )
                                }
                                className="w-16 text-center"
                              />
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            ฿{item.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ฿{(item.price * item.quantity).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>{t("totalAmount")}</span>
                      <span>฿{calculateTotal().toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        size="lg"
                        onClick={handleCheckout}
                      >
                        {t("checkout")}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCart([])}
                      >
                        {t("clear")}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
