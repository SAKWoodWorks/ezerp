import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"
import * as XLSX from "xlsx"

interface CustomerData {
  name: string
  tax_id: string | null
  address: string | null
  phone: string | null
  line_id: string | null
  responsible_person: string | null
}

// Helper function to detect if data is CSV
function isCSVData(buffer: Buffer): boolean {
  const str = buffer.toString('utf8', 0, Math.min(2048, buffer.length))
  const lines = str.split('\n')

  // Check if it looks like CSV
  return lines.length >= 2 &&
         lines[0].includes(',') &&
         !str.includes('<') && // Not HTML/XML
         !str.includes('PK') // Not ZIP/Excel file header
}

// Helper function to parse CSV data
function parseCSVData(buffer: Buffer): CustomerData[] {
  const csvText = buffer.toString('utf8')
  const lines = csvText.trim().split('\n')

  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row')
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const data = lines.slice(1)

  return data.map((line, index) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}

    headers.forEach((header, i) => {
      row[header] = values[i] || ''
    })

    // Validate required fields
    if (!row.name && !row.customer_name) {
      throw new Error(`Row ${index + 2}: missing required field: name`)
    }

    // Map CSV columns to our schema
    const mapped: CustomerData = {
      name: row.customer_name || row.name || '',
      tax_id: row.customer_tax_id || row.tax_id || '',
      address: row.customer_address || row.address || '',
      phone: row.customer_phone || row.phone || '',
      line_id: row.line_id || '',
      responsible_person: row.responsible_person || ''
    }

    return mapped
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length === 0) {
      return Response.json({ error: "File is empty or has incorrect format." })
    }

    let data: CustomerData[]

    try {
      if (isCSVData(buffer)) {
        // Parse as CSV
        data = parseCSVData(buffer)
      } else {
        // Parse as Excel (existing logic)
        const workbook = XLSX.read(buffer, { type: "buffer" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet)

        // Map Excel data (existing mapping)
        data = data.map((row: any) => ({
          name: row.name,
          tax_id: row.tax_id || null,
          phone: row.phone ? String(row.phone) : null,
          line_id: row.line_id || null,
          address: row.address || null,
          responsible_person: row.responsible_person || null,
        }))
      }
    } catch (parseError) {
      console.error("Error processing file:", parseError)
      return Response.json({
        error: parseError instanceof Error ? parseError.message : "Failed to parse file"
      })
    }

    // Validate we have data
    if (!data || data.length === 0) {
      return Response.json({ error: "No valid data found in file" })
    }

    // Insert customers into database
    const customersToInsert = data.map((customer) => ({
      name: customer.name,
      tax_id: customer.tax_id || null,
      phone: customer.phone || null,
      line_id: customer.line_id || null,
      address: customer.address || null,
      responsible_person: customer.responsible_person || null,
    }))

    const { error: insertError } = await supabase
      .from("customers")
      .insert(customersToInsert)

    if (insertError) {
      console.error("Error inserting customers:", insertError)
      return Response.json({ error: "Failed to import customers to the database." })
    }

    return Response.json({
      success: true,
      count: customersToInsert.length
    })

  } catch (error) {
    console.error("API Error:", error)
    return Response.json({
      error: "An unexpected error occurred while processing the file."
    }, { status: 500 })
  }
}