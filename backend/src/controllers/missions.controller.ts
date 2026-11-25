import { Body, Controller, Get, Headers, HttpException, HttpStatus, Param, Patch, Post } from "@nestjs/common"
import type { Mission } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { DEFAULT_SETTINGS } from "../seed/seed.service"
import { getUserIdFromAuthHeader, uid } from "../common/crypto"

const OFFICIAL_FIELDS = [
  "orderNumber",
  "orderYear",
  "employeeId",
  "employeePosition",
  "missionType",
  "subject",
  "departureLocation",
  "destination",
  "destinationAddress",
  "departureDate",
  "departureTime",
  "returnDate",
  "returnTime",
  "transportation",
  "vehicleName",
  "vehicleRegistration",
  "observations",
] as const

function toClientMission(m: Mission) {
  return {
    ...m,
    orderNumber: m.orderNumber ?? undefined,
    orderYear: m.orderYear ?? undefined,
    employeePosition: m.employeePosition ?? undefined,
    description: m.description ?? undefined,
    serviceAssignment: m.serviceAssignment ?? undefined,
    destinationAddress: m.destinationAddress ?? undefined,
    vehicleName: m.vehicleName ?? undefined,
    vehicleRegistration: m.vehicleRegistration ?? undefined,
    observations: m.observations ?? undefined,
    instructions: m.instructions ?? undefined,
    estimatedExpenses: m.estimatedExpenses ?? undefined,
    attachments: JSON.parse(m.attachments || "[]"),
    approverId: m.approverId ?? undefined,
    adminComment: m.adminComment ?? undefined,
    approvedVersion: m.approvedVersion ?? undefined,
    rejectionReason: m.rejectionReason ?? undefined,
  }
}

function formatOrderReference(orderNumber?: string | null, orderYear?: string | null, fallbackDate = new Date()) {
  const year = orderYear?.trim() || String(fallbackDate.getFullYear())
  const num = orderNumber?.trim() || "........"
  return `${num} / ${year}`
}

