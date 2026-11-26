"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Download, FileSearch, MoreHorizontal, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { MissionStatusBadge } from "@/components/shared/status-badge"
import { SimpleSelect } from "@/components/shared/simple-select"
import { TablePagination, paginate } from "@/components/shared/table-pagination"
import { useMissions } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { getMissionActions } from "@/lib/permissions"
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUSES,
  MISSION_TYPE_LABELS,
  TRANSPORTATION_LABELS,
} from "@/lib/constants"
import { computeDuration, formatDate, normalize, pluralDays } from "@/lib/utils/format"
import { exportCsv } from "@/lib/utils/csv"
import type { MissionStatus } from "@/types"

const PAGE_SIZE = 10

export function MissionsList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, can } = useAuth()
  const { data: missions, isLoading } = useMissions()

  const status = (searchParams.get("status") ?? "") as MissionStatus | ""
  const [query, setQuery] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [destination, setDestination] = useState("")
  const [page, setPage] = useState(1)

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set("status", value)
    else params.delete("status")
    setPage(1)
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`)
  }

  const destinations = useMemo(
    () => Array.from(new Set((missions ?? []).map((m) => m.destination))).sort(),
    [missions],
  )

  const filtered = useMemo(() => {
    const q = normalize(query)
    return (missions ?? []).filter((m) => {
      if (status && m.status !== status) return false
      if (destination && m.destination !== destination) return false
      if (from && m.departureDate < from) return false
      if (to && m.departureDate > to) return false
      if (!q) return true
      const haystack = normalize(
        [
          m.reference,
          m.employee?.firstName,
          m.employee?.lastName,
          m.employee?.employeeNumber,
          m.destination,
          m.subject,
        ].join(" "),
      )
      return haystack.includes(q)
    })
  }, [missions, status, destination, from, to, query])

  const rows = paginate(filtered, page, PAGE_SIZE)
  const hasFilters = !!(status || query || from || to || destination)

  function resetFilters() {
    setQuery("")
    setFrom("")
    setTo("")
    setDestination("")
    setStatus("")
  }

  function handleExport() {
    exportCsv(`ordres-de-mission-${new Date().toISOString().slice(0, 10)}`, filtered, [
      { header: "Référence", value: (m) => m.reference },
      { header: "Matricule", value: (m) => m.employee?.employeeNumber },
      { header: "Nom", value: (m) => m.employee?.lastName },
      { header: "Prénom", value: (m) => m.employee?.firstName },
      { header: "Fonction", value: (m) => m.employee?.position },
      { header: "Type", value: (m) => MISSION_TYPE_LABELS[m.missionType] },
      { header: "Objet", value: (m) => m.subject },
      { header: "Départ", value: (m) => m.departureLocation },
      { header: "Destination", value: (m) => m.destination },
      { header: "Date de départ", value: (m) => formatDate(m.departureDate) },
      { header: "Date de retour", value: (m) => formatDate(m.returnDate) },
      {
        header: "Durée (jours)",
        value: (m) => computeDuration(m.departureDate, m.departureTime, m.returnDate, m.returnTime).days,
      },
      { header: "Transport", value: (m) => TRANSPORTATION_LABELS[m.transportation] },
      { header: "Statut", value: (m) => MISSION_STATUS_LABELS[m.status] },
    ])
  }

  return (
    <>
      <PageHeader
        title={status ? `Ordres de mission — ${MISSION_STATUS_LABELS[status]}` : "Ordres de mission"}
        description="Recherchez, filtrez et gérez l'ensemble des ordres de mission du département."
        actions={
          <>
            <Button variant="outline" onClick={handleExport} disabled={!filtered.length}>
              <Download data-icon="inline-start" />
              Exporter CSV
            </Button>
            {can("mission.create") && (
              <Button render={<Link href="/missions/new" />}>
                <Plus data-icon="inline-start" />
                Nouvel ordre
              </Button>
            )}
          </>
        }
      />

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <InputGroup className="lg:max-w-xs">
            <InputGroupInput
              placeholder="Référence, employé, matricule…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              aria-label="Rechercher un ordre de mission"
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-1">
            <SimpleSelect
              aria-label="Filtrer par statut"
              value={status}
              onValueChange={setStatus}
              placeholder="Tous les statuts"
              options={[
                { value: "", label: "Tous les statuts" },
                ...MISSION_STATUSES.map((s) => ({ value: s, label: MISSION_STATUS_LABELS[s] })),
              ]}
              className="lg:w-44"
            />
            <SimpleSelect
              aria-label="Filtrer par destination"
              value={destination}
              onValueChange={(v) => {
                setDestination(v)
                setPage(1)
              }}
              placeholder="Toutes destinations"
              options={[{ value: "", label: "Toutes destinations" }, ...destinations.map((d) => ({ value: d, label: d }))]}
              className="lg:w-44"
            />
            <Input
              type="date"
              aria-label="Départ à partir du"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              className="lg:w-40"
            />
            <Input
              type="date"
              aria-label="Départ jusqu'au"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              className="lg:w-40"
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
                <FileSearch />
              </EmptyMedia>
              <EmptyTitle>Aucun ordre de mission</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Aucun résultat ne correspond à vos critères de recherche."
                  : "Aucun ordre de mission n'a encore été créé."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Référence</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead className="hidden md:table-cell">Destination</TableHead>
                  <TableHead className="hidden lg:table-cell">Départ</TableHead>
                  <TableHead className="hidden lg:table-cell">Retour</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-4">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {rows.map((mission) => {
                  const actions = getMissionActions(user?.role, mission)
                  const duration = computeDuration(
                    mission.departureDate,
                    mission.departureTime,
                    mission.returnDate,
                    mission.returnTime,
                  )
                  return (
                    <TableRow key={mission.id} className="cursor-pointer" onClick={() => router.push(`/missions/${mission.id}`)}>
                      <TableCell className="pl-4 font-mono text-xs">
                        <Link
                          href={`/missions/${mission.id}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {mission.reference}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {mission.employee?.lastName} {mission.employee?.firstName}
                          </span>
                          <span className="text-xs text-muted-foreground">{mission.employee?.position}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{mission.destination}</TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">{formatDate(mission.departureDate)}</TableCell>
                      <TableCell className="hidden tabular-nums lg:table-cell">{formatDate(mission.returnDate)}</TableCell>
                      <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${mission.reference}`} />}
                          >
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => router.push(`/missions/${mission.id}`)}>
                                Voir le détail
                              </DropdownMenuItem>
                              {actions.edit && (
                                <DropdownMenuItem onClick={() => router.push(`/missions/${mission.id}/edit`)}>
                                  Modifier
                                </DropdownMenuItem>
                              )}
                              {(actions.generate || actions.print) && (
                                <DropdownMenuItem onClick={() => router.push(`/missions/${mission.id}/document`)}>
                                  Document officiel
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
    </>
  )
}
