"use client"

import Link from "next/link"
import { use } from "react"
import { ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared/page-header"
import { MissionDocument } from "@/components/missions/mission-document"
import { MissionNotFound, MissionPageSkeleton } from "@/components/missions/mission-states"
import { useMission, useRecordDocumentEvent, useSettings, useUsers } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { getMissionActions } from "@/lib/permissions"

export default function MissionDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { data, isLoading, error } = useMission(id)
  const { data: settings } = useSettings()
  const { data: users = [] } = useUsers()
  const recordDoc = useRecordDocumentEvent()

  if (isLoading) return <MissionPageSkeleton />
  if (error || !data) return <MissionNotFound />

  const { mission, employee } = data
  const actions = getMissionActions(user?.role, mission)
  const approver = mission.approverId ? users.find((u) => u.id === mission.approverId) : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print">
        <PageHeader
          title={`Document officiel — ${mission.reference}`}
          description="Aperçu avant impression de l'ordre de mission."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" render={<Link href={`/missions/${mission.id}`} />}>
                <ArrowLeft data-icon="inline-start" />
                Retour
              </Button>
              {actions.print && (
                <Button
                  onClick={() => {
                    recordDoc.mutate({ missionId: mission.id, action: "IMPRESSION_LANCEE" })
                    window.print()
                  }}
                >
                  <Printer data-icon="inline-start" />
                  Imprimer
                </Button>
              )}
            </div>
          }
        />
      </div>

      {settings && (
        <MissionDocument
          mission={mission}
          employee={employee}
          settings={settings}
          approverName={approver?.fullName}
        />
      )}
    </div>
  )
}
