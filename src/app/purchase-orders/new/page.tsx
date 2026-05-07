"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { createClient } from "@/lib/supabase/client"
import { createPurchaseOrder } from "../actions"
import { Plus, Trash2, Loader2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

type Supplier = { id: number; name: string }
type Product = { id: number; name: string; price: number }
type POItem = {
  productId: number | null
  description: string
  quantity: number
  unitPrice: number
}

export default function NewPurchaseOrderPage() {
  const t = useTranslations("PurchaseOrderForm")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null)

  // Get supplier ID from URL parameter if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const supplierParam = urlParams.get("supplier")
    if (supplierParam) {
      setSelectedSupplier(Number(supplierParam))
    }
  }, [])
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<POItem[]>([
    { productId: null, description: "", quantity: 1, unitPrice: 0 },
  ])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [suppliersRes, productsRes] = await Promise.all([
        supabase.from("suppliers").select("id, name").order("name"),
        supabase.from("products").select("id, name, price").order("name"),
      ])

      if (suppliersRes.data) setSuppliers(suppliersRes.data)
      if (productsRes.data) setProducts(productsRes.data)
    }

    fetchData()
  }, [])

  const addItem = () => {
    setItems([
      ...items,
      { productId: null, description: "", quantity: 1, unitPrice: 0 },
    ])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-fill description and price when product is selected
    if (field === "productId" && value) {
      const product = products.find((p) => p.id === Number(value))
      if (product) {
        newItems[index].description = product.name
        newItems[index].unitPrice = product.price
      }
    }

    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent, status: string) => {
    e.preventDefault()

    if (!selectedSupplier || items.length === 0) {
      alert(t("fillAllFields"))
      return
    }

    const formData = new FormData()
    formData.append("supplierId", selectedSupplier.toString())
    formData.append("orderDate", orderDate)
    formData.append("expectedDeliveryDate", expectedDeliveryDate)
    formData.append("notes", notes)
    formData.append("status", status)
    formData.append("items", JSON.stringify(items))

    startTransition(async () => {
      await createPurchaseOrder(formData)
    })
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("createTitle")}</h1>
      </div>

      <form>
        <Card>
          <CardHeader>
            <CardTitle>{t("cardTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">{t("supplierLabel")}</Label>
                <select
                  id="supplier"
                  value={selectedSupplier || ""}
                  onChange={(e) => setSelectedSupplier(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">{t("selectSupplier")}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderDate">{t("orderDateLabel")}</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedDate">{t("expectedDateLabel")}</Label>
              <Input
                id="expectedDate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("notesLabel")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>{t("itemsTitle")}</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addItem")}
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{t("productLabel")}</Label>
                          <select
                            value={item.productId || ""}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "productId",
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">{t("selectProduct")}</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t("descriptionLabel")}</Label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(index, "description", e.target.value)
                            }
                            placeholder={t("descriptionPlaceholder")}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>{t("quantityLabel")}</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(index, "quantity", Number(e.target.value))
                            }
                            min="0.01"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t("unitPriceLabel")}</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(index, "unitPrice", Number(e.target.value))
                            }
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t("totalLabel")}</Label>
                          <div className="flex items-center h-10">
                            <span className="font-semibold">
                              ฿
                              {(item.quantity * item.unitPrice).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </span>
                            {items.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="ml-auto"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end border-t pt-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {t("grandTotal")}
                </div>
                <div className="text-2xl font-bold">
                  ฿
                  {calculateTotal().toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isPending}
            >
              {t("cancelButton")}
            </Button>
            <div className="space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("saveDraftButton")}
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, "sent")}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("createButton")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
