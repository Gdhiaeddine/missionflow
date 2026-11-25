"use client"

import { useMemo } from "react"
import { CheckCircle2, Download, FileText, Printer, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { format, startOfMonth, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader, SectionCard } from "@/components/shared/page-header"
import { useEmployees, useMissions, usePrintHistory } from "@/hooks/use-data"
import { MISSION_TYPE_LABELS, MISSION_TYPES, TRANSPORTATION_LABELS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils/format"
import { exportCsv } from "@/lib/utils/csv"
import type { MissionType } from "@/types"

const TYPE_COLORS: Record<MissionType, string> = {
  LIVRAISON: "var(--color-primary)",
  ENLEVEMENT: "var(--color-navy)",
  ACCOMPAGNEMENT: "var(--color-success)",
  CONTROLE: "var(--color-warning)",
  FORMATION: "#0ea5e9",
  REUNION: "#8b5cf6",
  AUTRE: "var(--color-muted-foreground)",
}

const monthlyConfig = {
  total: { label: "Ordres créés", color: "var(--color-primary)" },
  valide: { label: "Validés", color: "var(--color-navy)" },
} satisfies ChartConfig

const typeConfig = Object.fromEntries(
  MISSION_TYPES.map((t) => [t, { label: MISSION_TYPE_LABELS[t], color: TYPE_COLORS[t] }]),
) satisfies ChartConfig

export function ReportsView() {
  const { data: missions = [], isLoading } = useMissions()
  const { data: employees = [] } = useEmployees()
  const { data: prints = [] } = usePrintHistory()

  const summary = useMemo(() => {
    const total = missions.length
    const validated = missions.filter((m) => m.status === "VALIDE").length
    const rate = total ? Math.round((validated / total) * 100) : 0
    const expenses = missions.reduce((sum, m) => sum + (m.estimatedExpenses ?? 0), 0)
    const printCount = prints.filter((p) => p.status === "IMPRESSION_LANCEE").length
    return { total, validated, rate, expenses, printCount }
  }, [missions, prints])

  const monthly = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const month = startOfMonth(subMonths(new Date(), 5 - i))
      const key = format(month, "yyyy-MM")
      const inMonth = missions.filter((m) => m.createdAt.slice(0, 7) === key)
      return {
        month: format(month, "MMM yy", { locale: fr }),
        total: inMonth.length,
        valide: inMonth.filter((m) => m.status === "VALIDE").length,
      }
    })
  }, [missions])

  const byType = useMemo(
    () =>
      MISSION_TYPES.map((type) => ({
        type,
        value: missions.filter((m) => m.missionType === type).length,
      })).filter((d) => d.value > 0),
    [missions],
  )

  const topDestinations = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of missions) {
      if (!m.destination) continue
      counts.set(m.destination, (counts.get(m.destination) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [missions])

  const topEmployees = useMemo(() => {
    const empMap = new Map(employees.map((e) => [e.id, e]))
    const counts = new Map<string, number>()
    for (const m of missions) {
      counts.set(m.employeeId, (counts.get(m.employeeId) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({ employee: empMap.get(id), id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [missions, employees])

  function handleExport() {
    exportCsv("rapport-missions.csv", missions, [
      { header: "Référence", value: (m) => m.reference },
      { header: "Employé", value: (m) => (m.employee ? `${m.employee.lastName} ${m.employee.firstName}` : "") },
      { header: "Type", value: (m) => MISSION_TYPE_LABELS[m.missionType] },
      { header: "Région", value: (m) => m.destination },
      { header: "Transport", value: (m) => TRANSPORTATION_LABELS[m.transportation] },
      { header: "Frais estimés", value: (m) => m.estimatedExpenses ?? 0 },
      { header: "Statut", value: (m) => m.status },
      { header: "Date création", value: (m) => m.createdAt.slice(0, 10) },
    ])
  }

  return (
    <>
      <PageHeader
        title="Rapports et statistiques"
        description="Analyse de l'activité des ordres de mission, des destinations et des coûts."
        actions={
          <Button variant="outline" onClick={handleExport} disabled={missions.length === 0}>
            <Download data-icon="inline-start" />
            Exporter CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Total des ordres" value={String(summary.total)} icon={FileText} loading={isLoading} />
        <KpiCard
          label="Taux de validation"
          value={`${summary.rate}%`}
          sub={`${summary.validated} validés`}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <KpiCard
          label="Frais estimés cumulés"
          value={formatCurrency(summary.expenses)}
          icon={Wallet}
          loading={isLoading}
        />
        <KpiCard label="Impressions lancées" value={String(summary.printCount)} icon={Printer} loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Évolution mensuelle"
          description="Ordres créés et validés sur les 6 derniers mois"
          className="lg:col-span-2"
        >
          <ChartContainer config={monthlyConfig} className="h-64 w-full">
            <BarChart data={monthly} margin={{ left: -20, right: 4, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="valide" fill="var(--color-valide)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </SectionCard>

        <SectionCard title="Répartition par type" description="Nature des missions">
          <ChartContainer config={typeConfig} className="mx-auto h-44 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="type" hideLabel />} />
              <Pie data={byType} dataKey="value" nameKey="type" innerRadius={48} outerRadius={72} strokeWidth={2}>
                {byType.map((entry) => (
                  <Cell key={entry.type} fill={TYPE_COLORS[entry.type]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
            {byType.map((entry) => (
              <div key={entry.type} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[entry.type] }} />
                <span className="text-muted-foreground">{MISSION_TYPE_LABELS[entry.type]}</span>
                <span className="font-medium tabular-nums">{entry.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Principales régions desservies" description="Classement par nombre de missions" contentClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Région (Se rendre à)</TableHead>
                <TableHead className="pr-5 text-right">Missions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDestinations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-sm text-muted-foreground">
                    Aucune donnée disponible.
                  </TableCell>
                </TableRow>
              ) : (
                topDestinations.map((row) => (
                  <TableRow key={row.destination}>
                    <TableCell className="pl-5 font-medium">{row.destination}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Agents les plus mobilisés" description="Classement par nombre d'ordres" contentClassName="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Employé</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead className="pr-5 text-right">Missions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                    Aucune donnée disponible.
                  </TableCell>
                </TableRow>
              ) : (
                topEmployees.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-5 font-medium">
                      {row.employee ? `${row.employee.lastName} ${row.employee.firstName}` : row.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.employee?.position ?? "—"}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SectionCard>
      </div>
    </>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <Icon className="size-4" />
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
        </div>
      )}
    </div>
  )
}
