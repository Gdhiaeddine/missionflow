"use client"

import Link from "next/link"
import { useMemo } from "react"
import { ArrowRight, CheckCircle2, Clock, FileText, Plus, Printer, XCircle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import { format, parseISO, startOfMonth, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PageHeader, SectionCard } from "@/components/shared/page-header"
import { MissionStatusBadge } from "@/components/shared/status-badge"
import { useAuth } from "@/providers/auth-provider"
import { useMissions, usePrintHistory } from "@/hooks/use-data"
import { MISSION_STATUS_LABELS, MISSION_STATUSES } from "@/lib/constants"
import { formatDate, formatDateTime } from "@/lib/utils/format"
import type { MissionStatus } from "@/types"

const STATUS_COLORS: Record<MissionStatus, string> = {
  BROUILLON: "var(--color-muted-foreground)",
  EN_ATTENTE: "var(--color-warning)",
  VALIDE: "var(--color-success)",
  REFUSE: "var(--color-destructive)",
  ANNULE: "#94a3b8",
}

const monthlyConfig = {
  total: { label: "Ordres créés", color: "var(--color-primary)" },
  valide: { label: "Validés", color: "var(--color-navy)" },
} satisfies ChartConfig

const statusConfig = Object.fromEntries(
  MISSION_STATUSES.map((s) => [s, { label: MISSION_STATUS_LABELS[s], color: STATUS_COLORS[s] }]),
) satisfies ChartConfig

export function DashboardView() {
  const { user, can } = useAuth()
  const { data: missions, isLoading } = useMissions()
  const { data: prints = [] } = usePrintHistory()

  const stats = useMemo(() => {
    const list = missions ?? []
    const count = (s: MissionStatus) => list.filter((m) => m.status === s).length
    const thisMonth = startOfMonth(new Date())
    return {
      total: list.length,
      pending: count("EN_ATTENTE"),
      validated: count("VALIDE"),
      rejected: count("REFUSE"),
      drafts: count("BROUILLON"),
      printsThisMonth: prints.filter((p) => p.status === "IMPRESSION_LANCEE" && parseISO(p.initiatedAt) >= thisMonth)
        .length,
    }
  }, [missions, prints])

  const monthly = useMemo(() => {
    const list = missions ?? []
    return Array.from({ length: 6 }, (_, i) => {
      const month = startOfMonth(subMonths(new Date(), 5 - i))
      const key = format(month, "yyyy-MM")
      const inMonth = list.filter((m) => m.createdAt.slice(0, 7) === key)
      return {
        month: format(month, "MMM", { locale: fr }),
        total: inMonth.length,
        valide: inMonth.filter((m) => m.status === "VALIDE").length,
      }
    })
  }, [missions])

  const byStatus = useMemo(
    () =>
      MISSION_STATUSES.map((status) => ({
        status,
        value: (missions ?? []).filter((m) => m.status === status).length,
      })).filter((d) => d.value > 0),
    [missions],
  )

  const recent = (missions ?? []).slice(0, 6)
  const pending = (missions ?? []).filter((m) => m.status === "EN_ATTENTE").slice(0, 5)

  return (
    <>
      <PageHeader
        title={`Bonjour, ${user?.fullName ?? ""}`}
        description="Vue d'ensemble de l'activité des ordres de mission du département."
        actions={
          can("mission.create") && (
            <Button render={<Link href="/missions/new" />}>
              <Plus data-icon="inline-start" />
              Nouvel ordre de mission
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total des ordres" value={stats.total} icon={FileText} loading={isLoading} href="/missions" />
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={Clock}
          tone="warning"
          loading={isLoading}
          href="/missions?status=EN_ATTENTE"
        />
        <StatCard
          label="Validés"
          value={stats.validated}
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
          href="/missions?status=VALIDE"
        />
        <StatCard
          label="Refusés"
          value={stats.rejected}
          icon={XCircle}
          tone="destructive"
          loading={isLoading}
          href="/missions?status=REFUSE"
        />
        <StatCard
          label="Impressions ce mois"
          value={stats.printsThisMonth}
          icon={Printer}
          loading={isLoading}
          href={can("printHistory.view") ? "/print-history" : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Activité des 6 derniers mois"
          description="Ordres de mission créés et validés par mois"
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

        <SectionCard title="Répartition par statut" description="Ensemble des ordres de mission">
          <ChartContainer config={statusConfig} className="mx-auto h-44 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
              <Pie data={byStatus} dataKey="value" nameKey="status" innerRadius={48} outerRadius={72} strokeWidth={2}>
                {byStatus.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {MISSION_STATUSES.map((status) => (
              <li key={status} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: STATUS_COLORS[status] }} />
                  {MISSION_STATUS_LABELS[status]}
                </span>
                <span className="font-medium tabular-nums">
                  {(missions ?? []).filter((m) => m.status === status).length}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          title="Ordres récents"
          description="Dernières créations et mises à jour"
          className="lg:col-span-2"
          contentClassName="p-0"
          actions={
            <Button variant="ghost" size="sm" render={<Link href="/missions" />}>
              Tout voir
              <ArrowRight data-icon="inline-end" />
            </Button>
          }
        >
          <ul className="divide-y">
            {isLoading &&
              Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="px-5 py-3">
                  <Skeleton className="h-9 w-full" />
                </li>
              ))}
            {recent.map((mission) => (
              <li key={mission.id}>
                <Link
                  href={`/missions/${mission.id}`}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{mission.reference}</span>
                    </div>
                    <span className="truncate text-sm font-medium">
                      {mission.employee?.lastName} {mission.employee?.firstName} — {mission.destination}
                    </span>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {formatDate(mission.departureDate)}
                  </span>
                  <MissionStatusBadge status={mission.status} />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="En attente de validation"
          description={`${stats.pending} ordre(s) à traiter`}
          contentClassName="p-0"
          actions={
            can("approval.view") && (
              <Button variant="ghost" size="sm" render={<Link href="/approvals" />}>
                Valider
                <ArrowRight data-icon="inline-end" />
              </Button>
            )
          }
        >
          {pending.length === 0 && !isLoading ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">Aucun ordre en attente.</p>
          ) : (
            <ul className="divide-y">
              {pending.map((mission) => (
                <li key={mission.id}>
                  <Link
                    href={`/missions/${mission.id}`}
                    className="flex flex-col gap-0.5 px-5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="truncate text-sm font-medium">
                      {mission.employee?.lastName} {mission.employee?.firstName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {mission.reference} · {mission.destination} · {formatDateTime(mission.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
  href,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone?: "warning" | "success" | "destructive"
  loading?: boolean
  href?: string
}) {
  const toneClass = {
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
  }
  const content = (
    <div className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={`flex size-7 items-center justify-center rounded-md ${tone ? toneClass[tone] : "bg-primary/10 text-primary"}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      )}
    </div>
  )
  return href ? (
    <Link href={href} className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {content}
    </Link>
  ) : (
    content
  )
}
