"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { updateInvoice } from "../../actions" // ใช้ action สำหรับ update
import { Plus, Trash2, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
//import { createClient } from "@/lib/supabase/client"

// Type Definitions
type Customer = { id: number; name: string }
type Product = { id: number; name: string; price: number }
type ResponsiblePerson = { id: number; name: string }
type InvoiceItem = { description: string; quantity: number; unitPrice: number }
type Invoice = {
  id: number
  customer_id: number
  responsible_person_id: number | null // เพิ่ม field นี้
  invoice_number: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
}

interface Props {
  customers: Customer[]
  products: Product[]
  responsiblePersons: ResponsiblePerson[] // รับ props ใหม่
  invoice: Invoice
}

export default function InvoiceForm({
  customers,
  invoice,
  responsiblePersons,
}: Props) {
  const t = useTranslations("InvoiceForm")
  const router = useRouter()
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice.items || [{ description: "", quantity: 1, unitPrice: 0 }]
  )
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    String(invoice.customer_id)
  )
  const [selectedResponsiblePersonId, setSelectedResponsiblePersonId] =
    useState<string>(String(invoice.responsible_person_id || ""))

  // State ใหม่สำหรับผู้รับผิดชอบ
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false)
  const [openResponsiblePersonCombobox, setOpenResponsiblePersonCombobox] =
    useState(false)
  const [isPending, startTransition] = React.useTransition()

  // ผูก ID ของ Invoice เข้ากับ Server Action
  const updateInvoiceWithId = updateInvoice.bind(null, invoice.id)

  // ... (ฟังก์ชัน handleItemChange, addItem, removeItem, handleProductSelect เหมือนเดิม) ...
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items]
    const numValue = Number(value)
    newItems[index] = {
      ...newItems[index],
      [field]: field === "description" ? value : isNaN(numValue) ? 0 : numValue,
    }
    setItems(newItems)
  }
  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index))

  const grandTotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const subTotal = grandTotal / 1.07
  const vat = grandTotal - subTotal

  return (
    <form
      action={(formData) =>
        startTransition(() => updateInvoiceWithId(formData))
      }
    >
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="customerId" value={selectedCustomerId} />
      <input
        type="hidden"
        name="responsiblePersonId"
        value={selectedResponsiblePersonId}
      />{" "}
      {/* เพิ่ม input ที่ซ่อนไว้ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("invoiceDataTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* ... ฟอร์มเหมือนหน้า New แต่มี defaultValue ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("customerLabel")}</Label>
              <Popover
                open={openCustomerCombobox}
                onOpenChange={setOpenCustomerCombobox}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedCustomerId
                      ? customers.find(
                          (c) => String(c.id) === selectedCustomerId
                        )?.name
                      : t("customerPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="ค้นหาลูกค้า..." />
                    <CommandList>
                      <CommandEmpty>{t("searchCustomerNotfound")}</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setSelectedCustomerId(String(c.id))
                              setOpenCustomerCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomerId === String(c.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {/* --- เพิ่มเมนูเลือกผู้รับผิดชอบที่นี่ --- */}
            <div className="space-y-2">
              <Label>{t("responsiblePersonLabel")}</Label>
              <Popover
                open={openResponsiblePersonCombobox}
                onOpenChange={setOpenResponsiblePersonCombobox}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedResponsiblePersonId
                      ? responsiblePersons.find(
                          (p) => String(p.id) === selectedResponsiblePersonId
                        )?.name
                      : t("responsiblePersonPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder={"searchResponsiblePersonPlaceholder"}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t("searchResponsiblePersonNotfound")}
                      </CommandEmpty>
                      <CommandGroup>
                        {responsiblePersons.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setSelectedResponsiblePersonId(String(p.id))
                              setOpenResponsiblePersonCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedResponsiblePersonId === String(p.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {p.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">
                {t("editFormInvoiceNumber")}
              </Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                required
                defaultValue={invoice.invoice_number}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">{t("issueDateLabel")}</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                required
                defaultValue={invoice.issue_date}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">{t("dueDateLabel")}</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                defaultValue={invoice.due_date}
              />
            </div>
          </div>
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t("itemsTitle")}</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row items-center gap-2"
                >
                  <Input
                    type="text"
                    placeholder={t("addItem")}
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(index, "description", e.target.value)
                    }
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    placeholder={t("quantityPlaceholder")}
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full md:w-24"
                  />
                  <Input
                    type="number"
                    placeholder={t("unitPricePlaceholder")}
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", e.target.value)
                    }
                    className="w-full md:w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-2"
            >
              <Plus size={16} className="mr-2" />
              {t("addItem")}
            </Button>
          </div>
          <div className="flex justify-end mt-4">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span>{t("totalBeforeVat")}</span>
                <span>
                  ฿
                  {subTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("totalVat")}</span>
                <span>
                  ฿{vat.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>{t("totalAmount")}</span>
                <span>
                  ฿
                  {grandTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {t("cancelButton")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("saveEditInvoice")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
