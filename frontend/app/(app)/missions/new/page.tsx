import type { Metadata } from "next"
import { MissionForm } from "@/components/missions/mission-form"
import { RequirePermission } from "@/components/layout/auth-guard"

export const metadata: Metadata = { title: "Nouvel ordre de mission" }

export default function NewMissionPage() {
  return (
    <RequirePermission permission="mission.create">
      <MissionForm />
    </RequirePermission>
  )
}
