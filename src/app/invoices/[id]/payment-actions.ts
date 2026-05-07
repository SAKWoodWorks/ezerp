"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

/**
 * Record a payment against an invoice
 */
export async function recordPayment(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return redirect("/login")
  }

  try {
    const invoiceId = Number(formData.get("invoiceId"))
    const amount = Number(formData.get("amount"))
    const paymentDate = formData.get("paymentDate") as string
    const paymentMethod = formData.get("paymentMethod") as string
    const referenceNumber = formData.get("referenceNumber") as string
    const notes = formData.get("notes") as string

    if (!invoiceId || !amount || amount <= 0) {
      return { error: "Invalid payment data" }
    }

    // Get invoice to check balance
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("total_amount, paid_amount, balance_due")
      .eq("id", invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { error: "Invoice not found" }
    }

    // Check if payment amount exceeds balance due
    if (amount > Number(invoice.balance_due)) {
      return { error: "Payment amount exceeds balance due" }
    }

    // Insert payment
    const { error: paymentError } = await supabase.from("payments").insert({
      invoice_id: invoiceId,
      amount: amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      notes: notes || null,
      created_by: user.id,
    })

    if (paymentError) {
      console.error("Error recording payment:", paymentError)
      return { error: "Failed to record payment" }
    }

    // Revalidate paths
    await revalidatePath(`/invoices/${invoiceId}`)
    await revalidatePath("/invoices")
    await revalidatePath("/payments")

    return { success: true }
  } catch (error) {
    console.error("Error in recordPayment:", error)
    return { error: "Unexpected error occurred" }
  }
}

/**
 * Delete a payment
 */
export async function deletePayment(paymentId: number, invoiceId: number) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Authentication required" }
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId)

  if (error) {
    console.error("Error deleting payment:", error)
    return { error: "Failed to delete payment" }
  }

  await revalidatePath(`/invoices/${invoiceId}`)
  await revalidatePath("/invoices")
  await revalidatePath("/payments")

  return { success: true }
}

/**
 * Get all payments for an invoice
 */
export async function getInvoicePayments(invoiceId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("get_invoice_payments", {
    p_invoice_id: invoiceId,
  })

  if (error) {
    console.error("Error fetching invoice payments:", error)
    return []
  }

  return data || []
}
