import { cn } from "@/lib/utils"
import { MISSION_STATUS_LABELS, PRINT_ACTION_LABELS, ROLE_LABELS } from "@/lib/constants"
import type { AccountStatus, MissionStatus, PrintAction, Role } from "@/types"

const base =
  "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md border px-1.5 text-xs font-medium whitespace-nowrap"

const MISSION_STYLES: Record<MissionStatus, { box: string; dot: string }> = {
  BROUILLON: { box: "border-border bg-muted text-muted-foreground", dot: "bg-muted-foreground/60" },
  EN_ATTENTE: { box: "border-warning/25 bg-warning/10 text-warning", dot: "bg-warning" },
  VALIDE: { box: "border-success/25 bg-success/10 text-success", dot: "bg-success" },
  REFUSE: { box: "border-destructive/25 bg-destructive/10 text-destructive", dot: "bg-destructive" },
  ANNULE: { box: "border-slate-300 bg-slate-100 text-slate-600", dot: "bg-slate-500" },
}

export function MissionStatusBadge({ status, className }: { status: MissionStatus; className?: string }) {
  const style = MISSION_STYLES[status]
  return (
    <span className={cn(base, style.box, className)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", style.dot)} />
      {MISSION_STATUS_LABELS[status]}
    </span>
  )
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const active = status === "ACTIF"
  return (
    <span
      className={cn(
        base,
        active ? "border-success/25 bg-success/10 text-success" : "border-border bg-muted text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground/60")} />
      {active ? "Actif" : "Inactif"}
    </span>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    ADMIN: "border-navy/20 bg-navy/5 text-navy",
    AGENT_EXPEDITION: "border-primary/20 bg-primary/5 text-primary",
    RESPONSABLE: "border-warning/25 bg-warning/10 text-warning",
    LECTURE_SEULE: "border-border bg-muted text-muted-foreground",
  }
  return <span className={cn(base, styles[role])}>{ROLE_LABELS[role]}</span>
}

export function PrintActionBadge({ action }: { action: PrintAction }) {
  const styles: Record<PrintAction, string> = {
    GENERE: "border-border bg-muted text-foreground",
    TELECHARGE: "border-primary/20 bg-primary/5 text-primary",
    IMPRESSION_LANCEE: "border-navy/20 bg-navy/5 text-navy",
  }
  return <span className={cn(base, styles[action])}>{PRINT_ACTION_LABELS[action]}</span>
}
