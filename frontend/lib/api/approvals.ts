import type { Approval, Mission } from "@/types"
import { apiRequest } from "./client"

export interface DecisionRequest {
  comment?: string
}

export async function listApprovals(): Promise<Approval[]> {
  return apiRequest<Approval[]>("/approvals")
}

export async function approveMission(id: string, request: DecisionRequest): Promise<Mission> {
  return apiRequest<Mission>(`/missions/${id}/approve`, { method: "POST", body: request })
}

export async function rejectMission(id: string, request: Required<DecisionRequest>): Promise<Mission> {
  return apiRequest<Mission>(`/missions/${id}/reject`, { method: "POST", body: request })
}
