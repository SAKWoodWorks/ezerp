import { createClient } from "@/lib/supabase/server"
import { getTranslations } from "next-intl/server"
import CashBillForm from "./CashBillForm"

export default async function NewCashBillPage() {
  const supabase = await createClient()
  const t = await getTranslations("CashBillForm")

  // Fetch all necessary data in parallel for performance
  const [customersData, responsiblePersonsData, productsData, warehousesData] =
    await Promise.all([
      supabase.from("customers").select("id, name"),
      supabase.from("responsible_persons").select("id, name"),
      // ดึงข้อมูลสินค้าทั้งหมด รวมถึงข้อมูลสำหรับ E-commerce
      supabase
        .from("products")
        .select(
          "id, name, price, description, width, length, thickness, is_ecommerce_product, ecommerce_sizes"
        ),
      supabase.from("warehouses").select("id, name"), // Fetch warehouses
    ])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{t("createTitle")}</h1>
      <CashBillForm
        customers={customersData.data || []}
        responsiblePersons={responsiblePersonsData.data || []}
        products={productsData.data || []}
        warehouses={warehousesData.data || []} // Pass warehouses to the form
      />
    </div>
  )
}
