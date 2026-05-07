"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { updateSupplier } from "../actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"

type Supplier = {
  id: number
  name: string
  tax_id: string | null
  address: string | null
  phone: string | null
  email: string | null
  line_id: string | null
  contact_person: string | null
  notes: string | null
}

interface Props {
  supplier: Supplier
}

export default function EditForm({ supplier }: Props) {
  const t = useTranslations("EditSupplierForm")
  const [isEditing, setIsEditing] = useState(false)

  const updateSupplierWithId = updateSupplier.bind(null, supplier.id)

  if (!isEditing) {
    return (
      <div className="mt-6">
        <Button onClick={() => setIsEditing(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("buttonTitle")}
        </Button>
      </div>
    )
  }

  return (
    <form action={updateSupplierWithId}>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("dialogTitle")}</CardTitle>
          <CardDescription>{t("dialogDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">{t("supplierNameLabel")}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={supplier.name}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="taxId">{t("taxId")}</Label>
              <Input
                id="taxId"
                name="taxId"
                defaultValue={supplier.tax_id ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="address">{t("address")}</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={supplier.address ?? ""}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={supplier.phone ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={supplier.email ?? ""}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lineId">{t("lineId")}</Label>
              <Input
                id="lineId"
                name="lineId"
                defaultValue={supplier.line_id ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPerson">{t("contactPerson")}</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                defaultValue={supplier.contact_person ?? ""}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={supplier.notes ?? ""}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsEditing(false)}
          >
            {t("buttonCancel")}
          </Button>
          <Button type="submit">{t("buttonSave")}</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
