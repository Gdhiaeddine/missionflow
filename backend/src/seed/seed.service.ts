import { Injectable, OnModuleInit } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { hashPassword } from "../common/crypto"

export const DEFAULT_SETTINGS = {
  company: {
    name: "Société Nationale de Logistique et Distribution",
    activity: "",
    address: "Zone Industrielle, Lot 14, 16000 Alger, Algérie",
    phone: "+213 23 45 67 89",
    email: "contact@snld.dz",
    website: "www.snld.dz",
  },
  department: { contactName: "Karim Benali" },
  document: {
    logoPosition: "GAUCHE",
    headerText: "Direction des Opérations — Département d'Expédition",
    footerText: "",
    signatures: { agent: true, responsable: true, direction: true, cachet: true },
    stampLabel: "Cachet de l'entreprise",
    marginMm: 15,
    referencePrefix: "OM",
    referenceDigits: 5,
    includeYear: true,
  },
  preferences: {
    language: "fr",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "24h",
    pageSize: 10,
    notifyOnSubmission: true,
    notifyOnDecision: true,
    notifyOnPrint: false,
  },
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.user.count()
    if (count === 0) {
      await this.seedAll()
    }
  }

  async resetAll() {
    await this.prisma.auditLog.deleteMany()
    await this.prisma.printHistory.deleteMany()
    await this.prisma.missionDocument.deleteMany()
    await this.prisma.approval.deleteMany()
    await this.prisma.mission.deleteMany()
    await this.prisma.employee.deleteMany()
    await this.prisma.user.deleteMany()
    await this.prisma.settings.deleteMany()
    await this.seedAll()
  }

  async seedAll() {
    const now = new Date()

    await this.prisma.user.createMany({
      data: [
        {
          id: "usr-admin",
          fullName: "Karim Benali",
          email: "admin@missionflow.local",
          username: "admin",
          role: "ADMIN",
          status: "ACTIF",
          createdAt: addDays(now, -540).toISOString(),
          lastLoginAt: null,
          passwordHash: hashPassword("Admin@2026"),
        },
        {
          id: "usr-agent",
          fullName: "Yacine Haddad",
          email: "agent@missionflow.local",
          username: "agent",
          role: "AGENT_EXPEDITION",
          status: "ACTIF",
          createdAt: addDays(now, -420).toISOString(),
          lastLoginAt: null,
          passwordHash: hashPassword("Agent@2026"),
        },
        {
          id: "usr-manager",
          fullName: "Nadia Mansouri",
          email: "manager@missionflow.local",
          username: "manager",
          role: "RESPONSABLE",
          status: "ACTIF",
          createdAt: addDays(now, -480).toISOString(),
          lastLoginAt: null,
          passwordHash: hashPassword("Manager@2026"),
        },
        {
          id: "usr-viewer",
          fullName: "Samira Cherif",
          email: "viewer@missionflow.local",
          username: "viewer",
          role: "LECTURE_SEULE",
          status: "ACTIF",
          createdAt: addDays(now, -180).toISOString(),
          lastLoginAt: null,
          passwordHash: hashPassword("Viewer@2026"),
        },
      ],
    })

    await this.prisma.settings.create({
      data: { id: "default", data: JSON.stringify(DEFAULT_SETTINGS) },
    })
  }
}
