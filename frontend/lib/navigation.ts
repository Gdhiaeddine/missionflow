import {
  BarChart3,
  Car,
  CheckSquare,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Printer,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "@/lib/permissions"

export interface NavChild {
  title: string
  href: string
  permission?: Permission
}

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  permission?: Permission
  highlight?: "primary"
  children?: NavChild[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Nouvel ordre",
    href: "/missions/new",
    icon: FilePlus2,
    permission: "mission.create",
    highlight: "primary",
  },
  {
    title: "Ordres de mission",
    href: "/missions",
    icon: FileText,
    permission: "mission.view",
  },
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, permission: "report.view" },
  { title: "Personnel", href: "/employees", icon: Users, permission: "employee.view" },
  { title: "Véhicules", href: "/vehicles", icon: Car, permission: "mission.view" },
  { title: "Validation des ordres", href: "/approvals", icon: CheckSquare, permission: "approval.view" },
  { title: "Historique d'impression", href: "/print-history", icon: Printer, permission: "printHistory.view" },
  { title: "Rapports et statistiques", href: "/reports", icon: BarChart3, permission: "report.view" },
  { title: "Utilisateurs", href: "/users", icon: ShieldCheck, permission: "user.manage" },
  { title: "Paramètres", href: "/settings", icon: Settings, permission: "settings.manage" },
]

const TITLES: { match: RegExp; title: string; parent?: { title: string; href: string } }[] = [
  { match: /^\/dashboard$/, title: "Tableau de bord" },
  { match: /^\/missions$/, title: "Ordres de mission" },
  { match: /^\/missions\/new$/, title: "Nouvel ordre", parent: { title: "Ordres de mission", href: "/missions" } },
  { match: /^\/missions\/[^/]+\/edit$/, title: "Modification", parent: { title: "Ordres de mission", href: "/missions" } },
  { match: /^\/missions\/[^/]+\/document$/, title: "Document officiel", parent: { title: "Ordres de mission", href: "/missions" } },
  { match: /^\/missions\/[^/]+$/, title: "Détail de l'ordre", parent: { title: "Ordres de mission", href: "/missions" } },
  { match: /^\/employees$/, title: "Personnel" },
  { match: /^\/vehicles$/, title: "Véhicules" },
  { match: /^\/employees\/new$/, title: "Nouvel employé", parent: { title: "Personnel", href: "/employees" } },
  { match: /^\/employees\/[^/]+$/, title: "Fiche employé", parent: { title: "Personnel", href: "/employees" } },
  { match: /^\/approvals$/, title: "Validation des ordres" },
  { match: /^\/print-history$/, title: "Historique d'impression" },
  { match: /^\/reports$/, title: "Rapports et statistiques" },
  { match: /^\/users$/, title: "Utilisateurs" },
  { match: /^\/settings$/, title: "Paramètres" },
]

export function resolvePageTitle(pathname: string) {
  return TITLES.find((t) => t.match.test(pathname)) ?? { title: "Ordres de Mission" }
}
