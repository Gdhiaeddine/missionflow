import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { VehiclesList } from "@/components/vehicles/vehicles-list"

export const metadata: Metadata = { title: "Véhicules" }

export default function VehiclesPage() {
  return (
    <RequirePermission permission="mission.view">
      <VehiclesList />
    </RequirePermission>
  )
}
