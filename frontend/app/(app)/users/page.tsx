import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { UsersList } from "@/components/users/users-list"

export const metadata: Metadata = { title: "Utilisateurs" }

export default function UsersPage() {
  return (
    <RequirePermission permission="user.manage">
      <UsersList />
    </RequirePermission>
  )
}
