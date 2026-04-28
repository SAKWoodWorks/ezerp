"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import ProductSearch from "./ProductSearch"
import CartPanel from "./CartPanel"
import PaymentModal from "./PaymentModal"

export type CartItem = {
  id: string
  productId: number | null
  description: string
  quantity: number
  unitPrice: number
  ecommerce_size: number | null
}

export type Product = {
  id: number
  name: string
  barcode: string | null
  price: number | null
}

export type Customer = { id: number; name: string }
export type Warehouse = { id: number; name: string }

interface POSTerminalProps {
  products: Product[]
  customers: Customer[]
  warehouses: Warehouse[]
  title: string
}

export default function POSTerminal({
  products,
  customers,
  warehouses,
  title,
}: POSTerminalProps) {
  const t = useTranslations("POS")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(
    () => {
      if (typeof window === "undefined") return null
      const saved = localStorage.getItem("pos_default_warehouse")
      return saved ? Number(saved) : null
    }
  )
  const [showPayment, setShowPayment] = useState(false)

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          description: product.name,
          quantity: 1,
          unitPrice: product.price ?? 0,
          ecommerce_size: null,
        },
      ]
    })
  }, [])

  const updateCartItem = useCallback(
    (id: string, field: keyof CartItem, value: unknown) => {
      setCart((prev) =>
        prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
      )
    },
    []
  )

  const removeCartItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <h1 className="text-xl font-bold">{title}</h1>
        <span className="text-sm text-muted-foreground">
          {t("itemCount", { count: cart.length })}
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
        <div className="md:w-1/2 md:border-r overflow-y-auto p-4">
          <ProductSearch products={products} onAddToCart={addToCart} />
        </div>

        <div className="md:w-1/2 flex flex-col overflow-hidden">
          <CartPanel
            cart={cart}
            customers={customers}
            warehouses={warehouses}
            selectedCustomer={selectedCustomer}
            selectedWarehouse={selectedWarehouse}
            total={total}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeCartItem}
            onSelectCustomer={setSelectedCustomer}
            onSelectWarehouse={(id) => {
              setSelectedWarehouse(id)
              if (id) localStorage.setItem("pos_default_warehouse", String(id))
            }}
            onCheckout={() => setShowPayment(true)}
          />
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          cart={cart}
          total={total}
          customerId={selectedCustomer}
          warehouseId={selectedWarehouse}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
