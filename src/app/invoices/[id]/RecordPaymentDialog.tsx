"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { recordPayment } from "./payment-actions"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, DollarSign } from "lucide-react"

interface Props {
  invoiceId: number
  balanceDue: number
}

export default function RecordPaymentDialog({ invoiceId, balanceDue }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("RecordPaymentDialog")

  const [amount, setAmount] = useState(balanceDue.toString())
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!amount || Number(amount) <= 0) {
      alert(t("invalidAmount"))
      return
    }

    if (Number(amount) > balanceDue) {
      alert(t("exceedsBalance"))
      return
    }

    const formData = new FormData()
    formData.append("invoiceId", invoiceId.toString())
    formData.append("amount", amount)
    formData.append("paymentDate", paymentDate)
    formData.append("paymentMethod", paymentMethod)
    formData.append("referenceNumber", referenceNumber)
    formData.append("notes", notes)

    startTransition(async () => {
      const result = await recordPayment(formData)
      if (result?.success) {
        setIsOpen(false)
        // Reset form
        setAmount(balanceDue.toString())
        setPaymentDate(new Date().toISOString().split("T")[0])
        setPaymentMethod("cash")
        setReferenceNumber("")
        setNotes("")
      } else {
        alert(result?.error || t("error"))
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <DollarSign className="mr-2 h-4 w-4" />
          {t("recordPayment")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("dialogTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">{t("amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDue}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("balanceDue")}: ฿
                {balanceDue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentDate">{t("paymentDate")}</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">{t("paymentMethod")}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("methods.cash")}</SelectItem>
                  <SelectItem value="bank_transfer">
                    {t("methods.bankTransfer")}
                  </SelectItem>
                  <SelectItem value="check">{t("methods.check")}</SelectItem>
                  <SelectItem value="credit_card">
                    {t("methods.creditCard")}
                  </SelectItem>
                  <SelectItem value="other">{t("methods.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="referenceNumber">{t("referenceNumber")}</Label>
              <Input
                id="referenceNumber"
                placeholder={t("referenceNumberPlaceholder")}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                placeholder={t("notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
