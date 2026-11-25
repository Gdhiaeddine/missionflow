export type Role = "ADMIN" | "AGENT_EXPEDITION" | "RESPONSABLE" | "LECTURE_SEULE"

export type AccountStatus = "ACTIF" | "INACTIF"

export interface User {
  id: string
  fullName: string
  email: string
  username: string
  role: Role
  status: AccountStatus
  createdAt: string
  lastLoginAt?: string
  /** Development mock authentication only. Never stored by the real backend. */
  mockPassword?: string
}

export type SessionUser = Omit<User, "mockPassword">

export interface Employee {
  id: string
  employeeNumber: string
  firstName: string
  lastName: string
  position: string
  phone: string
  email?: string
  address?: string
  birthDate?: string
  hireDate?: string
  status: AccountStatus
  createdAt: string
}

export type MissionStatus = "BROUILLON" | "EN_ATTENTE" | "VALIDE" | "REFUSE" | "ANNULE"

export type Transportation =
  | "VEHICULE_SERVICE"
  | "VEHICULE_PERSONNEL"
  | "TRANSPORT_PUBLIC"
  | "TRAIN"
  | "AVION"
  | "AUTRE"

export type MissionType =
  | "LIVRAISON"
  | "ENLEVEMENT"
  | "ACCOMPAGNEMENT"
  | "CONTROLE"
  | "FORMATION"
  | "REUNION"
  | "AUTRE"

export interface Mission {
  id: string
  reference: string
  orderNumber?: string
  orderYear?: string
  employeeId: string
  employeePosition?: string
  missionType: MissionType
  subject: string
  description?: string
  serviceAssignment?: string
  departureLocation: string
  destination: string
  destinationAddress?: string
  departureDate: string
  departureTime: string
  returnDate: string
  returnTime: string
  transportation: Transportation
  vehicleName?: string
  vehicleRegistration?: string
  observations?: string
  instructions?: string
  estimatedExpenses?: number
  attachments: string[]
  approverId?: string
  adminComment?: string
  status: MissionStatus
  /** Incremented whenever official content changes. */
  version: number
  /** Version that was last approved. Printing requires approvedVersion === version. */
  approvedVersion?: number
  rejectionReason?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ApprovalDecision = "SOUMIS" | "VALIDE" | "REFUSE"

export interface Approval {
  id: string
  missionId: string
  approverId: string
  decision: ApprovalDecision
  comment?: string
  previousStatus: MissionStatus
  version: number
  decidedAt: string
}

export interface MissionDocument {
  id: string
  missionId: string
  version: number
  filePath: string
  generatedAt: string
  generatedBy: string
}

export type PrintAction = "GENERE" | "TELECHARGE" | "IMPRESSION_LANCEE"

export interface PrintHistory {
  id: string
  missionId: string
  documentVersion: number
  printedBy: string
  initiatedAt: string
  status: PrintAction
}

export type AuditAction =
  | "MISSION_CREEE"
  | "MISSION_MODIFIEE"
  | "MISSION_SOUMISE"
  | "MISSION_VALIDEE"
  | "MISSION_REFUSEE"
  | "MISSION_ANNULEE"
  | "DOCUMENT_GENERE"
  | "DOCUMENT_TELECHARGE"
  | "IMPRESSION_LANCEE"
  | "EMPLOYE_CREE"
  | "EMPLOYE_MODIFIE"
  | "UTILISATEUR_CREE"
  | "UTILISATEUR_MODIFIE"
  | "CONNEXION"
  | "PARAMETRES_MODIFIES"

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  entityType: "MISSION" | "EMPLOYE" | "UTILISATEUR" | "DOCUMENT" | "PARAMETRES" | "SESSION"
  entityId: string
  details?: string
  timestamp: string
}

export interface SignatureConfig {
  agent: boolean
  responsable: boolean
  direction: boolean
  cachet: boolean
}

export interface AppSettings {
  company: {
    name: string
    activity?: string
    logoDataUrl?: string
    address: string
    phone: string
    email: string
    website: string
  }
  department: {
    contactName?: string
  }
  document: {
    logoPosition: "GAUCHE" | "CENTRE" | "DROITE"
    headerText: string
    footerText: string
    signatures: SignatureConfig
    stampLabel: string
    marginMm: number
    referencePrefix: string
    referenceDigits: number
    includeYear: boolean
  }
  preferences: {
    language: "fr"
    dateFormat: "dd/MM/yyyy" | "dd MMM yyyy" | "yyyy-MM-dd"
    timeFormat: "24h" | "12h"
    pageSize: number
    notifyOnSubmission: boolean
    notifyOnDecision: boolean
    notifyOnPrint: boolean
  }
}

export interface MissionWithEmployee extends Mission {
  employee?: Employee
}
