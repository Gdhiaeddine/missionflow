"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AccountStatus, AppSettings, PrintAction } from "@/types"
import * as missionsApi from "@/lib/api/missions"
import * as approvalsApi from "@/lib/api/approvals"
import * as documentsApi from "@/lib/api/documents"
import * as employeesApi from "@/lib/api/employees"
import * as usersApi from "@/lib/api/users"
import * as settingsApi from "@/lib/api/settings"

export const queryKeys = {
  missions: ["missions"] as const,
  mission: (id: string) => ["missions", id] as const,
  nextReference: ["missions", "next-reference"] as const,
  missionSuggestions: ["missions", "suggestions"] as const,
  approvals: ["approvals"] as const,
  printHistory: ["print-history"] as const,
  employees: ["employees"] as const,
  employee: (id: string) => ["employees", id] as const,
  users: ["users"] as const,
  auditLogs: ["audit-logs"] as const,
  settings: ["settings"] as const,
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue."
}

/* ----------------------------- Missions ----------------------------- */

export function useMissions() {
  return useQuery({ queryKey: queryKeys.missions, queryFn: missionsApi.listMissions })
}

export function useMission(id: string) {
  return useQuery({ queryKey: queryKeys.mission(id), queryFn: () => missionsApi.getMission(id) })
}

export function useNextReference() {
  return useQuery({ queryKey: queryKeys.nextReference, queryFn: missionsApi.getNextReference })
}

export function useMissionSuggestions() {
  return useQuery({ queryKey: queryKeys.missionSuggestions, queryFn: missionsApi.getMissionSuggestions })
}

function useInvalidateMissions() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.missions })
    queryClient.invalidateQueries({ queryKey: queryKeys.missionSuggestions })
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals })
    queryClient.invalidateQueries({ queryKey: queryKeys.printHistory })
    queryClient.invalidateQueries({ queryKey: queryKeys.auditLogs })
  }
}

export function useCreateMission() {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: ({ input, submit }: { input: missionsApi.MissionInput; submit: boolean }) =>
      missionsApi.createMission(input, submit),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  })
}

export function useUpdateMission(id: string) {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: (input: missionsApi.MissionInput) => missionsApi.updateMission(id, input),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  })
}

export function useSubmitMission() {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: (id: string) => missionsApi.submitMission(id),
    onSuccess: (mission) => {
      invalidate()
      toast.success(`${mission.reference} a été soumis pour validation.`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

export function useCancelMission() {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => missionsApi.cancelMission(id, reason),
    onSuccess: (mission) => {
      invalidate()
      toast.success(`${mission.reference} a été annulé.`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/* ----------------------------- Approvals ---------------------------- */

export function useApprovals() {
  return useQuery({ queryKey: queryKeys.approvals, queryFn: approvalsApi.listApprovals })
}

export function useApproveMission() {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approvalsApi.approveMission(id, { comment }),
    onSuccess: (mission) => {
      invalidate()
      toast.success(`${mission.reference} a été validé. Le document peut être imprimé.`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

export function useRejectMission() {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      approvalsApi.rejectMission(id, { comment }),
    onSuccess: (mission) => {
      invalidate()
      toast.success(`${mission.reference} a été refusé.`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/* ----------------------------- Documents ---------------------------- */

export function usePrintHistory() {
  return useQuery({ queryKey: queryKeys.printHistory, queryFn: documentsApi.listPrintHistory })
}

export function useRecordDocumentEvent() {
  const invalidate = useInvalidateMissions()
  return useMutation({
    mutationFn: ({ missionId, action }: { missionId: string; action: PrintAction }) =>
      documentsApi.recordDocumentEvent(missionId, action),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/* ----------------------------- Employees ---------------------------- */

export function useEmployees() {
  return useQuery({ queryKey: queryKeys.employees, queryFn: employeesApi.listEmployees })
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: queryKeys.employee(id), queryFn: () => employeesApi.getEmployee(id) })
}

export function useSaveEmployee(id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: employeesApi.EmployeeInput) =>
      id ? employeesApi.updateEmployee(id, input) : employeesApi.createEmployee(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees })
      queryClient.invalidateQueries({ queryKey: queryKeys.missions })
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/* ------------------------------- Users ------------------------------ */

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: usersApi.listUsers })
}

export function useAuditLogs() {
  return useQuery({ queryKey: queryKeys.auditLogs, queryFn: usersApi.listAuditLogs })
}

export function useSaveUser(id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: usersApi.UserInput) =>
      id ? usersApi.updateUser(id, input) : usersApi.createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users }),
    onError: (error) => toast.error(errorMessage(error)),
  })
}

export function useSetUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AccountStatus }) => usersApi.setUserStatus(id, status),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      toast.success(`Compte de ${user.fullName} ${user.status === "ACTIF" ? "activé" : "désactivé"}.`)
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}

/* ------------------------------ Settings ---------------------------- */

export function useSettings() {
  return useQuery({ queryKey: queryKeys.settings, queryFn: settingsApi.getSettings, staleTime: 60_000 })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settings: AppSettings) => settingsApi.updateSettings(settings),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings, settings)
      queryClient.invalidateQueries({ queryKey: queryKeys.nextReference })
      toast.success("Paramètres enregistrés.")
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
}
