"use client"

import { useMemo, useState } from "react"
import { MoreHorizontal, Plus, Search, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader } from "@/components/shared/page-header"
import { AccountStatusBadge, RoleBadge } from "@/components/shared/status-badge"
import { SimpleSelect } from "@/components/shared/simple-select"
import { TablePagination, paginate } from "@/components/shared/table-pagination"
import { UserDialog } from "@/components/users/user-dialog"
import { useSetUserStatus, useUsers } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { ROLE_LABELS } from "@/lib/constants"
import { formatDateTime, normalize } from "@/lib/utils/format"
import type { AccountStatus, Role, SessionUser } from "@/types"

const PAGE_SIZE = 10

export function UsersList() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useUsers()
  const setUserStatus = useSetUserStatus()

  const [query, setQuery] = useState("")
  const [role, setRole] = useState<Role | "">("")
  const [status, setStatus] = useState<AccountStatus | "">("")
  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<SessionUser | undefined>(undefined)

  const filtered = useMemo(() => {
    const q = normalize(query)
    return (users ?? []).filter((u) => {
      if (role && u.role !== role) return false
      if (status && u.status !== status) return false
      if (!q) return true
      return normalize([u.fullName, u.username, u.email, ROLE_LABELS[u.role]].join(" ")).includes(q)
    })
  }, [users, query, role, status])

  const rows = paginate(filtered, page, PAGE_SIZE)
  const hasFilters = !!(query || role || status)

  function openCreate() {
    setEditingUser(undefined)
    setDialogOpen(true)
  }

  function openEdit(user: SessionUser) {
    setEditingUser(user)
    setDialogOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Gestion des comptes d'accès et des rôles de l'application."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Nouvel utilisateur
          </Button>
        }
      />

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher par nom, identifiant, e-mail…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SimpleSelect
              value={role}
              onValueChange={(v) => {
                setRole(v as Role | "")
                setPage(1)
              }}
              placeholder="Tous les rôles"
              className="lg:w-48"
              options={[
                { value: "", label: "Tous les rôles" },
                ...(Object.keys(ROLE_LABELS) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] })),
              ]}
            />
            <SimpleSelect
              value={status}
              onValueChange={(v) => {
                setStatus(v as AccountStatus | "")
                setPage(1)
              }}
              placeholder="Tous les statuts"
              className="lg:w-40"
              options={[
                { value: "", label: "Tous les statuts" },
                { value: "ACTIF", label: "Actif" },
                { value: "INACTIF", label: "Inactif" },
              ]}
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("")
                setRole("")
                setStatus("")
                setPage(1)
              }}
            >
              <X data-icon="inline-start" />
              Réinitialiser
            </Button>
          )}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck />
              </EmptyMedia>
              <EmptyTitle>Aucun utilisateur</EmptyTitle>
              <EmptyDescription>Aucun compte ne correspond aux critères de recherche.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Nom complet</TableHead>
                  <TableHead className="hidden md:table-cell">Identifiant</TableHead>
                  <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden xl:table-cell">Dernière connexion</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="px-4">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {rows.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => openEdit(u)}>
                      <TableCell className="pl-4 font-medium">
                        <div className="flex flex-col">
                          <span>{u.fullName}</span>
                          <span className="text-xs text-muted-foreground lg:hidden">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs md:table-cell">{u.username}</TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{u.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge status={u.status} />
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-xs text-muted-foreground xl:table-cell">
                        {formatDateTime(u.lastLoginAt)}
                      </TableCell>
                      <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${u.fullName}`} />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => openEdit(u)}>Modifier</DropdownMenuItem>
                              {!isSelf && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    setUserStatus.mutate({
                                      id: u.id,
                                      status: u.status === "ACTIF" ? "INACTIF" : "ACTIF",
                                    })
                                  }
                                >
                                  {u.status === "ACTIF" ? "Désactiver le compte" : "Activer le compte"}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </div>

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </>
  )
}
