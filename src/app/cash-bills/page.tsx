import { createClient } from "@/lib/supabase/server"
import CashBillClientPage from "./CashBillClientPage" // Import the new client component

export default async function CashBillsPage() {
  const supabase = await createClient()

  const { data: bills, error } = await supabase
    .from("cash_bills")
    .select(
      `
      id,
      bill_number,
      issue_date,
      total_amount,
      customers ( name )
    `
    )
    .order("issue_date", { ascending: false })

  if (error) {
    console.error("Error fetching cash bills:", error)
    return <p className="p-8">Error loading data.</p>
  }

  // *** CORRECTED LOGIC HERE ***
  // This function safely handles cases where 'customers' might be an array or an object.
  const typedBills = (bills || []).map((bill) => {
    // Check if bill.customers is an array, and if so, take the first element.
    const customerObject = Array.isArray(bill.customers)
      ? bill.customers[0]
      : bill.customers

    return {
      ...bill,
      customers: customerObject as { name: string } | null,
    }
  })

  return <CashBillClientPage initialBills={typedBills} />
}
