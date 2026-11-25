"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Download, Printer, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { PageHeader } from "@/components/shared/page-header"
import { PrintActionBadge } from "@/components/shared/status-badge"
import { SimpleSelect } from "@/components/shared/simple-select"
import { TablePagination, paginate } from "@/components/shared/table-pagination"
import { useMissions, usePrintHistory, useUsers } from "@/hooks/use-data"
import { PRINT_ACTION_LABELS } from "@/lib/constants"
import { formatDateTime, normalize } from "@/lib/utils/format"
import { exportCsv } from "@/lib/utils/csv"
import type { PrintAction } from "@/types"

const PAGE_SIZE = 10

export function PrintHistoryView() {
  const { data: prints = [], isLoading } = usePrintHistory()
  const { data: missions = [] } = useMissions()
  const { data: users = [] } = useUsers()

  const [query, setQuery] = useState("")
  const [action, setAction] = useState<PrintAction | "">("")
  const [page, setPage] = useState(1)

  const missionMap = useMemo(() => new Map(missions.map((m) => [m.id, m])), [missions])
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])

  const filtered = useMemo(() => {
    const q = normalize(query)
    return prints.filter((p) => {
      if (action && p.status !== action) return false
      if (!q) return true
      const m = missionMap.get(p.missionId)
      const u = userMap.get(p.printedBy)
      const haystack = normalize(
        [m?.reference, m?.employee?.lastName, m?.employee?.firstName, m?.destination, u?.fullName].join(" "),
      )
      return haystack.includes(q)
    })
  }, [prints, action, query, missionMap, userMap])

  const rows = paginate(filtered, page, PAGE_SIZE)
  const hasFilters = !!(query || action)

  function handleExport() {
    exportCsv("historique-impressions.csv", filtered, [
      { header: "Date", value: (p) => formatDateTime(p.initiatedAt) },
      { header: "Référence", value: (p) => missionMap.get(p.missionId)?.reference ?? p.missionId },
      { header: "Version", value: (p) => `v${p.documentVersion}` },
      { header: "Action", value: (p) => PRINT_ACTION_LABELS[p.status] },
      { header: "Effectué par", value: (p) => userMap.get(p.printedBy)?.fullName ?? "—" },
    ])
  }

  return (
    <>
      <PageHeader
        title="Historique d'impression"
        description="Traçabilité des générations, téléchargements et impressions de documents officiels."
        actions={
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
            <Download data-icon="inline-start" />
            Exporter CSV
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
              placeholder="Rechercher par référence, employé, destination, utilisateur…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
          <SimpleSelect
            value={action}
            onValueChange={(v) => {
              setAction(v as PrintAction | "")
              setPage(1)
            }}
            placeholder="Toutes les actions"
            className="lg:w-52"
            options={[
              { value: "", label: "Toutes les actions" },
              ...(Object.keys(PRINT_ACTION_LABELS) as PrintAction[]).map((k) => ({
                value: k,
                label: PRINT_ACTION_LABELS[k],
              })),
            ]}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("")
                setAction("")
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
                <Printer />
              </EmptyMedia>
              <EmptyTitle>Aucun événement d&apos;impression</EmptyTitle>
              <EmptyDescription>
                {hasFilters
                  ? "Aucun résultat ne correspond à vos critères de recherche."
                  : "Aucun document n'a encore été généré ou imprimé."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date et heure</TableHead>
                  <TableHead>Ordre de mission</TableHead>
                  <TableHead className="hidden md:table-cell">Employé</TableHead>
                  <TableHead className="hidden lg:table-cell">Version</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="pr-4">Effectué par</TableHead>
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
                {rows.map((item) => {
                  const mission = missionMap.get(item.missionId)
                  const actor = userMap.get(item.printedBy)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="pl-4 tabular-nums text-xs">{formatDateTime(item.initiatedAt)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {mission ? (
                          <Link href={`/missions/${mission.id}`} className="hover:underline">
                            {mission.reference}
                          </Link>
                        ) : (
                          item.missionId
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {mission?.employee ? `${mission.employee.lastName} ${mission.employee.firstName}` : "—"}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs lg:table-cell">v{item.documentVersion}</TableCell>
                      <TableCell>
                        <PrintActionBadge action={item.status} />
                      </TableCell>
                      <TableCell className="pr-4">{actor?.fullName ?? "—"}</TableCell>
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
