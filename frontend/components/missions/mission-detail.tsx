"use client"

import Link from "next/link"
import { useState } from "react"
import { Ban, Check, Edit, FileText, Printer, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { MissionStatusBadge, PrintActionBadge } from "@/components/shared/status-badge"
import { MissionDocument } from "@/components/missions/mission-document"
import { MissionNotFound, MissionPageSkeleton } from "@/components/missions/mission-states"
import {
  useApproveMission,
  useCancelMission,
  useMission,
  useRecordDocumentEvent,
  useRejectMission,
  useSettings,
  useSubmitMission,
  useUsers,
} from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { getMissionActions } from "@/lib/permissions"
import {
  AUDIT_ACTION_LABELS,
  MISSION_TYPE_LABELS,
  TRANSPORTATION_LABELS,
} from "@/lib/constants"
import { computeDuration, formatCurrency, formatDate, formatDateTime, pluralDays } from "@/lib/utils/format"

export function MissionDetailView({ id }: { id: string }) {
  const { user } = useAuth()
  const { data, isLoading, error } = useMission(id)
  const { data: settings } = useSettings()
  const { data: users = [] } = useUsers()

  const submitMission = useSubmitMission()
  const approveMission = useApproveMission()
  const rejectMission = useRejectMission()
  const cancelMission = useCancelMission()
  const recordDoc = useRecordDocumentEvent()

  const [dialog, setDialog] = useState<"approve" | "reject" | "cancel" | null>(null)
  const [comment, setComment] = useState("")
  const [commentError, setCommentError] = useState("")

  if (isLoading) return <MissionPageSkeleton />
  if (error || !data) return <MissionNotFound />

  const { mission, employee, approvals, printHistory, auditLogs } = data
  const actions = getMissionActions(user?.role, mission)
  const duration = computeDuration(
    mission.departureDate,
    mission.departureTime,
    mission.returnDate,
    mission.returnTime,
  )
  const userMap = new Map(users.map((u) => [u.id, u]))
  const approver = mission.approverId ? userMap.get(mission.approverId) : undefined

  function openDialog(type: "approve" | "reject" | "cancel") {
    setDialog(type)
    setComment("")
    setCommentError("")
  }

  async function handleDialogConfirm() {
    if (!dialog) return
    if ((dialog === "reject" || dialog === "cancel") && !comment.trim()) {
      setCommentError("Ce champ est obligatoire.")
      return
    }
    try {
      if (dialog === "approve") {
        await approveMission.mutateAsync({ id: mission.id, comment: comment.trim() || undefined })
      } else if (dialog === "reject") {
        await rejectMission.mutateAsync({ id: mission.id, comment: comment.trim() })
      } else {
        await cancelMission.mutateAsync({ id: mission.id, reason: comment.trim() })
      }
      setDialog(null)
    } catch {
      // Handled by mutation toast.
    }
  }

  function handlePrint() {
    if (actions.print) {
      recordDoc.mutate({ missionId: mission.id, action: "IMPRESSION_LANCEE" })
    }
    window.print()
  }

  const busy =
    submitMission.isPending ||
    approveMission.isPending ||
    rejectMission.isPending ||
    cancelMission.isPending

  return (
    <>
      <div className="no-print">
        <PageHeader
          title={`Ordre de mission ${mission.reference}`}
          description={`Créé le ${formatDate(mission.createdAt)} · Version ${mission.version}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <MissionStatusBadge status={mission.status} />
              {actions.edit && (
                <Button variant="outline" render={<Link href={`/missions/${mission.id}/edit`} />}>
                  <Edit data-icon="inline-start" />
                  Modifier
                </Button>
              )}
              {actions.submit && (
                <Button disabled={busy} onClick={() => submitMission.mutate(mission.id)}>
                  {submitMission.isPending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" />}
                  Soumettre
                </Button>
              )}
              {actions.approve && (
                <Button disabled={busy} onClick={() => openDialog("approve")}>
                  <Check data-icon="inline-start" />
                  Valider
                </Button>
              )}
              {actions.reject && (
                <Button variant="destructive" disabled={busy} onClick={() => openDialog("reject")}>
                  <X data-icon="inline-start" />
                  Refuser
                </Button>
              )}
              {actions.cancel && (
                <Button variant="outline" disabled={busy} onClick={() => openDialog("cancel")}>
                  <Ban data-icon="inline-start" />
                  Annuler
                </Button>
              )}
              {actions.print && (
                <Button variant="outline" onClick={handlePrint}>
                  <Printer data-icon="inline-start" />
                  Imprimer
                </Button>
              )}
            </div>
          }
        />
      </div>

      <Tabs defaultValue="details" className="no-print w-full">
        <TabsList className="no-print">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="document">
            <FileText data-icon="inline-start" />
            Document officiel
          </TabsTrigger>
          <TabsTrigger value="history">Historique ({approvals.length + printHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Agent missionné">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem
                label="Nom et prénom"
                value={employee ? `${employee.lastName.toUpperCase()} ${employee.firstName}` : "—"}
              />
              <InfoItem label="Matricule" value={employee?.employeeNumber ?? "—"} />
              <InfoItem label="Fonction" value={mission.employeePosition || employee?.position || "—"} />
              <InfoItem label="Service d'affectation" value={mission.serviceAssignment || "—"} />
            </dl>
          </SectionCard>

          <SectionCard title="Informations générales">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="N° d'ordre" value={mission.reference} />
              <InfoItem label="Date de création" value={formatDate(mission.createdAt)} />
              <InfoItem label="Type de mission" value={MISSION_TYPE_LABELS[mission.missionType]} />
              <InfoItem label="Motif de déplacement" value={mission.subject} />
              {mission.description && <InfoItem label="Description" value={mission.description} full />}
            </dl>
          </SectionCard>

          <SectionCard title="Itinéraire et dates">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Lieu de départ" value={mission.departureLocation} />
              <InfoItem label="Région (Se rendre à)" value={mission.destination} />
              {mission.destinationAddress && <InfoItem label="Adresse" value={mission.destinationAddress} full />}
              <InfoItem
                label="Date de départ"
                value={
                  mission.departureDate
                    ? `${formatDate(mission.departureDate)}${mission.departureTime ? ` à ${mission.departureTime}` : ""}`
                    : "—"
                }
              />
              <InfoItem
                label="Date d'arrivée"
                value={
                  mission.returnDate
                    ? `${formatDate(mission.returnDate)}${mission.returnTime ? ` à ${mission.returnTime}` : ""}`
                    : "—"
                }
              />
              <InfoItem label="Durée" value={duration.valid ? `${pluralDays(duration.days)} (${duration.label})` : "—"} />
            </dl>
          </SectionCard>

          <SectionCard title="Moyen de transport et frais">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <InfoItem label="Transport" value={TRANSPORTATION_LABELS[mission.transportation]} />
              <InfoItem label="Type de véhicule" value={mission.vehicleName || "—"} />
              <InfoItem label="Immatriculation" value={mission.vehicleRegistration || "—"} />
              <InfoItem
                label="Frais estimés"
                value={mission.estimatedExpenses !== undefined ? formatCurrency(mission.estimatedExpenses) : "—"}
              />
              {mission.instructions && <InfoItem label="Instructions" value={mission.instructions} full />}
              {mission.observations && <InfoItem label="Observations" value={mission.observations} full />}
              {mission.rejectionReason && <InfoItem label="Motif du refus" value={mission.rejectionReason} full />}
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="document" className="mt-4">
          {settings && (
            <MissionDocument
              mission={mission}
              employee={employee}
              settings={settings}
              approverName={approver?.fullName}
            />
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 grid gap-6 lg:grid-cols-2">
          <SectionCard title="Décisions et validations">
            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune décision enregistrée.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {approvals.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5 border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {a.decision} (v{a.version}) — {userMap.get(a.approverId)?.fullName ?? a.approverId}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(a.decidedAt)}</span>
                    </div>
                    {a.comment && <p className="text-xs text-muted-foreground">{a.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Impressions et audit">
            <div className="space-y-4">
              {printHistory.length > 0 && (
                <ul className="space-y-2 text-sm">
                  {printHistory.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <PrintActionBadge action={p.status} />
                      <span className="text-xs text-muted-foreground">
                        {userMap.get(p.printedBy)?.fullName ?? "—"} · {formatDateTime(p.initiatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="space-y-2 text-sm">
                {auditLogs.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="font-medium">{AUDIT_ACTION_LABELS[l.action]}</span>
                      {l.details && <span className="ml-2 text-xs text-muted-foreground">({l.details})</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(l.timestamp)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {settings && (
        <div className="hidden print:block">
          <MissionDocument
            mission={mission}
            employee={employee}
            settings={settings}
            approverName={approver?.fullName}
          />
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "approve"
                ? `Valider ${mission.reference}`
                : dialog === "reject"
                  ? `Refuser ${mission.reference}`
                  : `Annuler ${mission.reference}`}
            </DialogTitle>
            <DialogDescription>
              {dialog === "approve"
                ? "L'ordre de mission sera validé et prêt pour impression."
                : dialog === "reject"
                  ? "Indiquez le motif du refus."
                  : "Indiquez la raison de l'annulation."}
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={!!commentError || undefined}>
            <FieldLabel htmlFor="missionActionComment">
              {dialog === "approve" ? "Commentaire (optionnel)" : "Motif *"}
            </FieldLabel>
            <Textarea
              id="missionActionComment"
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setCommentError("")
              }}
              aria-invalid={!!commentError}
            />
            <FieldError errors={commentError ? [{ message: commentError }] : []} />
          </Field>
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setDialog(null)}>
              Fermer
            </Button>
            <Button
              variant={dialog === "approve" ? "default" : "destructive"}
              disabled={busy}
              onClick={handleDialogConfirm}
            >
              {busy && <Spinner data-icon="inline-start" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function InfoItem({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 flex flex-col gap-0.5" : "flex flex-col gap-0.5"}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
