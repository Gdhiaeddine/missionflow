import type { AccountStatus, AuditLog, SessionUser } from "@/types"
import type { UserFormValues } from "@/lib/validations"
import { apiRequest } from "./client"

export type UserInput = UserFormValues

export async function listUsers(): Promise<SessionUser[]> {
  return apiRequest<SessionUser[]>("/users")
}

export async function createUser(input: UserInput): Promise<SessionUser> {
  return apiRequest<SessionUser>("/users", { method: "POST", body: input })
}

export async function updateUser(id: string, input: UserInput): Promise<SessionUser> {
  return apiRequest<SessionUser>(`/users/${id}`, { method: "PATCH", body: input })
}

export async function setUserStatus(id: string, status: AccountStatus): Promise<SessionUser> {
  return apiRequest<SessionUser>(`/users/${id}/status`, { method: "PATCH", body: { status } })
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>("/audit-logs")
}
