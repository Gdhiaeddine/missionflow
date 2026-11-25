import type { AppSettings } from "@/types"
import { apiRequest } from "./client"

export async function getSettings(): Promise<AppSettings> {
  return apiRequest<AppSettings>("/settings")
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings> {
  return apiRequest<AppSettings>("/settings", { method: "PATCH", body: settings })
}
