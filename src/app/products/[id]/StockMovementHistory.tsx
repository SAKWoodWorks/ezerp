"use client"
import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Type definition for a single stock movement record
type StockMovement = {
  id: number
  created_at: string
  type: string
  quantity_change: number
  notes: string | null
  invoices: {
    invoice_number: string
  } | null
}

interface Props {
  movements: StockMovement[]
}

// Helper function to format date and time
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Helper function to determine badge color and text style
const getQuantityChangeStyle = (quantity: number) => {
  if (quantity < 0) {
    return "text-red-600 font-semibold" // สีแดงสำหรับสต็อกออก
  }
  if (quantity > 0) {
    return "text-green-600 font-semibold" // สีเขียวสำหรับสต็อกเข้า
  }
  return "text-gray-500" // สีเทาสำหรับไม่มีการเปลี่ยนแปลง
}

export default function StockMovementHistory({ movements }: Props) {
  //const t = useTranslations("TransferStockDialog")
  const tProduct = useTranslations("ProductDetailPage")
  return (
    <Card>
      <CardHeader>
        <CardTitle>{tProduct("stockMovementHistoryTitle")}</CardTitle>
        <CardDescription>
          {tProduct("stockMovementHistoryDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {tProduct("stockMovementHistoryTableHeaderDate")}
              </TableHead>
              <TableHead>
                {tProduct("stockMovementHistoryTableHeaderType")}
              </TableHead>
              <TableHead className="text-right">
                {tProduct("stockMovementHistoryTableHeaderQuantity")}
              </TableHead>
              <TableHead>
                {tProduct("stockMovementHistoryTableHeaderDescription")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length > 0 ? (
              movements.map((move) => (
                <TableRow key={move.id}>
                  <TableCell>{formatDateTime(move.created_at)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        move.type === "sale" ? "destructive" : "secondary"
                      }
                    >
                      {move.type}
                    </Badge>
                  </TableCell>

                  <TableCell
                    className={`text-right ${getQuantityChangeStyle(
                      move.quantity_change
                    )}`}
                  >
                    {move.quantity_change > 0
                      ? `+${move.quantity_change}`
                      : move.quantity_change}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {move.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {tProduct("noStockMovementHistory")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
