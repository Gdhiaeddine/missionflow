import type { Vehicle } from "@/types"
import { apiRequest } from "./client"

export interface VehicleInput {
  name: string
  registration: string
  type?: string
  transportation?: "VEHICULE_SERVICE" | "VEHICULE_PERSONNEL"
}

export async function listVehicles(): Promise<Vehicle[]> {
  return apiRequest<Vehicle[]>("/vehicles")
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return apiRequest<Vehicle>("/vehicles", { method: "POST", body: input })
}

export async function updateVehicle(id: string, input: VehicleInput): Promise<Vehicle> {
  return apiRequest<Vehicle>(`/vehicles/${id}`, { method: "PATCH", body: input })
}

export async function deleteVehicle(id: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/vehicles/${id}`, { method: "DELETE" })
}
