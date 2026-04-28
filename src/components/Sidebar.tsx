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
  //History,
  ChevronRight,
  Warehouse,
  Receipt,
  Laptop,
  PieChart,
  ShoppingCart,
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
import { Separator } from "@radix-ui/react-dropdown-menu"

interface MenuItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  href: string
  submenus?: { href: string; label: string }[]
}

// Helper component for individual menu items to keep the code clean
const NavItem = ({ item, pathname }: { item: MenuItem; pathname: string }) => {
  if (item.submenus) {
    return (
      <Collapsible
        key={item.label}
        defaultOpen={pathname.startsWith("/employees")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start">
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
            <ChevronRight className="ml-auto h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pt-1 pl-6">
          {item.submenus.map((submenu: { href: string; label: string }) => {
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
    )
  }

  return (
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
}

export default function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations("Sidebar")
  const tSubmenu = useTranslations("Submenu")
  const tSections = useTranslations("SidebarSections")

  // 2. Reorganize menu items into logical sections
  const menuSections = [
    {
      title: tSections("main"),
      items: [
        { href: "/", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/reports", label: t("reports"), icon: BarChart2 },
      ],
    },
    {
      title: tSections("sales"),
      items: [
        { href: "/pos", label: t("pos"), icon: ShoppingCart },
        { href: "/customers", label: t("customers"), icon: Users },
        { href: "/quotations", label: t("quotations"), icon: ClipboardList },
        { href: "/invoices", label: t("invoices"), icon: FileText },
        { href: "/cash-bills", label: t("cashBills"), icon: Receipt },
      ],
    },
    {
      title: tSections("inventory"),
      items: [
        { href: "/products", label: t("products"), icon: Package },
        { href: "/warehouses", label: t("warehouses"), icon: Warehouse },
        {
          href: "/warehouses/summary",
          label: t("warehouseSummary"),
          icon: PieChart,
        },
      ],
    },
    {
      title: tSections("office"),
      items: [
        { href: "/assets", label: t("officeAssets"), icon: Laptop },
        {
          href: "/employees",
          label: t("employees"),
          icon: UserCog,
          submenus: [
            { href: "/employees", label: tSubmenu("employee_list") },
            {
              href: "/employees/leave-history",
              label: tSubmenu("leave_history"),
            },
          ],
        },
        {
          href: "/responsible-persons",
          label: t("responsible_persons"),
          icon: UserCheck,
        },
      ],
    },
  ]

  return (
    <aside className="hidden h-screen w-64 flex-col border-r bg-background md:flex">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">EZ ERP</h1>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <nav className="flex flex-col gap-y-4">
          {/* 3. Render sections with separators */}
          {menuSections.map((section, index) => (
            <div key={index}>
              {index > 0 && <Separator className="my-2" />}
              <h2 className="mb-2 px-2 text-sm font-semibold text-muted-foreground tracking-wider">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem key={item.label} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1">
          <Separator className="my-2" />
          {/* <Button
            variant={pathname === "/accounting" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/accounting">
              <BookUser className="mr-2 h-4 w-4" />
              {t("accounting")}
            </Link>
          </Button> */}
          <Button
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              {t("settings")}
            </Link>
          </Button>
          <Separator className="my-2" />
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
