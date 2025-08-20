"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { addCashBill } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Loader2, Plus, Trash2, ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Type definitions
type Customer = { id: number; name: string }
type ResponsiblePerson = { id: number; name: string }
type Product = {
  id: number
  name: string
  price: number
  description: string | null
  width: number | null
  length: number | null
  thickness: number | null
}
type Warehouse = { id: number; name: string }
type BillItem = {
  description: string
  quantity: number
  unitPrice: number
}

interface Props {
  customers: Customer[]
  responsiblePersons: ResponsiblePerson[]
  products: Product[]
  warehouses: Warehouse[]
}

export default function CashBillForm({
  customers,
  responsiblePersons,
  products,
  warehouses,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("CashBillForm")
  const tCommon = useTranslations("Common")

  // Form state
  const [customerId, setCustomerId] = useState<string>("")
  const [responsiblePersonId, setResponsiblePersonId] = useState<string>("")
  const [warehouseId, setWarehouseId] = useState<string>("")
  const [items, setItems] = useState<BillItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ])
  const [total, setTotal] = useState(0)

  // UI State for Popovers
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false)
  const [responsiblePersonPopoverOpen, setResponsiblePersonPopoverOpen] =
    useState(false)
  const [warehousePopoverOpen, setWarehousePopoverOpen] = useState(false)
  const [openComboboxIndex, setOpenComboboxIndex] = useState<number | null>(
    null
  )

  const calculateTotal = (currentItems: BillItem[]) => {
    const newTotal = currentItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    setTotal(newTotal)
  }

  const handleItemChange = (
    index: number,
    field: keyof BillItem,
    value: string | number
  ) => {
    const newItems = [...items]
    const itemToUpdate = { ...newItems[index] }
    // Check the field name to assign the correct type
    if (field === "quantity" || field === "unitPrice") {
      itemToUpdate[field] = Number(value) || 0 // Ensure value is a number
    } else {
      // field === 'description'
      itemToUpdate[field] = String(value) // Ensure value is a string
    }

    newItems[index] = itemToUpdate
    setItems(newItems)
    calculateTotal(newItems)
  }

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find((p) => p.id === Number(productId))
    if (selectedProduct) {
      const newItems = [...items]
      newItems[index].description = selectedProduct.name
      newItems[index].unitPrice = selectedProduct.price
      setItems(newItems)
      calculateTotal(newItems)
    }
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    calculateTotal(newItems)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    formData.append("items", JSON.stringify(items))

    if (customerId) formData.append("customerId", customerId)
    if (responsiblePersonId)
      formData.append("responsiblePersonId", responsiblePersonId)
    if (warehouseId) formData.append("warehouseId", warehouseId)

    startTransition(async () => {
      const result = await addCashBill(formData)
      if (result?.error) {
        alert(`${tCommon("error")}: ${result.error}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>{t("customerLabel")}</Label>
              <Popover
                open={customerPopoverOpen}
                onOpenChange={setCustomerPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {customerId
                      ? customers.find((c) => String(c.id) === customerId)?.name
                      : t("customerPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder={t("customerPlaceholder")} />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setCustomerId(String(c.id))
                              setCustomerPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                customerId === String(c.id)
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

            <div className="space-y-2">
              <Label>{t("responsiblePersonLabel")}</Label>
              <Popover
                open={responsiblePersonPopoverOpen}
                onOpenChange={setResponsiblePersonPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {responsiblePersonId
                      ? responsiblePersons.find(
                          (p) => String(p.id) === responsiblePersonId
                        )?.name
                      : t("responsiblePersonPlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder={t("responsiblePersonPlaceholder")}
                    />
                    <CommandList>
                      <CommandEmpty>No person found.</CommandEmpty>
                      <CommandGroup>
                        {responsiblePersons.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.name}
                            onSelect={() => {
                              setResponsiblePersonId(String(p.id))
                              setResponsiblePersonPopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                responsiblePersonId === String(p.id)
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
              <Label>{t("warehouseLabel")}</Label>
              <Popover
                open={warehousePopoverOpen}
                onOpenChange={setWarehousePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {warehouseId
                      ? warehouses.find((w) => String(w.id) === warehouseId)
                          ?.name
                      : t("warehousePlaceholder")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder={t("warehousePlaceholder")} />
                    <CommandList>
                      <CommandEmpty>No warehouse found.</CommandEmpty>
                      <CommandGroup>
                        {warehouses.map((w) => (
                          <CommandItem
                            key={w.id}
                            value={w.name}
                            onSelect={() => {
                              setWarehouseId(String(w.id))
                              setWarehousePopoverOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                warehouseId === String(w.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {w.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">{t("issueDateLabel")}</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("itemsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-2/5">
                      {tCommon("description")}
                    </TableHead>
                    <TableHead>{tCommon("quantity")}</TableHead>
                    <TableHead>{tCommon("price")}</TableHead>
                    <TableHead className="text-right">
                      {tCommon("total")}
                    </TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Popover
                          open={openComboboxIndex === index}
                          onOpenChange={(isOpen) =>
                            setOpenComboboxIndex(isOpen ? index : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openComboboxIndex === index}
                              className="w-full justify-between"
                            >
                              {item.description || "เลือกสินค้า..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="ค้นหาสินค้า..." />
                              <CommandList>
                                <CommandEmpty>ไม่พบสินค้า</CommandEmpty>
                                <CommandGroup>
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => {
                                        handleProductSelect(
                                          index,
                                          String(product.id)
                                        )
                                        setOpenComboboxIndex(null)
                                      }}
                                    >
                                      {product.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Textarea
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="mt-1"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "unitPrice",
                              Number(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "en-US",
                          { minimumFractionDigits: 2 }
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={addItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addItem")}
              </Button>
            </CardContent>
          </Card>

          <div className="text-right text-2xl font-bold">
            {t("totalAmount")}: ฿
            {total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveCashBill")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
