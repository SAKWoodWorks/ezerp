import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Client ตัวนี้ใช้สำหรับดึงข้อมูลแบบ "Public" จากฝั่ง Server เท่านั้น
// จะไม่ยุ่งเกี่ยวกับ Session หรือ Cookie ของผู้ใช้เลย
export function createPublicServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing for public client. Please check your .env.local file and restart the server."
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
