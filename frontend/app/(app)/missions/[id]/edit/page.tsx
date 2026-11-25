"use client"

import { use } from "react"
import { MissionForm } from "@/components/missions/mission-form"
import { MissionNotFound, MissionPageSkeleton } from "@/components/missions/mission-states"
import { AccessDenied } from "@/components/layout/auth-guard"
import { useMission } from "@/hooks/use-data"
import { useAuth } from "@/providers/auth-provider"
import { getMissionActions } from "@/lib/permissions"

export default function EditMissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const { data, isLoading, error } = useMission(id)

  if (isLoading) return <MissionPageSkeleton />
  if (error || !data) return <MissionNotFound />
  if (!getMissionActions(user?.role, data.mission).edit) return <AccessDenied />

  return <MissionForm key={`${data.mission.id}-${data.mission.version}`} mission={data.mission} />
}
