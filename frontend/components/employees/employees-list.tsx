"use client"

import { useMemo, useState } from "react"
import { Download, MoreHorizontal, Plus, Search, Users, X } from "lucide-react"
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
import { AccountStatusBadge } from "@/components/shared/status-badge"
import { SimpleSelect } from "@/components/shared/simple-select"
import { TablePagination, paginate } from "@/components/shared/table-pagination"
import { EmployeeDialog } from "@/components/employees/employee-dialog"
import { useEmployees } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { formatDate, normalize } from "@/lib/utils/format"
import { exportCsv } from "@/lib/utils/csv"
import type { AccountStatus, Employee } from "@/types"

const PAGE_SIZE = 10

export function EmployeesList() {
  const { can } = useAuth()
  const { data: employees, isLoading } = useEmployees()

  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<AccountStatus | "">("")
  const [position, setPosition] = useState("")
  const [page, setPage] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined)

  const positions = useMemo(
    () => Array.from(new Set((employees ?? []).map((e) => e.position).filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr")),
    [employees],
  )

  const filtered = useMemo(() => {
    const q = normalize(query)
    return (employees ?? []).filter((e) => {
      if (status && e.status !== status) return false
      if (position && e.position !== position) return false
      if (!q) return true
      const haystack = normalize([e.employeeNumber, e.lastName, e.firstName, e.position, e.phone].join(" "))
      return haystack.includes(q)
    })
  }, [employees, query, status, position])

  const rows = paginate(filtered, page, PAGE_SIZE)
  const hasFilters = !!(query || status || position)
  const canManage = can("employee.manage")

  function resetFilters() {
    setQuery("")
    setStatus("")
    setPosition("")
    setPage(1)
  }

  function openCreate() {
    setEditingEmployee(undefined)
    setDialogOpen(true)
  }

  function openEdit(employee: Employee) {
    setEditingEmployee(employee)
    setDialogOpen(true)
  }

  function handleExport() {
    exportCsv("employes.csv", filtered, [
      { header: "Matricule", value: (e) => e.employeeNumber },
      { header: "Nom", value: (e) => e.lastName },
      { header: "Prénom", value: (e) => e.firstName },
      { header: "Fonction", value: (e) => e.position },
      { header: "Téléphone", value: (e) => e.phone },
      { header: "Date d'embauche", value: (e) => e.hireDate ?? "" },
      { header: "Statut", value: (e) => (e.status === "ACTIF" ? "Actif" : "Inactif") },
    ])
  }

  return (
    <>
      <PageHeader
        title="Employés"
        description="Annuaire et gestion des agents missionnés du département."
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
              <Download data-icon="inline-start" />
              Exporter CSV
            </Button>
            {canManage && (
              <Button onClick={openCreate}>
                <Plus data-icon="inline-start" />
                Nouvel employé
              </Button>
            )}
          </>
        }
      />

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher par matricule, nom, fonction, téléphone…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            <SimpleSelect
              value={status}
              onValueChange={(v) => {
                setStatus(v as AccountStatus | "")
                setPage(1)
              }}
              placeholder="Tous les statuts"
              className="lg:w-44"
              options={[
                { value: "", label: "Tous les statuts" },
                { value: "ACTIF", label: "Actif" },
                { value: "INACTIF", label: "Inactif" },
              ]}
            />
            <SimpleSelect
              value={position}
              onValueChange={(v) => {
                setPosition(v)
                setPage(1)
              }}
              placeholder="Toutes les fonctions"
              className="lg:w-52"
              options={[
                { value: "", label: "Toutes les fonctions" },
                ...positions.map((p) => ({ value: p, label: p })),
              ]}
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X data-icon="inline-start" />
              Réinitialiser
            </Button>
          )}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Aucun employé</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Aucun résultat ne correspond à vos critères de recherche."
                  : "Aucun employé n'a encore été enregistré."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Matricule</TableHead>
                  <TableHead>Nom et prénom</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden xl:table-cell">Embauche</TableHead>
                  <TableHead>Statut</TableHead>
                  {canManage && (
                    <TableHead className="w-12 pr-4">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={canManage ? 7 : 6} className="px-4">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {rows.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className={canManage ? "cursor-pointer" : undefined}
                    onClick={() => canManage && openEdit(employee)}
                  >
                    <TableCell className="pl-4 font-mono text-xs">{employee.employeeNumber}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {employee.lastName.toUpperCase()} {employee.firstName}
                      </span>
                    </TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell className="hidden tabular-nums md:table-cell">{employee.phone}</TableCell>
                    <TableCell className="hidden tabular-nums xl:table-cell">{formatDate(employee.hireDate)}</TableCell>
                    <TableCell>
                      <AccountStatusBadge status={employee.status} />
                    </TableCell>
                    {canManage && (
                      <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions pour ${employee.lastName} ${employee.firstName}`}
                              />
                            }
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => openEdit(employee)}>Modifier</DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </div>

      <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} employee={editingEmployee} />
    </>
  )
}