@Controller("missions")
export class MissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const [missions, employees] = await Promise.all([
      this.prisma.mission.findMany({ orderBy: { createdAt: "desc" } }),
      this.prisma.employee.findMany(),
    ])
    const empMap = new Map(employees.map((e) => [e.id, e]))
    return missions.map((m) => ({
      ...toClientMission(m),
      employee: empMap.get(m.employeeId),
    }))
  }

  @Get("suggestions")
  async suggestions() {
    const all = await this.prisma.mission.findMany()
    const unique = (values: (string | null | undefined)[]) =>
      Array.from(new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))).sort((a, b) =>
        a.localeCompare(b, "fr"),
      )

    return {
      serviceAssignments: unique(all.map((m) => m.serviceAssignment)),
      subjects: unique(all.map((m) => m.subject)),
      departureLocations: unique(all.map((m) => m.departureLocation)),
      destinations: unique(all.map((m) => m.destination)),
      vehicleNames: unique(all.map((m) => m.vehicleName)),
      vehicleRegistrations: unique(all.map((m) => m.vehicleRegistration)),
    }
  }

  @Get("next-reference")
  async nextReference() {
    const row = await this.prisma.settings.findUnique({ where: { id: "default" } })
    const settings = row ? JSON.parse(row.data) : DEFAULT_SETTINGS
    const { referencePrefix, referenceDigits, includeYear } = settings.document
    const year = new Date().getFullYear()
    const prefix = includeYear ? `${referencePrefix}-${year}-` : `${referencePrefix}-`
    const all = await this.prisma.mission.findMany()
    const max = all
      .filter((m) => m.reference.startsWith(prefix))
      .reduce((acc, m) => Math.max(acc, Number(m.reference.slice(prefix.length)) || 0), 0)
    return { reference: `${prefix}${String(max + 1).padStart(referenceDigits, "0")}` }
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const m = await this.prisma.mission.findUnique({ where: { id } })
    if (!m) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    const [employee, approvals, documents, printHistory, auditLogs] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: m.employeeId } }),
      this.prisma.approval.findMany({ where: { missionId: id }, orderBy: { decidedAt: "asc" } }),
      this.prisma.missionDocument.findMany({ where: { missionId: id } }),
      this.prisma.printHistory.findMany({ where: { missionId: id }, orderBy: { initiatedAt: "desc" } }),
      this.prisma.auditLog.findMany({ where: { entityId: id }, orderBy: { timestamp: "asc" } }),
    ])
    return {
      mission: toClientMission(m),
      employee: employee ?? undefined,
      approvals: approvals.map((a) => ({ ...a, comment: a.comment ?? undefined })),
      documents,
      printHistory,
      auditLogs: auditLogs.map((l) => ({ ...l, details: l.details ?? undefined })),
    }
  }

  @Post()
  async create(@Body() input: Record<string, any>, @Headers("authorization") auth?: string) {
    const userId = getUserIdFromAuthHeader(auth)
    const now = new Date().toISOString()
    const createdAt = input.creationDate ? `${input.creationDate}T${now.slice(11)}` : now
    const orderNumber = input.orderNumber?.trim() || null
    const orderYear = input.orderYear?.trim() || String(new Date().getFullYear())
    const id = uid("mis")

    const mission = await this.prisma.mission.create({
      data: {
        id,
        reference: formatOrderReference(orderNumber, orderYear),
        orderNumber,
        orderYear,
        employeeId: input.employeeId,
        employeePosition: input.employeePosition?.trim() || null,
        missionType: input.missionType,
        subject: input.subject,
        description: input.description || null,
        serviceAssignment: input.serviceAssignment || null,
        departureLocation: input.departureLocation,
        destination: input.destination,
        destinationAddress: input.destinationAddress || null,
        departureDate: input.departureDate ?? "",
        departureTime: input.departureTime ?? "",
        returnDate: input.returnDate ?? "",
        returnTime: input.returnTime ?? "",
        transportation: input.transportation,
        vehicleName: input.transportation === "VEHICULE_SERVICE" ? input.vehicleName || null : null,
        vehicleRegistration:
          input.transportation === "VEHICULE_SERVICE" || input.transportation === "VEHICULE_PERSONNEL"
            ? input.vehicleRegistration || null
            : null,
        observations: input.observations || null,
        instructions: input.instructions || null,
        estimatedExpenses: input.estimatedExpenses ? Number(String(input.estimatedExpenses).replace(",", ".")) : null,
        attachments: JSON.stringify(input.attachments ?? []),
        approverId: input.approverId || null,
        adminComment: input.adminComment || null,
        status: "BROUILLON",
        version: 1,
        approvedVersion: null,
        rejectionReason: null,
        createdBy: userId,
        createdAt,
        updatedAt: now,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action: "MISSION_CREEE",
        entityType: "MISSION",
        entityId: id,
        details: null,
        timestamp: now,
      },
    })
    return toClientMission(mission)
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() input: Record<string, any>, @Headers("authorization") auth?: string) {
    const userId = getUserIdFromAuthHeader(auth)
    const mission = await this.prisma.mission.findUnique({ where: { id } })
    if (!mission) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    if (mission.status === "ANNULE") {
      throw new HttpException("Un ordre annulé ne peut pas être modifié.", HttpStatus.BAD_REQUEST)
    }

    const orderNumber = input.orderNumber?.trim() || null
    const orderYear = input.orderYear?.trim() || String(new Date(mission.createdAt).getFullYear())
    const createdAt = input.creationDate
      ? `${input.creationDate}T${mission.createdAt.slice(11) || "00:00:00.000Z"}`
      : mission.createdAt

    const candidate = {
      orderNumber,
      orderYear,
      employeeId: input.employeeId ?? mission.employeeId,
      employeePosition: input.employeePosition?.trim() || null,
      missionType: input.missionType ?? mission.missionType,
      subject: input.subject ?? mission.subject,
      description: input.description || null,
      serviceAssignment: input.serviceAssignment || null,
      departureLocation: input.departureLocation ?? mission.departureLocation,
      destination: input.destination ?? mission.destination,
      destinationAddress: input.destinationAddress || null,
      departureDate: input.departureDate ?? "",
      departureTime: input.departureTime ?? "",
      returnDate: input.returnDate ?? "",
      returnTime: input.returnTime ?? "",
      transportation: input.transportation ?? mission.transportation,
      vehicleName: input.transportation === "VEHICULE_SERVICE" ? input.vehicleName || null : null,
      vehicleRegistration:
        input.transportation === "VEHICULE_SERVICE" || input.transportation === "VEHICULE_PERSONNEL"
          ? input.vehicleRegistration || null
          : null,
      observations: input.observations || null,
      instructions: input.instructions || null,
      estimatedExpenses: input.estimatedExpenses ? Number(String(input.estimatedExpenses).replace(",", ".")) : null,
      attachments: JSON.stringify(input.attachments ?? []),
      approverId: input.approverId || null,
      adminComment: input.adminComment || null,
    }

    const officialChanged = OFFICIAL_FIELDS.some((f) => (mission[f] ?? "") !== (candidate[f] ?? ""))
    let requiresReapproval = false
    let nextVersion = mission.version
    let nextStatus = mission.status
    const now = new Date().toISOString()

    if (officialChanged) {
      nextVersion = mission.version + 1
      if (mission.status === "VALIDE" || mission.status === "EN_ATTENTE") {
        nextStatus = "EN_ATTENTE"
        requiresReapproval = mission.status === "VALIDE"
        await this.prisma.approval.create({
          data: {
            id: uid("apr"),
            missionId: id,
            approverId: userId,
            decision: "SOUMIS",
            comment: "Nouvelle version soumise suite à modification du contenu officiel.",
            previousStatus: mission.status,
            version: nextVersion,
            decidedAt: now,
          },
        })
      }
    }

    const updated = await this.prisma.mission.update({
      where: { id },
      data: {
        ...candidate,
        reference: formatOrderReference(orderNumber, orderYear, new Date(createdAt)),
        createdAt,
        version: nextVersion,
        status: nextStatus,
        updatedAt: now,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action: "MISSION_MODIFIEE",
        entityType: "MISSION",
        entityId: id,
        details: officialChanged ? `Nouvelle version v${nextVersion}` : "Informations internes modifiées",
        timestamp: now,
      },
    })

    return { mission: toClientMission(updated), requiresReapproval }
  }

  @Post(":id/submit")
  async submit(@Param("id") id: string, @Headers("authorization") auth?: string) {
    const userId = getUserIdFromAuthHeader(auth)
    const mission = await this.prisma.mission.findUnique({ where: { id } })
    if (!mission) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    if (mission.status !== "BROUILLON" && mission.status !== "REFUSE") {
      throw new HttpException("Seuls les brouillons ou ordres refusés peuvent être soumis.", HttpStatus.BAD_REQUEST)
    }

    let approverId = mission.approverId
    if (!approverId) {
      const resp = await this.prisma.user.findFirst({ where: { role: "RESPONSABLE" } })
      approverId = resp?.id ?? null
    }

    const prevStatus = mission.status
    const now = new Date().toISOString()
    const updated = await this.prisma.mission.update({
      where: { id },
      data: { status: "EN_ATTENTE", rejectionReason: null, approverId, updatedAt: now },
    })

    await this.prisma.approval.create({
      data: {
        id: uid("apr"),
        missionId: id,
        approverId: userId,
        decision: "SOUMIS",
        comment: null,
        previousStatus: prevStatus,
        version: mission.version,
        decidedAt: now,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action: "MISSION_SOUMISE",
        entityType: "MISSION",
        entityId: id,
        details: null,
        timestamp: now,
      },
    })
    return toClientMission(updated)
  }

  @Post(":id/cancel")
  async cancel(@Param("id") id: string, @Body() body: { reason?: string }, @Headers("authorization") auth?: string) {
    const userId = getUserIdFromAuthHeader(auth)
    const mission = await this.prisma.mission.findUnique({ where: { id } })
    if (!mission) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    const now = new Date().toISOString()
    const updated = await this.prisma.mission.update({
      where: { id },
      data: { status: "ANNULE", updatedAt: now },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action: "MISSION_ANNULEE",
        entityType: "MISSION",
        entityId: id,
        details: body.reason ?? null,
        timestamp: now,
      },
    })
    return toClientMission(updated)
  }

  @Post(":id/approve")
  async approve(@Param("id") id: string, @Body() body: { comment?: string }, @Headers("authorization") auth?: string) {
    const userId = getUserIdFromAuthHeader(auth)
    const mission = await this.prisma.mission.findUnique({ where: { id } })
    if (!mission) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    if (mission.status !== "EN_ATTENTE") {
      throw new HttpException("Cet ordre de mission n'est plus en attente de validation.", HttpStatus.CONFLICT)
    }

    const now = new Date().toISOString()
    await this.prisma.approval.create({
      data: {
        id: uid("apr"),
        missionId: id,
        approverId: userId,
        decision: "VALIDE",
        comment: body.comment ?? null,
        previousStatus: mission.status,
        version: mission.version,
        decidedAt: now,
      },
    })
    const updated = await this.prisma.mission.update({
      where: { id },
      data: { status: "VALIDE", approvedVersion: mission.version, rejectionReason: null, updatedAt: now },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action: "MISSION_VALIDEE",
        entityType: "MISSION",
        entityId: id,
        details: body.comment ?? null,
        timestamp: now,
      },
    })
    return toClientMission(updated)
  }

  @Post(":id/reject")
  async reject(@Param("id") id: string, @Body() body: { comment?: string }, @Headers("authorization") auth?: string) {
    if (!body.comment?.trim()) {
      throw new HttpException("Le motif de refus est obligatoire.", HttpStatus.BAD_REQUEST)
    }
    const userId = getUserIdFromAuthHeader(auth)
    const mission = await this.prisma.mission.findUnique({ where: { id } })
    if (!mission) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    if (mission.status !== "EN_ATTENTE") {
      throw new HttpException("Cet ordre de mission n'est plus en attente de validation.", HttpStatus.CONFLICT)
    }

    const now = new Date().toISOString()
    const comment = body.comment.trim()
    await this.prisma.approval.create({
      data: {
        id: uid("apr"),
        missionId: id,
        approverId: userId,
        decision: "REFUSE",
        comment,
        previousStatus: mission.status,
        version: mission.version,
        decidedAt: now,
      },
    })
    const updated = await this.prisma.mission.update({
      where: { id },
      data: { status: "REFUSE", rejectionReason: comment, updatedAt: now },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action: "MISSION_REFUSEE",
        entityType: "MISSION",
        entityId: id,
        details: comment,
        timestamp: now,
      },
    })
    return toClientMission(updated)
  }

  @Get(":id/documents")
  async listDocuments(@Param("id") id: string) {
    return this.prisma.missionDocument.findMany({ where: { missionId: id } })
  }

  @Post(":id/documents")
  async recordDocument(
    @Param("id") id: string,
    @Body() body: { action: "GENERE" | "TELECHARGE" | "IMPRESSION_LANCEE" },
    @Headers("authorization") auth?: string,
  ) {
    const userId = getUserIdFromAuthHeader(auth)
    const mission = await this.prisma.mission.findUnique({ where: { id } })
    if (!mission) throw new HttpException("Ordre de mission introuvable.", HttpStatus.NOT_FOUND)
    if (mission.status !== "VALIDE" || mission.approvedVersion !== mission.version) {
      throw new HttpException(
        "Le document officiel ne peut être produit que pour une version validée.",
        HttpStatus.CONFLICT,
      )
    }

    const now = new Date().toISOString()
    let document = await this.prisma.missionDocument.findFirst({
      where: { missionId: id, version: mission.version },
    })
    if (!document) {
      document = await this.prisma.missionDocument.create({
        data: {
          id: uid("doc"),
          missionId: id,
          version: mission.version,
          filePath: `/archives/${new Date().getFullYear()}/${mission.reference.replace(/\s+/g, "")}-v${mission.version}.pdf`,
          generatedAt: now,
          generatedBy: userId,
        },
      })
      const generated = await this.prisma.printHistory.create({
        data: {
          id: uid("prt"),
          missionId: id,
          documentVersion: mission.version,
          printedBy: userId,
          initiatedAt: now,
          status: "GENERE",
        },
      })
      await this.prisma.auditLog.create({
        data: {
          id: uid("aud"),
          userId,
          action: "DOCUMENT_GENERE",
          entityType: "DOCUMENT",
          entityId: id,
          details: null,
          timestamp: now,
        },
      })
      if (body.action === "GENERE") return { document, event: generated }
    }

    const event = await this.prisma.printHistory.create({
      data: {
        id: uid("prt"),
        missionId: id,
        documentVersion: mission.version,
        printedBy: userId,
        initiatedAt: now,
        status: body.action,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId,
        action:
          body.action === "IMPRESSION_LANCEE"
            ? "IMPRESSION_LANCEE"
            : body.action === "TELECHARGE"
              ? "DOCUMENT_TELECHARGE"
              : "DOCUMENT_GENERE",
        entityType: "DOCUMENT",
        entityId: id,
        details: `Version v${mission.version}`,
        timestamp: now,
      },
    })
    return { document, event }
  }
}
