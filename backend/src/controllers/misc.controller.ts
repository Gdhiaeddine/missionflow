import { Body, Controller, Get, Headers, Patch, Post } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { DEFAULT_SETTINGS, SeedService } from "../seed/seed.service"
import { getUserIdFromAuthHeader, uid } from "../common/crypto"

@Controller()
export class MiscController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seedService: SeedService,
  ) {}

  @Get("approvals")
  async listApprovals() {
    const list = await this.prisma.approval.findMany({ orderBy: { decidedAt: "desc" } })
    return list.map((a) => ({ ...a, comment: a.comment ?? undefined }))
  }

  @Get("print-history")
  async listPrintHistory() {
    return this.prisma.printHistory.findMany({ orderBy: { initiatedAt: "desc" } })
  }

  @Get("settings")
  async getSettings() {
    const row = await this.prisma.settings.findUnique({ where: { id: "default" } })
    return row ? JSON.parse(row.data) : DEFAULT_SETTINGS
  }

  @Patch("settings")
  async updateSettings(@Body() body: Record<string, any>, @Headers("authorization") auth?: string) {
    await this.prisma.settings.upsert({
      where: { id: "default" },
      update: { data: JSON.stringify(body) },
      create: { id: "default", data: JSON.stringify(body) },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: getUserIdFromAuthHeader(auth),
        action: "PARAMETRES_MODIFIES",
        entityType: "PARAMETRES",
        entityId: "settings",
        details: null,
        timestamp: new Date().toISOString(),
      },
    })
    return body
  }

  @Post("settings/reset")
  async resetSettings() {
    await this.seedService.resetAll()
    return { ok: true }
  }
}
