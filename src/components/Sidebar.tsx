"use client"

// Corrected: Import both Link and usePathname from 'next-intl/navigation'
//import { Link, usePathname } from "next-intl/navigation"
import Link from "next/link"
//import { usePathname } from "next-intl/navigation";
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart2,
  LogOut,
  Package,
  UserCheck,
  ClipboardList,
  Settings,
  UserCog,
  History,
  ChevronRight,
  Warehouse,
  Receipt,
  //BookUser,
} from "lucide-react"
import { logout } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useTranslations } from "next-intl"
import LanguageSwitcher from "./LanguageSwitcher"

export default function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations("Sidebar")
  const tSubmenu = useTranslations("Submenu")

  const navItems = [
    { href: "/", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/customers", label: t("customers"), icon: Users },
    { href: "/quotations", label: t("quotations"), icon: ClipboardList },
    { href: "/invoices", label: t("invoices"), icon: FileText },
    { href: "/cash-bills", label: t("cashBills"), icon: Receipt }, // 2. Add new menu item
    { href: "/products", label: t("products"), icon: Package },
    { href: "/warehouses", label: t("warehouses"), icon: Warehouse },
    {
      href: "/responsible-persons",
      label: t("responsible_persons"),
      icon: UserCheck,
    },
    {
      label: t("employees"),
      icon: UserCog,
      submenus: [
        { href: "/employees", label: tSubmenu("employee_list"), icon: UserCog },
        {
          href: "/employees/leave-history",
          label: tSubmenu("leave_history"),
          icon: History,
        },
      ],
    },
    //{ href: "/accounting", label: t("accounting"), icon: BookUser },
    { href: "/reports", label: t("reports"), icon: BarChart2 },
    { href: "/settings", label: t("settings"), icon: Settings },
  ]

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-background md:flex">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">MyERP</h1>
      </div>
      <div className="flex flex-1 flex-col gap-y-7 p-4">
        <nav className="flex flex-col gap-y-1">
          {navItems.map((item) =>
            item.submenus ? (
              <Collapsible
                key={item.label}
                defaultOpen={pathname.startsWith("/dashboard")}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1 pl-6">
                  {item.submenus.map((submenu) => {
                    const isSubmenuActive = pathname === submenu.href
                    return (
                      <Button
                        key={submenu.label}
                        variant={isSubmenuActive ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href={submenu.href} prefetch={false}>
                          {submenu.label}
                        </Link>
                      </Button>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <Button
                key={item.label}
                variant={pathname === item.href! ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href!} prefetch={false}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          )}
        </nav>
        <div className="mt-auto space-y-1">
          <LanguageSwitcher />
          <form action={logout}>
            <Button variant="ghost" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </Button>
          </form>
        </div>
      </div>
    </aside>
  )
}
