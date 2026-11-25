import type { MissionDocument, PrintAction, PrintHistory } from "@/types"
import { apiRequest } from "./client"

export interface DocumentEventResponse {
  document: MissionDocument
  event: PrintHistory
}

export async function recordDocumentEvent(
  missionId: string,
  action: PrintAction,
): Promise<DocumentEventResponse> {
  return apiRequest<DocumentEventResponse>(`/missions/${missionId}/documents`, {
    method: "POST",
    body: { action },
  })
}

export async function listDocuments(missionId: string): Promise<MissionDocument[]> {
  return apiRequest<MissionDocument[]>(`/missions/${missionId}/documents`)
}

export async function listPrintHistory(): Promise<PrintHistory[]> {
  return apiRequest<PrintHistory[]>("/print-history")
}
