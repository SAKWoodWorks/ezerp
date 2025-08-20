import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import Link from "next/link"
import EditForm from "./EditForm"
import DeleteButton from "./DeleteButton"
import StockMovementHistory from "./StockMovementHistory"
import AdjustStockDialog from "./AdjustStockDialog"
import ProductInventoryByWarehouse from "./ProductInventoryByWarehouse"
import TransferStockDialog from "./TransferStockDialog" // Import the new transfer dialog
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
  warehouses: { name: string } | null
}

type ProductInventory = {
  quantity: number
  warehouses: {
    name: string
  } | null
}

// type Warehouse = {
//   id: number
//   name: string
// }

export default async function ProductDetailPage(props: Props) {
  const params = await props.params
  const { id } = params
  const supabase = await createClient()
  const t = await getTranslations("ProductDetailPage")

  // Fetch product, warehouses, and inventory data in parallel for efficiency
  const [productRes, warehousesRes, inventoriesRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        `*,
        stock_movements (
          id, created_at, type, quantity_change, notes, invoice_id,
          invoices ( invoice_number ),
          warehouses ( name )
        )`
      )
      .eq("id", id)
      .order("created_at", {
        referencedTable: "stock_movements",
        ascending: false,
      })
      .single(),
    supabase.from("warehouses").select("id, name"),
    supabase
      .from("product_inventories")
      .select(`quantity, warehouses ( name )`)
      .eq("product_id", id),
  ])

  const { data: product, error: productError } = productRes
  const { data: warehouses, error: warehousesError } = warehousesRes
  const { data: inventories, error: inventoriesError } = inventoriesRes

  if (productError || !product || warehousesError || inventoriesError) {
    console.error({ productError, warehousesError, inventoriesError })
    notFound()
  }

  const typedProduct = product as typeof product & {
    stock_movements: StockMovement[]
    width: number | null
    length: number | null
    thickness: number | null
  }
  const typedInventories = (inventories || []) as unknown as ProductInventory[]

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
          <h1 className="text-3xl font-bold">{typedProduct.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Add the new "Transfer Stock" button */}
          <TransferStockDialog
            productId={typedProduct.id}
            warehouses={warehouses || []}
          />
          {/* Pass the list of warehouses to the dialog component */}
          <AdjustStockDialog
            productId={typedProduct.id}
            currentStock={typedProduct.stock_quantity}
            warehouses={warehouses || []}
          />
          <DeleteButton productId={typedProduct.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main product details card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-500">{t("price")}</p>
              <p className="text-xl font-semibold">
                ฿
                {Number(typedProduct.price).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t("description")}</p>
              <p>{typedProduct.description || "-"}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <p className="font-medium text-gray-500">{t("thickness")}</p>
                <p className="text-lg font-semibold">
                  {typedProduct.thickness ?? 0} {t("mm")}
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-500">{t("width")}</p>
                <p className="text-lg font-semibold">
                  {typedProduct.width ?? 0} {t("mm")}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-500">{t("length")}</p>
                <p className="text-lg font-semibold">
                  {typedProduct.length ?? 0} {t("m")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New card to display inventory breakdown by warehouse */}
        <ProductInventoryByWarehouse
          totalStock={typedProduct.stock_quantity}
          inventories={typedInventories}
        />
      </div>

      <EditForm product={typedProduct} />
      <StockMovementHistory movements={typedProduct.stock_movements || []} />
    </div>
  )
}
