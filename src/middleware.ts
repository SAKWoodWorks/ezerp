import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// const locales = ["en", "th", "ru"]
// const defaultLocale = "th"

// function getLocale(request: NextRequest): string {
//   // 1. Check for locale in cookies first
//   const localeCookie = request.cookies.get("NEXT_LOCALE")?.value
//   if (localeCookie && locales.includes(localeCookie)) {
//     return localeCookie
//   }

//   // 2. If no cookie, check the Accept-Language header
//   const languages = request.headers.get("accept-language")
//   if (languages) {
//     const preferredLocales = languages
//       .split(",")
//       .map((lang) => lang.split(";")[0].trim().slice(0, 2))
//     for (const locale of preferredLocales) {
//       if (locales.includes(locale)) {
//         return locale
//       }
//     }
//   }

//   // 3. Fallback to the default locale
//   return defaultLocale
// }

export async function middleware(request: NextRequest) {
  // First, handle Supabase session management
  const { response: supabaseResponse, user } = await updateSession(request)

  // Determine the locale based on cookie or header
  //const locale = getLocale(request)

  // Add the determined locale to the request headers
  // This makes it available to Server Components via `getLocale`
  //supabaseResponse.headers.set("x-next-intl-locale", locale)

  // Authentication logic
  const url = request.nextUrl.clone()
  const isLoginPage = url.pathname === "/login"

  // ตรวจสอบว่าเป็นหน้ารายละเอียดอุปกรณ์หรือไม่ (เช่น /assets/123)
  //const isPublicAssetPage = /^\/assets\/\d+$/.test(url.pathname)
  // ตรวจสอบว่าเป็นหน้ารายละเอียดอุปกรณ์ "สาธารณะ" หรือไม่ (เช่น /public/asset/123)
  const isPublicAssetPage = /^\/public\/asset\/\d+$/.test(url.pathname)

  if (!user && !isLoginPage && !isPublicAssetPage) {
    // Redirect to login page if not authenticated
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth (for Supabase callback)
     * - /public (ยกเว้นทุก path ภายใต้ /public)
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|public).*)",
  ],
}
