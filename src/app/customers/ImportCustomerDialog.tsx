"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
// Removed importCustomers import - now using API route
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
import { Upload, Loader2 } from "lucide-react"

export default function ImportCustomerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const t = useTranslations("CustomersPage.importDialog")
  const tCommon = useTranslations("Common")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0])
    }
  }

  const handleImport = () => {
    if (!file) {
      alert(t("noFileSelected"))
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/customers/import', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.success) {
          alert(`${t("importSuccess")}: ${result.count} ${t("records")}`)
          setIsOpen(false)
          setFile(null)
          // Refresh the page to show new customers
          window.location.reload()
        } else {
          alert(`${tCommon("error")}: ${result.error}`)
        }
      } catch (error) {
        alert(`${tCommon("error")}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          {t("buttonTitle")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">{t("instructions")}</p>
          <div className="space-y-2">
            <Label htmlFor="customer-file">{t("selectFile")}</Label>
            <Input
              id="customer-file"
              type="file"
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!file || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("importButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
