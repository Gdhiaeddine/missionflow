import type { Metadata } from "next"
import { Suspense } from "react"
import { MissionsList } from "@/components/missions/missions-list"
import { RequirePermission } from "@/components/layout/auth-guard"

export const metadata: Metadata = { title: "Ordres de mission" }

export default function MissionsPage() {
  return (
    <RequirePermission permission="mission.view">
      <Suspense>
        <MissionsList />
      </Suspense>
    </RequirePermission>
  )
}
