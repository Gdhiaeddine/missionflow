import type { Mission, Role } from "@/types"

/**
 * UI-level permissions. These checks only shape the interface; the NestJS
 * backend must enforce the same rules server-side. Never rely on them for security.
 */
export type Permission =
  | "mission.view"
  | "mission.create"
  | "mission.edit"
  | "mission.editValidated"
  | "mission.submit"
  | "mission.approve"
  | "mission.cancel"
  | "document.generate"
  | "document.download"
  | "document.print"
  | "employee.view"
  | "employee.manage"
  | "approval.view"
  | "printHistory.view"
  | "report.view"
  | "user.manage"
  | "settings.manage"

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: [
    "mission.view",
    "mission.create",
    "mission.edit",
    "mission.editValidated",
    "mission.submit",
    "mission.approve",
    "mission.cancel",
    "document.generate",
    "document.download",
    "document.print",
    "employee.view",
    "employee.manage",
    "approval.view",
    "printHistory.view",
    "report.view",
    "user.manage",
    "settings.manage",
  ],
  AGENT_EXPEDITION: [
    "mission.view",
    "mission.create",
    "mission.edit",
    "mission.submit",
    "mission.cancel",
    "document.generate",
    "document.download",
    "document.print",
    "employee.view",
    "printHistory.view",
  ],
  RESPONSABLE: [
    "mission.view",
    "mission.create",
    "mission.edit",
    "mission.submit",
    "mission.approve",
    "mission.cancel",
    "document.generate",
    "document.download",
    "document.print",
    "employee.view",
    "employee.manage",
    "printHistory.view",
  ],
  LECTURE_SEULE: ["mission.view", "document.download", "employee.view"],
}

export function can(role: Role | undefined, permission: Permission) {
  if (!role) return false
  return MATRIX[role].includes(permission)
}

export interface MissionActions {
  edit: boolean
  submit: boolean
  approve: boolean
  reject: boolean
  cancel: boolean
  generate: boolean
  download: boolean
  print: boolean
  requiresReapproval: boolean
}

/** Single source of truth for which actions are available for a mission. */
export function getMissionActions(role: Role | undefined, mission: Mission): MissionActions {
  const isPrintable =
    mission.status === "VALIDE" && mission.approvedVersion === mission.version
  const editableStatus = mission.status === "BROUILLON" || mission.status === "REFUSE"

  return {
    edit:
      (editableStatus && can(role, "mission.edit")) ||
      ((mission.status === "VALIDE" || mission.status === "EN_ATTENTE") &&
        can(role, "mission.editValidated")),
    submit: editableStatus && can(role, "mission.submit"),
    approve: mission.status === "EN_ATTENTE" && can(role, "mission.approve"),
    reject: mission.status === "EN_ATTENTE" && can(role, "mission.approve"),
    cancel:
      can(role, "mission.cancel") &&
      (mission.status === "BROUILLON" ||
        mission.status === "EN_ATTENTE" ||
        mission.status === "REFUSE" ||
        (mission.status === "VALIDE" && role === "ADMIN")),
    generate: isPrintable && can(role, "document.generate"),
    download: isPrintable && can(role, "document.download"),
    print: isPrintable && can(role, "document.print"),
    requiresReapproval:
      mission.approvedVersion !== undefined && mission.approvedVersion !== mission.version,
  }
}
