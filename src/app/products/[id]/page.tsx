import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import EditForm from "./EditForm"
import DeleteButton from "./DeleteButton"
import StockMovementHistory from "./StockMovementHistory"
import AdjustStockDialog from "./AdjustStockDialog"
import ProductInventoryByWarehouse from "./ProductInventoryByWarehouse"
import TransferStockDialog from "./TransferStockDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

type Props = {
  params: Promise<{ id: string }>
}

type StockMovement = {
  id: number
  created_at: string
  type: string
  quantity_change: number
  notes: string | null
  invoice_id: number | null
  invoices: { invoice_number: string } | null
  warehouses: { name: string }[] | null
}

type ProductInventory = {
  quantity: number
  warehouses: {
    name: string
  } | null
}

export default async function ProductDetailPage(props: Props) {
  const params = await props.params
  const { id } = params
  const supabase = await createClient()
  const t = await getTranslations("ProductDetailPage")

  // --- การดึงข้อมูล ---
  // ใช้ Promise.all เพื่อดึงข้อมูลทั้งหมดที่จำเป็นพร้อมกันในครั้งเดียว
  const [productRes, warehousesRes, inventoriesRes] = await Promise.all([
    // 1. ดึงข้อมูลสินค้าชิ้นที่ต้องการ พร้อมกับประวัติการเคลื่อนไหวของสต็อก (stock_movements)
    supabase
      .from("products")
      .select(
        `*, stock_movements (id, created_at, type, quantity_change, notes, invoice_id, invoices ( invoice_number ), warehouses ( name ))`
      )
      .eq("id", id)
      .order("created_at", {
        referencedTable: "stock_movements",
        ascending: false,
      })
      .single(),
    // 2. ดึงข้อมูลคลังสินค้าทั้งหมด (สำหรับใช้ใน Dialog ต่างๆ)
    supabase.from("warehouses").select("id, name"),
    // 3. ดึงข้อมูลสต็อกของสินค้านี้ในแต่ละคลัง
    supabase
      .from("product_inventories")
      .select(`quantity, warehouses ( name )`)
      .eq("product_id", id),
  ])

  const { data: product, error: productError } = productRes
  const { data: warehouses, error: warehousesError } = warehousesRes
  const { data: inventories, error: inventoriesError } = inventoriesRes

  // Error Handling: ถ้าหาข้อมูลไม่เจอ หรือมี Error ให้แสดงหน้า 404 Not Found
  if (productError || !product || warehousesError || inventoriesError) {
    console.error({ productError, warehousesError, inventoriesError })
    notFound()
  }

  // const typedProduct = product as typeof product & {
  //   stock_movements: StockMovement[]
  //   width: number | null
  //   length: number | null
  //   thickness: number | null
  // }
  // const typedInventories = (inventories || []) as unknown as ProductInventory[]

  // --- การแสดงผล (Render) ---
  // ส่งข้อมูลที่ดึงมาได้ (props) ไปให้ Client Components ต่างๆ เพื่อแสดงผล
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/products"
            className="text-sm text-muted-foreground hover:underline flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("backLink")}
          </Link>
          <h1 className="text-3xl font-bold">{product.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Component ปุ่มสำหรับย้ายสต็อก */}
          <TransferStockDialog
            productId={product.id}
            warehouses={warehouses || []}
          />
          {/* Component ปุ่มสำหรับปรับปรุงสต็อก */}
          <AdjustStockDialog
            productId={product.id}
            currentStock={product.stock_quantity}
            warehouses={warehouses || []}
          />
          {/* Component ปุ่มสำหรับลบสินค้า */}
          <DeleteButton productId={product.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card แสดงรายละเอียดหลักของสินค้า */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-500">{t("price")}</p>
              <p className="text-xl font-semibold">
                ฿
                {Number(product.price).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t("description")}</p>
              <p>{product.description || "-"}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <p className="font-medium text-gray-500">{t("thickness")}</p>
                <p className="text-lg font-semibold">
                  {product.thickness ?? 0} {t("mm")}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-500">{t("width")}</p>
                <p className="text-lg font-semibold">
                  {product.width ?? 0} {t("mm")}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-500">{t("length")}</p>
                <p className="text-lg font-semibold">
                  {product.length ?? 0} {t("m")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component แสดงสต็อกรวม และสต็อกในแต่ละคลัง */}
        <ProductInventoryByWarehouse
          totalStock={product.stock_quantity}
          inventories={inventories as unknown as ProductInventory[]}
        />
      </div>

      {/* Component ฟอร์มสำหรับแก้ไขข้อมูลสินค้า (ส่งข้อมูลสินค้าปัจจุบันไปให้) */}
      <EditForm product={product} />

      {/* Component ตารางแสดงประวัติการเคลื่อนไหวของสต็อก */}
      <StockMovementHistory
        movements={(product.stock_movements as StockMovement[]) || []}
      />
    </div>
  )
}
