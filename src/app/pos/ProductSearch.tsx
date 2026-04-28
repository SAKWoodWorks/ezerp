"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner"
import type { Product } from "./POSTerminal"

interface ProductSearchProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export default function ProductSearch({
  products,
  onAddToCart,
}: ProductSearchProps) {
  const t = useTranslations("POS")
  const [query, setQuery] = useState("")
  const [showScanner, setShowScanner] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return products.slice(0, 50)
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    )
  }, [query, products])

  const handleBarcodeScan = (code: string) => {
    const product = products.find((p) => p.barcode === code)
    if (product) {
      onAddToCart(product)
      setShowScanner(false)
    } else {
      setQuery(code)
      setShowScanner(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <Button variant="outline" onClick={() => setShowScanner((v) => !v)}>
          {t("scan")}
        </Button>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScan}
          title={t("scanTitle")}
          description={t("scanDescription")}
        />
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            className="rounded-lg border p-3 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="truncate font-medium text-sm">{product.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              ฿{(product.price ?? 0).toLocaleString()}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-8">
            {t("noProducts")}
          </p>
        )}
      </div>
    </div>
  )
}
