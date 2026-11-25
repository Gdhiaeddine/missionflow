"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Bell, CalendarDays, LogOut, Search } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Kbd } from "@/components/shared/kbd"
import { MissionStatusBadge } from "@/components/shared/status-badge"
import { resolvePageTitle } from "@/lib/navigation"
import { AUDIT_ACTION_LABELS, ROLE_LABELS } from "@/lib/constants"
import { formatDateTime, initials } from "@/lib/utils/format"
import { useAuth } from "@/providers/auth-provider"
import { useAuditLogs, useEmployees, useMissions } from "@/hooks/use-data"

export function AppHeader() {
  const pathname = usePathname()
  const { title, parent } = resolvePageTitle(pathname)
  const { user, logout } = useAuth()

  return (
    <header className="no-print sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <Breadcrumb className="hidden min-w-0 sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/dashboard" />}>Accueil</BreadcrumbLink>
          </BreadcrumbItem>
          {parent && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={parent.href} />}>{parent.title}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <span className="truncate text-sm font-medium sm:hidden">{title}</span>

      <div className="ml-auto flex items-center gap-2">
        <GlobalSearch />
        <div className="hidden items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground lg:flex">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <span className="capitalize">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</span>
        </div>
        <Notifications />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="rounded-full" aria-label="Menu utilisateur" />}
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-navy text-xs text-white">{initials(user?.fullName ?? "")}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground">{user ? ROLE_LABELS[user.role] : ""}</span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={logout}>
                <LogOut />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { can } = useAuth()
  const { data: missions = [] } = useMissions()
  const { data: employees = [] } = useEmployees()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        className="hidden h-8 w-64 justify-start gap-2 px-2.5 text-muted-foreground md:flex"
        onClick={() => setOpen(true)}
      >
        <Search data-icon="inline-start" />
        <span className="flex-1 text-left font-normal">Rechercher…</span>
        <Kbd>⌘K</Kbd>
      </Button>
      <Button variant="ghost" size="icon" className="md:hidden" aria-label="Rechercher" onClick={() => setOpen(true)}>
        <Search />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Recherche globale" description="Rechercher un ordre de mission ou un employé">
        <CommandInput placeholder="Référence, employé, destination…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Ordres de mission">
            {missions.slice(0, 40).map((mission) => (
              <CommandItem
                key={mission.id}
                value={`${mission.reference} ${mission.employee?.firstName ?? ""} ${mission.employee?.lastName ?? ""} ${mission.destination} ${mission.subject}`}
                onSelect={() => go(`/missions/${mission.id}`)}
              >
                <span className="font-mono text-xs">{mission.reference}</span>
                <span className="truncate text-muted-foreground">
                  {mission.employee?.lastName} {mission.employee?.firstName} · {mission.destination}
                </span>
                <span className="ml-auto">
                  <MissionStatusBadge status={mission.status} />
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          {can("employee.view") && (
            <CommandGroup heading="Personnel">
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={`${employee.employeeNumber} ${employee.lastName} ${employee.firstName} ${employee.position}`}
                  onSelect={() => go("/employees")}
                >
                  <span className="font-mono text-xs">{employee.employeeNumber}</span>
                  <span className="truncate">
                    {employee.lastName} {employee.firstName}
                  </span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{employee.position}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

function Notifications() {
  const { user } = useAuth()
  const { data: logs = [] } = useAuditLogs()
  const { data: missions = [] } = useMissions()
  const pending = missions.filter((m) => m.status === "EN_ATTENTE").length

  const recent = useMemo(
    () =>
      logs
        .filter((log) => log.entityType === "MISSION" || log.entityType === "DOCUMENT")
        .slice(0, 6),
    [logs],
  )

  const missionRef = (id: string) => missions.find((m) => m.id === id)?.reference

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}>
        <Bell />
        {pending > 0 && (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-warning ring-2 ring-background" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {pending > 0 && (
            <span className="text-xs text-muted-foreground">
              {pending} en attente de validation
            </span>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {recent.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Aucune notification.</li>}
          {recent.map((log) => (
            <li key={log.id} className="border-b last:border-b-0">
              <Link
                href={`/missions/${log.entityId}`}
                className="flex flex-col gap-0.5 px-4 py-2.5 text-sm hover:bg-muted/60"
              >
                <span className="font-medium">{AUDIT_ACTION_LABELS[log.action]}</span>
                <span className="text-xs text-muted-foreground">
                  {missionRef(log.entityId) ?? "—"} · {formatDateTime(log.timestamp)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {user?.role === "RESPONSABLE" && pending > 0 && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" render={<Link href="/approvals" />}>
              Ouvrir la validation des ordres
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
