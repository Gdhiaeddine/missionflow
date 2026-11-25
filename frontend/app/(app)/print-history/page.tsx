import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { PrintHistoryView } from "@/components/print-history/print-history-view"

export const metadata: Metadata = { title: "Historique d'impression" }

export default function PrintHistoryPage() {
  return (
    <RequirePermission permission="printHistory.view">
      <PrintHistoryView />
    </RequirePermission>
  )
}
