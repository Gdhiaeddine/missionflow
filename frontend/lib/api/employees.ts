import type { Employee } from "@/types"
import type { EmployeeFormValues } from "@/lib/validations"
import { apiRequest } from "./client"

export type EmployeeInput = EmployeeFormValues

export async function listEmployees(): Promise<Employee[]> {
  return apiRequest<Employee[]>("/employees")
}

export async function getEmployee(id: string): Promise<Employee> {
  return apiRequest<Employee>(`/employees/${id}`)
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  return apiRequest<Employee>("/employees", { method: "POST", body: input })
}

export async function updateEmployee(id: string, input: EmployeeInput): Promise<Employee> {
  return apiRequest<Employee>(`/employees/${id}`, { method: "PATCH", body: input })
}
