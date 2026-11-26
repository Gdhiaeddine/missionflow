import { z } from "zod"

const optionalText = z.string().trim().optional()

export const missionSchema = z
  .object({
    orderNumber: optionalText,
    orderYear: z
      .string()
      .trim()
      .regex(/^(\d{4})?$/, "L'année doit contenir 4 chiffres.")
      .optional(),
    creationDate: optionalText,
    missionType: z.enum(
      ["LIVRAISON", "ENLEVEMENT", "ACCOMPAGNEMENT", "CONTROLE", "FORMATION", "REUNION", "AUTRE"],
      { error: "Veuillez sélectionner un type de mission." },
    ),
    subject: z
      .string()
      .trim()
      .min(5, "Le motif de déplacement doit contenir au moins 5 caractères.")
      .max(160, "Le motif ne peut pas dépasser 160 caractères."),
    description: optionalText,
    employeeId: z.string().min(1, "Veuillez sélectionner un employé."),
    employeePosition: optionalText,
    serviceAssignment: optionalText,
    departureLocation: z.string().trim().min(2, "Le lieu de départ est obligatoire."),
    destination: z.string().trim().min(2, "La région (se rendre à) est obligatoire."),
    destinationAddress: optionalText,
    departureDate: optionalText,
    departureTime: optionalText,
    returnDate: optionalText,
    returnTime: optionalText,
    transportation: z.enum(
      ["VEHICULE_SERVICE", "VEHICULE_PERSONNEL", "TRANSPORT_PUBLIC", "TRAIN", "AVION", "AUTRE"],
      { error: "Veuillez sélectionner un moyen de transport." },
    ),
    vehicleName: optionalText,
    vehicleRegistration: optionalText,
    observations: optionalText,
    instructions: optionalText,
    estimatedExpenses: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || (/^\d+([.,]\d{1,2})?$/.test(v) && Number(v.replace(",", ".")) >= 0), {
        message: "Montant invalide. Exemple : 12500",
      }),
    attachments: z.array(z.string()),
    approverId: optionalText,
    adminComment: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.departureDate && data.returnDate) {
      const start = new Date(`${data.departureDate}T${data.departureTime || "00:00"}`)
      const end = new Date(`${data.returnDate}T${data.returnTime || "00:00"}`)
      if (end.getTime() < start.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["returnDate"],
          message: "La date et l'heure de retour ne peuvent pas précéder le départ.",
        })
      }
    }
    if (data.transportation === "VEHICULE_SERVICE" && !data.vehicleRegistration) {
      ctx.addIssue({
        code: "custom",
        path: ["vehicleRegistration"],
        message: "L'immatriculation est obligatoire pour un véhicule de service.",
      })
    }
  })

export type MissionFormValues = z.infer<typeof missionSchema>

export const employeeSchema = z.object({
  employeeNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || (v.length >= 3 && /^[A-Z0-9-]+$/i.test(v)), {
      message: "Le matricule doit contenir au moins 3 caractères (lettres, chiffres et tirets).",
    }),
  lastName: z.string().trim().min(2, "Le nom complet est obligatoire."),
  firstName: z.string().trim().optional().default(""),
  birthDate: optionalText,
  position: z.string().trim().min(2, "La fonction est obligatoire."),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+\d\s().-]+$/.test(v), "Numéro de téléphone invalide."),
  address: optionalText,
  hireDate: optionalText,
  status: z.enum(["ACTIF", "INACTIF"]),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

export const userSchema = z.object({
  fullName: z.string().trim().min(3, "Le nom complet est obligatoire."),
  username: z
    .string()
    .trim()
    .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.")
    .regex(/^[a-z0-9._-]+$/, "Lettres minuscules, chiffres, points et tirets uniquement."),
  email: z.string().trim().email("Adresse e-mail invalide."),
  role: z.enum(["ADMIN", "AGENT_EXPEDITION", "RESPONSABLE", "LECTURE_SEULE"]),
  password: z.string().optional(),
  status: z.enum(["ACTIF", "INACTIF"]),
})

export type UserFormValues = z.infer<typeof userSchema>

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Veuillez saisir votre e-mail ou nom d'utilisateur."),
  password: z.string().min(1, "Veuillez saisir votre mot de passe."),
  remember: z.boolean(),
})

export type LoginFormValues = z.infer<typeof loginSchema>
