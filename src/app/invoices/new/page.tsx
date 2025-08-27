"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { addInvoice, generateNextInvoiceNumber } from "../actions"
import { Plus, Trash2, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  //CardDescription,
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

// Type Definitions
type Customer = { id: number; name: string }
type Product = { id: number; name: string; price: number }
type ResponsiblePerson = { id: number; name: string; initial: string | null }
type InvoiceItem = { description: string; quantity: number; unitPrice: number }

const priceTiers = [
  { value: "R", label: "Retail price" },
  { value: "W", label: "Whole Price" },
  { value: "N", label: "Non-Stock Resellers Price" },
  { value: "S", label: "Special price" },
]

export default function NewInvoicePage() {
  const t = useTranslations("InvoiceForm")
  const router = useRouter()
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [responsiblePersons, setResponsiblePersons] = useState<
    ResponsiblePerson[]
  >([]) // State ใหม่
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ])
  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedResponsiblePersonId, setSelectedResponsiblePersonId] =
    useState("")
  const [selectedPriceTier, setSelectedPriceTier] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState(
    t("setInvoiceNumberStatus")
  )

  // State สำหรับควบคุมการเปิด-ปิด Combobox
  const [openCustomerCombobox, setOpenCustomerCombobox] = useState(false)
  const [openResponsiblePersonCombobox, setOpenResponsiblePersonCombobox] =
    useState(false)
  const [openPriceTierCombobox, setOpenPriceTierCombobox] = useState(false)
  const [openProductComboboxes, setOpenProductComboboxes] = useState<{
    [key: number]: boolean
  }>({})
  const [isPending, startTransition] = React.useTransition()

  useEffect(() => {
    const fetchData = async () => {
      // ดึงข้อมูลทั้ง 3 ส่วนพร้อมกัน
      const [customerRes, productRes, personRes] = await Promise.all([
        supabase.from("customers").select("id, name").order("name"),
        supabase.from("products").select("id, name, price").order("name"),
        supabase
          .from("responsible_persons")
          .select("id, name,initial")
          .order("name"),
      ])

      if (customerRes.data) setCustomers(customerRes.data)
      if (productRes.data) setProducts(productRes.data)
      if (personRes.data) setResponsiblePersons(personRes.data)
    }
    fetchData()
  }, [supabase])

  // --- Effect สำหรับสร้างเลขที่ใบแจ้งหนี้อัตโนมัติ ---
  useEffect(() => {
    const generateNumber = async () => {
      if (selectedResponsiblePersonId && selectedPriceTier) {
        const person = responsiblePersons.find(
          (p) => p.id === Number(selectedResponsiblePersonId)
        )
        if (!person || !person.initial) {
          setInvoiceNumber("ข้อมูลผู้รับผิดชอบไม่สมบูรณ์")
          return
        }

        try {
          const runningNumber = await generateNextInvoiceNumber()
          const year = new Date().getFullYear().toString().slice(-2)
          const date = new Date()
            .toLocaleDateString("th-GB")
            .split("/")
            .join("-")

          // ประกอบร่างเป็นเลขที่ใหม่
          const newNumber = `INVNo${year}${String(runningNumber).padStart(
            3,
            "0"
          )}${person.initial}${selectedPriceTier} ${date}`
          setInvoiceNumber(newNumber)
        } catch (error) {
          console.error(error)
          setInvoiceNumber("Error generating number")
        }
      } else {
        setInvoiceNumber(t("setInvoiceNumber"))
      }
    }
    generateNumber()
  }, [selectedResponsiblePersonId, selectedPriceTier, responsiblePersons, t])

  // ... โค้ด Logic เดิม ...
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

  const handleProductSelect = (index: number, product: Product) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      description: product.name,
      unitPrice: product.price,
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

  const handleFormSubmit = (formData: FormData) => {
    if (
      invoiceNumber.startsWith("กำลังสร้าง") ||
      invoiceNumber.startsWith("กรุณา") ||
      invoiceNumber.startsWith("Error")
    ) {
      alert("ไม่สามารถบันทึกได้: เลขที่ใบแจ้งหนี้ไม่ถูกต้อง")
      return
    }
    startTransition(() => {
      // ส่ง invoiceNumber จาก state ไปให้ action โดยตรง
      addInvoice(invoiceNumber, formData)
    })
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t("createTitle")}</h1>
      <form action={handleFormSubmit}>
        <input type="hidden" name="customerId" value={selectedCustomerId} />
        <input
          type="hidden"
          name="responsiblePersonId"
          value={selectedResponsiblePersonId}
        />
        <input type="hidden" name="priceTier" value={selectedPriceTier} />
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <Card>
          <CardHeader>
            <CardTitle>{t("newDialogTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Combobox ลูกค้า */}
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
                      <CommandInput
                        placeholder={t("searchCustomerPlaceholder")}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {t("searchCustomerNotfound")}
                        </CommandEmpty>
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
                        placeholder={t("searchResponsiblePersonPlaceholder")}
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
                <Label>{t("priceTierLabel")}</Label>
                <Popover
                  open={openPriceTierCombobox}
                  onOpenChange={setOpenPriceTierCombobox}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedPriceTier
                        ? priceTiers.find((p) => p.value === selectedPriceTier)
                            ?.label
                        : t("selectPriceTierPlaceholder")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandList>
                        <CommandEmpty>
                          {t("searchPriceTierNotfound")}
                        </CommandEmpty>
                        <CommandGroup>
                          {priceTiers.map((p) => (
                            <CommandItem
                              key={p.value}
                              value={p.label}
                              onSelect={() => {
                                setSelectedPriceTier(p.value)
                                setOpenPriceTierCombobox(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedPriceTier === p.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {p.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* ... Input fields อื่นๆ ... */}

              <div className="space-y-2">
                <Label htmlFor="issueDate">{t("issueDateLabel")}</Label>
                <Input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">{t("dueDateLabel")}</Label>
                <Input type="date" id="dueDate" name="dueDate" required />
              </div>
              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="invoiceNumberDisplay">
                  {t("invoiceNumberLabel")}
                </Label>
                <Input
                  id="invoiceNumberDisplay"
                  value={invoiceNumber}
                  readOnly
                  className="font-mono bg-gray-100"
                />
              </div>
            </div>
            {/* ... ส่วนรายการสินค้าและยอดรวม ... */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">{t("itemsTitle")}</h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-center gap-2"
                  >
                    <Popover
                      open={openProductComboboxes[index] || false}
                      onOpenChange={(open) =>
                        setOpenProductComboboxes((prev) => ({
                          ...prev,
                          [index]: open,
                        }))
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full md:w-1/3 justify-between"
                        >
                          {item.description || t("productPlaceholder")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput
                            placeholder={t("searchProductPlaceholder")}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {t("searchProductNotfound")}
                            </CommandEmpty>
                            <CommandGroup>
                              {products.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => handleProductSelect(index, p)}
                                >
                                  {p.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="text"
                      placeholder={t("insertProductItemsPlaceholder")}
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
              {t("saveInvoice")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
