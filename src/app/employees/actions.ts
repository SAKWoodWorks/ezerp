"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

/**
 * Adds a new employee and initializes their leave balances.
 */
export async function addEmployee(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const employeeData = {
    full_name: formData.get("fullName") as string,
    position: formData.get("position") as string,
    start_date: formData.get("startDate") as string,
     warehouse_id: Number(formData.get("warehouseId")) || null,
  }

  // 1. Insert the new employee and get their ID back.
  const { data: newEmployee, error } = await supabase
    .from("employees")
    .insert(employeeData)
    .select("id")
    .single()

  if (error || !newEmployee) {
    console.error("Supabase error adding employee:", error)
    return redirect("/employees?message=Error: Could not add employee.")
  }

  // 2. Call the RPC function to set up initial leave balances.
  const currentYear = new Date().getFullYear()
  const { error: rpcError } = await supabase.rpc(
    "initialize_employee_leave_balances",
    {
      p_employee_id: newEmployee.id,
      p_year: currentYear,
    }
  )

  if (rpcError) {
    console.error("Error initializing leave balances:", rpcError)
    // You might want to handle this error, e.g., by deleting the newly created employee
    // or just logging it for manual correction.
  }

  await revalidatePath("/employees")
  redirect("/employees")
}

/**
 * Updates an existing employee's details.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateEmployee(employeeId: number, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Authentication required." }
  }

  const employeeData = {
    full_name: formData.get("fullName") as string,
    position: formData.get("position") as string,
    start_date: formData.get("startDate") as string,
    warehouse_id: Number(formData.get("warehouseId")) || null,
  }

  const { error } = await supabase
    .from("employees")
    .update(employeeData)
    .eq("id", employeeId)

  if (error) {
    console.error("Error updating employee:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/employees")
  revalidatePath(`/employees/${employeeId}`)

  return { success: true }
}

/**
 * Deletes an employee.
 */
export async function deleteEmployee(employeeId: number) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return redirect("/login")

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", employeeId)

  if (error) {
    console.error("Error deleting employee:", error)
    return redirect("/employees?message=Error deleting employee")
  }

  await revalidatePath("/employees")
  redirect("/employees")
}

// --- ลบฟังก์ชัน updateLeaveBalances เก่าทิ้ง แล้วแทนที่ด้วยฟังก์ชันนี้ ---
/**
 * Records a leave event for an employee and deducts from their balance.
 * @param {FormData} formData - The form data from the client.
 * @returns {Promise<{error?: string, success?: boolean}>} Result object.
 */
export async function recordLeave(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Authentication required" }

  const employeeId = Number(formData.get("employeeId"))
  const leaveTypeId = Number(formData.get("leaveTypeId"))
  const daysTaken = Number(formData.get("daysTaken"))
  const leaveDate = formData.get("leaveDate") as string
  const reason = formData.get("reason") as string

  // --- แก้ไขเงื่อนไขการตรวจสอบที่นี่ ---
  // 1. ตรวจสอบว่าข้อมูลพื้นฐานมีครบหรือไม่
  if (!employeeId || !leaveDate) {
    return { error: "ข้อมูลพนักงานหรือวันที่ไม่ถูกต้อง" }
  }
  // 2. ตรวจสอบ 'ประเภทการลา' โดยเฉพาะ (ต้องเป็นตัวเลขที่มากกว่า 0)
  if (isNaN(leaveTypeId) || leaveTypeId <= 0) {
    return { error: "กรุณาเลือกประเภทการลา" }
  }
  // 3. ตรวจสอบ 'จำนวนวันที่ลา' โดยเฉพาะ (ต้องเป็นตัวเลขที่มากกว่า 0)
  if (isNaN(daysTaken) || daysTaken <= 0) {
    return { error: "จำนวนวันที่ลาต้องเป็นตัวเลขที่มากกว่า 0" }
  }
  // --- สิ้นสุดการแก้ไข ---

  // เรียกใช้ฟังก์ชัน RPC ในฐานข้อมูล
  const { error } = await supabase.rpc("record_and_deduct_leave", {
    p_employee_id: employeeId,
    p_leave_type_id: leaveTypeId,
    p_days_taken: daysTaken,
    p_leave_date: leaveDate,
    p_reason: reason,
  })

  if (error) {
    console.error("Error recording leave:", error)
    return { error: "ไม่สามารถบันทึกการลาได้" }
  }

  // Revalidate path ที่เกี่ยวข้อง
  await revalidatePath(`/employees/${employeeId}`)
  return { success: true }
}
