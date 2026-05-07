"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addSupplier } from "./actions"
import { Plus, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

type Supplier = {
  id: number
  name: string
  phone: string | null
  email: string | null
  contact_person: string | null
}

interface Props {
  initialSuppliers: Supplier[]
}

export default function SupplierClientPage({ initialSuppliers }: Props) {
  const t = useTranslations("SuppliersPage")
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    setSuppliers(initialSuppliers)
  }, [initialSuppliers])

  const handleRowClick = (supplierId: number) => {
    router.push(`/suppliers/${supplierId}`)
  }

  const handleFormSubmit = (formData: FormData) => {
    startTransition(async () => {
      await addSupplier(formData)
      setIsDialogOpen(false)
    })
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={20} className="mr-2" /> {t("addNew")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t("dialogTitle")}</DialogTitle>
              <DialogDescription>{t("dialogDescription")}</DialogDescription>
            </DialogHeader>
            <form action={handleFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t("dialogName")}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="taxId" className="text-right">
                    {t("dialogTaxId")}
                  </Label>
                  <Input id="taxId" name="taxId" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    {t("dialogAddress")}
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    {t("dialogPhone")}
                  </Label>
                  <Input id="phone" name="phone" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    {t("dialogEmail")}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lineId" className="text-right">
                    {t("dialogLineId")}
                  </Label>
                  <Input id="lineId" name="lineId" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="contactPerson" className="text-right">
                    {t("dialogContactPerson")}
                  </Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    {t("dialogNotes")}
                  </Label>
                  <Textarea id="notes" name="notes" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("buttonTitle")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tableHeaderName")}</TableHead>
              <TableHead>{t("tableHeaderPhone")}</TableHead>
              <TableHead>{t("tableHeaderEmail")}</TableHead>
              <TableHead>{t("tableHeaderContactPerson")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(supplier.id)}
              >
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.contact_person}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
