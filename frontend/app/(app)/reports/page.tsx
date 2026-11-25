import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { ReportsView } from "@/components/reports/reports-view"

export const metadata: Metadata = { title: "Rapports et statistiques" }

export default function ReportsPage() {
  return (
    <RequirePermission permission="report.view">
      <ReportsView />
    </RequirePermission>
  )
}
