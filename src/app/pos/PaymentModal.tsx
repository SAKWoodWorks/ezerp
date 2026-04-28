"use client"

import { useState, useRef, useTransition } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPOSSale, uploadPaymentSlip } from "./actions"
import type { CartItem } from "./POSTerminal"

type PaymentMethod = "cash" | "transfer" | "qrcode"

interface PaymentModalProps {
  cart: CartItem[]
  total: number
  customerId: number | null
  warehouseId: number | null
  onClose: () => void
}

export default function PaymentModal({
  cart,
  total,
  customerId,
  warehouseId,
  onClose,
}: PaymentModalProps) {
  const t = useTranslations("POS")
  const [method, setMethod] = useState<PaymentMethod>("cash")
  const [cashReceived, setCashReceived] = useState("")
  const [slipUrl, setSlipUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const change = cashReceived ? Number(cashReceived) - total : 0

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadPaymentSlip(file)
    setUploading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSlipUrl(result.url)
    }
  }

  const handleSubmit = () => {
    if (method === "qrcode" && !slipUrl) {
      setError(t("slipRequired"))
      return
    }
    setError(null)

    const formData = new FormData()
    formData.set("customerId", customerId ? String(customerId) : "")
    formData.set("responsiblePersonId", "")
    formData.set("issueDate", new Date().toISOString().slice(0, 10))
    formData.set("warehouseId", warehouseId ? String(warehouseId) : "")
    formData.set("salesChannel", "POS")
    formData.set("paymentMethod", method)
    formData.set(
      "items",
      JSON.stringify(
        cart.map(
          ({ productId, description, quantity, unitPrice, ecommerce_size }) => ({
            productId,
            description,
            quantity,
            unitPrice,
            ecommerce_size,
          })
        )
      )
    )
    if (slipUrl) formData.set("slipUrl", slipUrl)

    startTransition(async () => {
      const result = await createPOSSale(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{t("payment")}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-6 rounded-xl bg-muted p-4 text-center">
          <p className="text-sm text-muted-foreground">{t("total")}</p>
          <p className="text-4xl font-bold mt-1">
            ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {(["cash", "transfer", "qrcode"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                method === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-accent"
              }`}
            >
              {t(`method_${m}`)}
            </button>
          ))}
        </div>

        {method === "cash" && (
          <div className="space-y-3 mb-6">
            <Label>{t("cashReceived")}</Label>
            <Input
              type="number"
              placeholder="0"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              className="text-lg text-right"
              autoFocus
            />
            {Number(cashReceived) > 0 && (
              <div
                className={`flex justify-between font-medium text-lg ${
                  change < 0 ? "text-destructive" : "text-green-600"
                }`}
              >
                <span>{t("change")}</span>
                <span>
                  ฿{change.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}

        {method === "qrcode" && (
          <div className="space-y-3 mb-6">
            <Label>{t("uploadSlip")}</Label>
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {slipUrl ? (
                <Image
                  src={slipUrl}
                  alt="slip"
                  width={200}
                  height={200}
                  className="rounded-lg object-contain max-h-48"
                />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {uploading ? t("uploading") : t("tapToUpload")}
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSlipUpload}
            />
          </div>
        )}

        {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
          size="lg"
          disabled={
            isPending ||
            uploading ||
            (method === "cash" && Number(cashReceived) < total)
          }
          onClick={handleSubmit}
        >
          {isPending ? t("processing") : t("confirmSale")}
        </Button>
      </div>
    </div>
  )
}
