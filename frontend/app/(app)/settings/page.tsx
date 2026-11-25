import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { SettingsView } from "@/components/settings/settings-view"

export const metadata: Metadata = { title: "Paramètres" }

export default function SettingsPage() {
  return (
    <RequirePermission permission="settings.manage">
      <SettingsView />
    </RequirePermission>
  )
}
