import type { Metadata } from "next"
import { RequirePermission } from "@/components/layout/auth-guard"
import { EmployeesList } from "@/components/employees/employees-list"

export const metadata: Metadata = { title: "Employés" }

export default function EmployeesPage() {
  return (
    <RequirePermission permission="employee.view">
      <EmployeesList />
    </RequirePermission>
  )
}
