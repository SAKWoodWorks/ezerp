import type { Metadata } from "next"
import { Sarabun } from "next/font/google"
import "./globals.css"
import Sidebar from "@/components/Sidebar"
import { createClient } from "@/lib/supabase/server"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

const sarabun = Sarabun({
  subsets: ["latin", "thai"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "EZ Erp",
  description: "ERP for SAK Woodworks",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className={sarabun.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {user ? (
            <div className="flex bg-gray-100 font-sans">
              <Sidebar />
              <main className="flex-1">{children}</main>
            </div>
          ) : (
            <div className="bg-gray-100 font-sans">{children}</div>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
