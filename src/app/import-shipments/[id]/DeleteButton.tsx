/**
 * Delete Button Component for Import Shipments
 * ปุ่มลบสำหรับการนำเข้าสินค้า
 *
 * This component provides a delete button with confirmation
 * คอมโพเนนต์นี้แสดงปุ่มลบพร้อมการยืนยัน
 */

"use client"

import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteImportShipment } from "../actions"

/**
 * Props for DeleteButton component
 * คุณสมบัติสำหรับ DeleteButton
 */
type Props = {
  id: number
}

export function DeleteButton({ id }: Props) {
  // Get translations / ดึงคำแปล
  const t = useTranslations("ImportShipments")

  /**
   * Handle delete action with confirmation
   * จัดการการลบพร้อมการยืนยัน
   */
  async function handleDelete() {
    if (confirm(t("confirmDelete"))) {
      await deleteImportShipment(id)
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete}>
      <Trash2 className="mr-2 h-4 w-4" />
      {t("delete")}
    </Button>
  )
}
