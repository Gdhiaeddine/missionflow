import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { ApprovalsView } from "@/components/approvals/approvals-view"

export const metadata: Metadata = { title: "Validation des ordres" }

export default function ApprovalsPage() {
  return (
    <RequirePermission permission="approval.view">
      <ApprovalsView />
    </RequirePermission>
  )
}
