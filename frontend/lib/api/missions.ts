import type {
  Approval,
  AuditLog,
  Employee,
  Mission,
  MissionDocument,
  MissionWithEmployee,
  PrintHistory,
} from "@/types"
import type { MissionFormValues } from "@/lib/validations"
import { apiRequest } from "./client"

export type MissionInput = MissionFormValues

export interface MissionDetail {
  mission: Mission
  employee?: Employee
  approvals: Approval[]
  documents: MissionDocument[]
  printHistory: PrintHistory[]
  auditLogs: AuditLog[]
}

export interface UpdateMissionResult {
  mission: Mission
  requiresReapproval: boolean
}

export async function listMissions(): Promise<MissionWithEmployee[]> {
  return apiRequest<MissionWithEmployee[]>("/missions")
}

export async function getMission(id: string): Promise<MissionDetail> {
  return apiRequest<MissionDetail>(`/missions/${id}`)
}

export interface MissionSuggestions {
  serviceAssignments: string[]
  subjects: string[]
  departureLocations: string[]
  destinations: string[]
  vehicleNames: string[]
  vehicleRegistrations: string[]
}

export async function getMissionSuggestions(): Promise<MissionSuggestions> {
  return apiRequest<MissionSuggestions>("/missions/suggestions")
}

export async function getNextReference(): Promise<string> {
  return (await apiRequest<{ reference: string }>("/missions/next-reference")).reference
}

export async function createMission(input: MissionInput, submit: boolean): Promise<Mission> {
  const created = await apiRequest<Mission>("/missions", { method: "POST", body: input })
  if (submit) return apiRequest<Mission>(`/missions/${created.id}/submit`, { method: "POST" })
  return created
}

export async function updateMission(id: string, input: MissionInput): Promise<UpdateMissionResult> {
  return apiRequest<UpdateMissionResult>(`/missions/${id}`, { method: "PATCH", body: input })
}

export async function submitMission(id: string): Promise<Mission> {
  return apiRequest<Mission>(`/missions/${id}/submit`, { method: "POST" })
}

export async function cancelMission(id: string, reason: string): Promise<Mission> {
  return apiRequest<Mission>(`/missions/${id}/cancel`, { method: "POST", body: { reason } })
}
