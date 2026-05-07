import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import CustomerClientPage from "./CustomerClientPage"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CustomersPage(props: Props) {
  try {
    // Parse URL search parameters with Next.js 15 async pattern
    const searchParams = await props.searchParams

    // Parse and validate pagination parameters
    const pageParam = searchParams.page
    const limitParam = searchParams.limit

    // Validate page parameter (must be positive integer)
    const page = Math.max(1, parseInt(typeof pageParam === 'string' ? pageParam : '1') || 1)

    // Validate limit parameter (must be in allowed values)
    const validLimits = [25, 50, 100, 200]
    const parsedLimit = parseInt(typeof limitParam === 'string' ? limitParam : '50') || 50
    const limit = validLimits.includes(parsedLimit) ? parsedLimit : 50

    const supabase = await createClient()

    // Calculate pagination range
    const start = (page - 1) * limit
    const end = start + limit - 1

    // Get total count first (separate query for accuracy)
    const { count: totalCount, error: countError } = await supabase
      .from("customers")
      .select("*", { count: 'exact', head: true })

    if (countError) {
      console.error("Error fetching customer count:", countError)
      return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลจำนวนลูกค้า</p>
    }

    const totalPages = Math.max(1, Math.ceil((totalCount || 0) / limit))

    // Check if requested page exceeds available pages
    if (page > totalPages && totalCount !== null && totalCount > 0) {
      // Redirect to last page if requested page is out of bounds
      const params = new URLSearchParams()
      params.set('page', totalPages.toString())
      if (limit !== 50) params.set('limit', limit.toString())
      redirect(`/customers?${params.toString()}`)
    }

    // Fetch paginated customers data
    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, end)

    if (error) {
      console.error("Error fetching customers:", error)
      return <p className="p-8">เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้า</p>
    }

    // Prepare pagination props for client component
    const paginationProps = {
      currentPage: page,
      pageSize: limit,
      totalCount: totalCount || 0,
      totalPages
    }

    return (
      <CustomerClientPage
        initialCustomers={customers || []}
        pagination={paginationProps}
      />
    )
  } catch (error) {
    console.error("Unexpected error in CustomersPage:", error)
    return <p className="p-8">เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง</p>
  }
}
