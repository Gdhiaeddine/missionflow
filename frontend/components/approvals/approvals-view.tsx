"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Check, CheckSquare, Clock, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { PageHeader, SectionCard } from "@/components/shared/page-header"
import { SimpleSelect } from "@/components/shared/simple-select"
import { TablePagination, paginate } from "@/components/shared/table-pagination"
import { useApprovals, useApproveMission, useMissions, useRejectMission, useUsers } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { formatDate, formatDateTime, normalize } from "@/lib/utils/format"
import type { ApprovalDecision, MissionWithEmployee } from "@/types"

const PAGE_SIZE = 10

const DECISION_STYLES: Record<ApprovalDecision, { label: string; cls: string }> = {
  SOUMIS: { label: "Soumis", cls: "border-warning/25 bg-warning/10 text-warning" },
  VALIDE: { label: "Validé", cls: "border-success/25 bg-success/10 text-success" },
  REFUSE: { label: "Refusé", cls: "border-destructive/25 bg-destructive/10 text-destructive" },
}

export function ApprovalsView() {
  const { can } = useAuth()
  const { data: missions, isLoading: missionsLoading } = useMissions()
  const { data: approvals = [], isLoading: approvalsLoading } = useApprovals()
  const { data: users = [] } = useUsers()
  const approveMission = useApproveMission()
  const rejectMission = useRejectMission()

  const [query, setQuery] = useState("")
  const [decisionFilter, setDecisionFilter] = useState<ApprovalDecision | "">("")
  const [page, setPage] = useState(1)

  const [decisionDialog, setDecisionDialog] = useState<{
    mission: MissionWithEmployee
    type: "approve" | "reject"
  } | null>(null)
  const [comment, setComment] = useState("")
  const [commentError, setCommentError] = useState("")

  const canApprove = can("mission.approve")

  const pendingMissions = useMemo(
    () => (missions ?? []).filter((m) => m.status === "EN_ATTENTE"),
    [missions],
  )

  const missionMap = useMemo(
    () => new Map((missions ?? []).map((m) => [m.id, m])),
    [missions],
  )
  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  )

  const filteredApprovals = useMemo(() => {
    const q = normalize(query)
    return approvals.filter((a) => {
      if (decisionFilter && a.decision !== decisionFilter) return false
      if (!q) return true
      const m = missionMap.get(a.missionId)
      const u = userMap.get(a.approverId)
      const haystack = normalize(
        [m?.reference, m?.destination, m?.employee?.lastName, m?.employee?.firstName, u?.fullName, a.comment].join(" "),
      )
      return haystack.includes(q)
    })
  }, [approvals, decisionFilter, query, missionMap, userMap])

  const rows = paginate(filteredApprovals, page, PAGE_SIZE)

  function openDecision(mission: MissionWithEmployee, type: "approve" | "reject") {
    setDecisionDialog({ mission, type })
    setComment("")
    setCommentError("")
  }

  async function handleConfirmDecision() {
    if (!decisionDialog) return
    if (decisionDialog.type === "reject" && !comment.trim()) {
      setCommentError("Le motif de refus est obligatoire.")
      return
    }
    try {
      if (decisionDialog.type === "approve") {
        await approveMission.mutateAsync({ id: decisionDialog.mission.id, comment: comment.trim() || undefined })
      } else {
        await rejectMission.mutateAsync({ id: decisionDialog.mission.id, comment: comment.trim() })
      }
      setDecisionDialog(null)
    } catch {
      // Handled by mutation toast.
    }
  }

  const busy = approveMission.isPending || rejectMission.isPending

  return (
    <>
      <PageHeader
        title="Validation des ordres"
        description="Examinez les ordres de mission en attente et consultez l'historique des décisions."
      />

      <SectionCard
        title={`En attente de validation (${pendingMissions.length})`}
        description="Ordres soumis nécessitant une décision"
        contentClassName="p-0"
      >
        {!missionsLoading && pendingMissions.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckSquare />
              </EmptyMedia>
              <EmptyTitle>Aucun ordre en attente</EmptyTitle>
              <EmptyDescription>Tous les ordres de mission soumis ont été traités.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Référence</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead className="hidden md:table-cell">Se rendre à</TableHead>
                <TableHead className="hidden lg:table-cell">Motif</TableHead>
                <TableHead className="hidden xl:table-cell">Date de création</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missionsLoading &&
                Array.from({ length: 3 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="px-5">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {pendingMissions.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="pl-5 font-mono text-xs">
                    <Link href={`/missions/${m.id}`} className="hover:underline">
                      {m.reference}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {m.employee?.lastName} {m.employee?.firstName}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.employeePosition || m.employee?.position}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{m.destination}</TableCell>
                  <TableCell className="hidden max-w-xs truncate lg:table-cell">{m.subject}</TableCell>
                  <TableCell className="hidden tabular-nums xl:table-cell">{formatDate(m.createdAt)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" render={<Link href={`/missions/${m.id}`} />}>
                        Détails
                      </Button>
                      {canApprove && (
                        <>
                          <Button size="sm" onClick={() => openDecision(m, "approve")}>
                            <Check data-icon="inline-start" />
                            Valider
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDecision(m, "reject")}>
                            <X data-icon="inline-start" />
                            Refuser
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher dans l'historique (référence, employé, valideur, commentaire)…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
          <SimpleSelect
            value={decisionFilter}
            onValueChange={(v) => {
              setDecisionFilter(v as ApprovalDecision | "")
              setPage(1)
            }}
            placeholder="Toutes les décisions"
            className="lg:w-52"
            options={[
              { value: "", label: "Toutes les décisions" },
              { value: "SOUMIS", label: "Soumis" },
              { value: "VALIDE", label: "Validé" },
              { value: "REFUSE", label: "Refusé" },
            ]}
          />
          {(query || decisionFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("")
                setDecisionFilter("")
                setPage(1)
              }}
            >
              <X data-icon="inline-start" />
              Réinitialiser
            </Button>
          )}
        </div>

        {!approvalsLoading && filteredApprovals.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyTitle>Aucune décision</EmptyTitle>
              <EmptyDescription>Aucun événement de validation ne correspond aux critères.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead>Ordre de mission</TableHead>
                  <TableHead>Décision</TableHead>
                  <TableHead className="hidden md:table-cell">Intervenant</TableHead>
                  <TableHead className="hidden lg:table-cell">Version</TableHead>
                  <TableHead className="pr-4">Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalsLoading &&
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="px-4">
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {rows.map((a) => {
                  const mission = missionMap.get(a.missionId)
                  const actor = userMap.get(a.approverId)
                  const badge = DECISION_STYLES[a.decision]
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="pl-4 tabular-nums text-xs">{formatDateTime(a.decidedAt)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {mission ? (
                          <Link href={`/missions/${mission.id}`} className="hover:underline">
                            {mission.reference}
                          </Link>
                        ) : (
                          a.missionId
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex h-5 items-center rounded-md border px-1.5 text-xs font-medium ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{actor?.fullName ?? "—"}</TableCell>
                      <TableCell className="hidden font-mono text-xs lg:table-cell">v{a.version}</TableCell>
                      <TableCell className="max-w-xs truncate pr-4 text-muted-foreground">
                        {a.comment || "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={filteredApprovals.length} onPageChange={setPage} />
          </>
        )}
      </div>

      <Dialog open={!!decisionDialog} onOpenChange={(open) => !open && setDecisionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionDialog?.type === "approve"
                ? `Valider ${decisionDialog.mission.reference}`
                : `Refuser ${decisionDialog?.mission.reference}`}
            </DialogTitle>
            <DialogDescription>
              {decisionDialog?.type === "approve"
                ? "L'ordre de mission sera validé et pourra être imprimé."
                : "Veuillez indiquer le motif du refus. L'agent pourra corriger et soumettre à nouveau l'ordre."}
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!commentError || undefined}>
            <FieldLabel htmlFor="decisionComment">
              {decisionDialog?.type === "approve" ? "Commentaire (optionnel)" : "Motif du refus *"}
            </FieldLabel>
            <Textarea
              id="decisionComment"
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setCommentError("")
              }}
              aria-invalid={!!commentError}
              placeholder={
                decisionDialog?.type === "approve" ? "Observations éventuelles…" : "Précisez la raison du refus…"
              }
            />
            <FieldError errors={commentError ? [{ message: commentError }] : []} />
          </Field>
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setDecisionDialog(null)}>
              Annuler
            </Button>
            <Button
              variant={decisionDialog?.type === "reject" ? "destructive" : "default"}
              disabled={busy}
              onClick={handleConfirmDecision}
            >
              {busy && <Spinner data-icon="inline-start" />}
              {decisionDialog?.type === "approve" ? "Confirmer la validation" : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
