"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronRight, ChevronsUpDown, LogOut, UserRound } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoMark } from "@/components/brand/logo"
import { NAV_ITEMS } from "@/lib/navigation"
import { DEPARTMENT_LABEL, ROLE_LABELS } from "@/lib/constants"
import { initials } from "@/lib/utils/format"
import { useAuth } from "@/providers/auth-provider"

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, can, logout } = useAuth()
  const { state, setOpenMobile } = useSidebar()
  const currentStatus = searchParams.get("status")

  const items = NAV_ITEMS.filter((item) => !item.permission || can(item.permission))

  function isChildActive(href: string) {
    const [path, query] = href.split("?")
    if (pathname !== path) return false
    const status = query ? new URLSearchParams(query).get("status") : null
    return status === currentStatus
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 border-b px-3 py-4">
        <Link
          href="/dashboard"
          className="flex w-full flex-col items-center gap-2 text-center"
          onClick={() => setOpenMobile(false)}
        >
          <LogoMark className={state === "collapsed" ? "h-8" : "h-16"} />
          {state !== "collapsed" && (
            <span className="text-[11px] leading-tight text-muted-foreground">
              Gestion des Ordres de Mission
            </span>
          )}
          <span className="sr-only">Accueil</span>
        </Link>
        <div className="rounded-md border border-dashed bg-muted/50 px-2 py-1.5 text-center text-[10px] font-semibold tracking-[0.08em] text-muted-foreground group-data-[collapsible=icon]:hidden">
          {DEPARTMENT_LABEL}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const children = item.children?.filter((child) => !child.permission || can(child.permission))

              if (children?.length) {
                return (
                  <Collapsible key={item.href} defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger
                        render={<SidebarMenuButton tooltip={item.title} isActive={active && state === "collapsed"} />}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {children.map((child) => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton
                                isActive={isChildActive(child.href)}
                                render={<Link href={child.href} onClick={() => setOpenMobile(false)} />}
                              >
                                <span>{child.title}</span>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              }

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={active}
                    tooltip={item.title}
                    render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="size-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-navy text-xs text-white">
                    {initials(user?.fullName ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user ? ROLE_LABELS[user.role] : ""}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{user?.fullName}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem disabled>
                    <UserRound />
                    {user ? ROLE_LABELS[user.role] : ""}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} variant="destructive">
                    <LogOut />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
