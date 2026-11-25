import type {
  AuditAction,
  MissionStatus,
  MissionType,
  PrintAction,
  Role,
  Transportation,
} from "@/types"

export const APP_NAME = "Ordres de Mission"
export const APP_SUBTITLE = "Gestion des Ordres de Mission"
export const DEPARTMENT_NAME = "Département d'Expédition"
export const DEPARTMENT_LABEL = "DÉPARTEMENT D'EXPÉDITION"

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  BROUILLON: "Brouillon",
  EN_ATTENTE: "En attente",
  VALIDE: "Validé",
  REFUSE: "Refusé",
  ANNULE: "Annulé",
}

export const MISSION_STATUSES: MissionStatus[] = [
  "BROUILLON",
  "EN_ATTENTE",
  "VALIDE",
  "REFUSE",
  "ANNULE",
]

export const TRANSPORTATION_LABELS: Record<Transportation, string> = {
  VEHICULE_SERVICE: "Véhicule de service",
  VEHICULE_PERSONNEL: "Véhicule personnel",
  TRANSPORT_PUBLIC: "Transport public",
  TRAIN: "Train",
  AVION: "Avion",
  AUTRE: "Autre",
}

export const TRANSPORTATIONS: Transportation[] = [
  "VEHICULE_SERVICE",
  "VEHICULE_PERSONNEL",
  "TRANSPORT_PUBLIC",
  "TRAIN",
  "AVION",
  "AUTRE",
]

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  LIVRAISON: "Livraison",
  ENLEVEMENT: "Enlèvement de marchandises",
  ACCOMPAGNEMENT: "Accompagnement de convoi",
  CONTROLE: "Contrôle et inventaire",
  FORMATION: "Formation",
  REUNION: "Réunion de coordination",
  AUTRE: "Autre",
}

export const MISSION_TYPES: MissionType[] = [
  "LIVRAISON",
  "ENLEVEMENT",
  "ACCOMPAGNEMENT",
  "CONTROLE",
  "FORMATION",
  "REUNION",
  "AUTRE",
]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  AGENT_EXPEDITION: "Agent d'expédition",
  RESPONSABLE: "Responsable",
  LECTURE_SEULE: "Lecture seule",
}

export const PRINT_ACTION_LABELS: Record<PrintAction, string> = {
  GENERE: "Document généré",
  TELECHARGE: "Document téléchargé",
  IMPRESSION_LANCEE: "Impression lancée",
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  MISSION_CREEE: "Ordre de mission créé",
  MISSION_MODIFIEE: "Ordre de mission modifié",
  MISSION_SOUMISE: "Soumis pour validation",
  MISSION_VALIDEE: "Ordre de mission validé",
  MISSION_REFUSEE: "Ordre de mission refusé",
  MISSION_ANNULEE: "Ordre de mission annulé",
  DOCUMENT_GENERE: "Document généré",
  DOCUMENT_TELECHARGE: "Document téléchargé",
  IMPRESSION_LANCEE: "Impression lancée",
  EMPLOYE_CREE: "Employé ajouté",
  EMPLOYE_MODIFIE: "Employé modifié",
  UTILISATEUR_CREE: "Utilisateur créé",
  UTILISATEUR_MODIFIE: "Utilisateur modifié",
  CONNEXION: "Connexion",
  PARAMETRES_MODIFIES: "Paramètres modifiés",
}

export const DESTINATIONS = [
  "Alger",
  "Sétif",
  "Béjaïa",
  "Constantine",
  "Batna",
  "Bordj Bou Arréridj",
  "Tizi Ouzou",
  "Oran",
  "Annaba",
  "Blida",
  "Tlemcen",
  "Biskra",
]
