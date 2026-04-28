"use client"

import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CartItem, Customer, Warehouse } from "./POSTerminal"

interface CartPanelProps {
  cart: CartItem[]
  customers: Customer[]
  warehouses: Warehouse[]
  selectedCustomer: number | null
  selectedWarehouse: number | null
  total: number
  onUpdateItem: (id: string, field: keyof CartItem, value: unknown) => void
  onRemoveItem: (id: string) => void
  onSelectCustomer: (id: number | null) => void
  onSelectWarehouse: (id: number | null) => void
  onCheckout: () => void
}

export default function CartPanel({
  cart,
  customers,
  warehouses,
  selectedCustomer,
  selectedWarehouse,
  total,
  onUpdateItem,
  onRemoveItem,
  onSelectCustomer,
  onSelectWarehouse,
  onCheckout,
}: CartPanelProps) {
  const t = useTranslations("POS")

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 space-y-2 shrink-0">
        <Select
          value={selectedCustomer ? String(selectedCustomer) : ""}
          onValueChange={(v) => onSelectCustomer(v ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectCustomer")} />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedWarehouse ? String(selectedWarehouse) : ""}
          onValueChange={(v) => onSelectWarehouse(v ? Number(v) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectWarehouse")} />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">
            {t("emptyCart")}
          </p>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {item.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  ฿{item.unitPrice.toLocaleString()}
                </p>
              </div>
              <Input
                type="number"
                min={1}
                className="w-16 h-8 text-center"
                value={item.quantity}
                onChange={(e) =>
                  onUpdateItem(item.id, "quantity", Number(e.target.value))
                }
              />
              <span className="w-20 text-right text-sm font-medium">
                ฿{(item.quantity * item.unitPrice).toLocaleString()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onRemoveItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="border-t p-4 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>{t("total")}</span>
          <span>
            ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={cart.length === 0 || !selectedWarehouse}
          onClick={onCheckout}
        >
          {t("checkout")}
        </Button>
        {!selectedWarehouse && (
          <p className="text-xs text-destructive text-center">
            {t("warehouseRequired")}
          </p>
        )}
      </div>
    </div>
  )
}
