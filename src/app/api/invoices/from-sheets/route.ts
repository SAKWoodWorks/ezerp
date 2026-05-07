import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Type definitions for invoice creation
type InvoiceItem = {
  productId: number        // Product ID from your database
  description: string      // Product description
  quantity: number         // Quantity sold
  unitPrice: number       // Unit price
  total: number           // Line total (quantity × unitPrice)
}

type CreateInvoiceRequest = {
  customerId: number
  responsiblePersonId?: number
  priceTier: "wholesale" | "retail" | "special"
  issueDate: string       // ISO date string
  dueDate: string         // ISO date string
  items: InvoiceItem[]
  status?: "Draft" | "Sent" | "Paid" | "Overdue"
  notes?: string
}

// Generate invoice number (same logic as existing function)
async function generateNextInvoiceNumber(supabase: any) {
  const currentYear = new Date().getFullYear().toString().slice(-2)

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `INVNo${currentYear}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return 1
  }

  try {
    const runningNumberStr = data.invoice_number.substring(7, 10)
    const nextNumber = parseInt(runningNumberStr, 10) + 1
    return isNaN(nextNumber) ? 1 : nextNumber
  } catch {
    return 1
  }
}

// Format invoice number
function formatInvoiceNumber(runningNumber: number, userInitials: string = "GS") {
  const currentYear = new Date().getFullYear().toString().slice(-2)
  const paddedNumber = runningNumber.toString().padStart(3, "0")
  return `INVNo${currentYear}${paddedNumber}${userInitials}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CreateInvoiceRequest = await request.json()

    // Validate required fields
    if (!body.customerId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "customerId and items are required" },
        { status: 400 }
      )
    }

    // Validate customer exists
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, name")
      .eq("id", body.customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Validate products exist and get current stock
    for (const item of body.items) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, stock_quantity, price")
        .eq("id", item.productId)
        .single()

      if (productError || !product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        )
      }

      // Optional: Check if sufficient stock available
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`,
            productId: item.productId,
            available: product.stock_quantity,
            requested: item.quantity
          },
          { status: 400 }
        )
      }
    }

    // Generate invoice number
    const nextNumber = await generateNextInvoiceNumber(supabase)
    const invoiceNumber = formatInvoiceNumber(nextNumber, "GS") // GS = Google Sheets

    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + item.total, 0)
    const vatAmount = subtotal * 0.07 // 7% VAT
    const grandTotal = subtotal + vatAmount

    // Create invoice data
    const invoiceData = {
      customer_id: body.customerId,
      responsible_person_id: body.responsiblePersonId || null,
      price_tier: body.priceTier,
      invoice_number: invoiceNumber,
      issue_date: body.issueDate,
      due_date: body.dueDate,
      status: body.status || "Draft",
      items: body.items,
      subtotal: subtotal,
      vat_amount: vatAmount,
      grand_total: grandTotal,
      notes: body.notes || null,
      created_by: user.id
    }

    // Insert invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceData)
      .select(`
        *,
        customers (name),
        responsible_persons (name)
      `)
      .single()

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError)
      return NextResponse.json(
        { error: "Failed to create invoice", details: invoiceError.message },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerId: invoice.customer_id,
        customerName: invoice.customers?.name,
        status: invoice.status,
        grandTotal: invoice.grand_total,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        itemCount: body.items.length,
        createdAt: invoice.created_at
      },
      message: `Invoice ${invoice.invoice_number} created successfully`
    }, { status: 201 })

  } catch (error) {
    console.error("Error in invoice creation API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET method to test the endpoint
export async function GET() {
  return NextResponse.json({
    message: "Invoice creation API endpoint",
    method: "POST",
    endpoint: "/api/invoices/from-sheets",
    example: {
      customerId: 1,
      responsiblePersonId: 1,
      priceTier: "retail",
      issueDate: "2026-05-06",
      dueDate: "2026-05-20",
      items: [
        {
          productId: 1,
          description: "Teak Wood 2x4",
          quantity: 10,
          unitPrice: 500,
          total: 5000
        }
      ],
      status: "Draft",
      notes: "Created via Google Sheets"
    }
  })
}