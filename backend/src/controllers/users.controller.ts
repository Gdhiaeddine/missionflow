import { Body, Controller, Get, Headers, HttpException, HttpStatus, Param, Patch, Post } from "@nestjs/common"
import type { User } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { getUserIdFromAuthHeader, hashPassword, uid } from "../common/crypto"

function toClientUser(u: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u
  return { ...rest, lastLoginAt: rest.lastLoginAt ?? undefined }
}

@Controller()
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("users")
  async list() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: "asc" } })
    return users.map(toClientUser)
  }

  @Post("users")
  async create(@Body() body: Record<string, any>, @Headers("authorization") auth?: string) {
    if (!body.password || String(body.password).length < 8) {
      throw new HttpException("Le mot de passe doit contenir au moins 8 caractères.", HttpStatus.BAD_REQUEST)
    }
    const all = await this.prisma.user.findMany()
    if (
      all.some(
        (u) =>
          u.email.toLowerCase() === String(body.email ?? "").toLowerCase() ||
          u.username.toLowerCase() === String(body.username ?? "").toLowerCase(),
      )
    ) {
      throw new HttpException(
        "Un utilisateur avec cet e-mail ou ce nom d'utilisateur existe déjà.",
        HttpStatus.CONFLICT,
      )
    }

    const now = new Date().toISOString()
    const user = await this.prisma.user.create({
      data: {
        id: uid("usr"),
        fullName: body.fullName,
        email: body.email,
        username: body.username,
        role: body.role,
        status: body.status ?? "ACTIF",
        createdAt: now,
        lastLoginAt: null,
        passwordHash: hashPassword(body.password),
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: getUserIdFromAuthHeader(auth),
        action: "UTILISATEUR_CREE",
        entityType: "UTILISATEUR",
        entityId: user.id,
        details: null,
        timestamp: now,
      },
    })
    return toClientUser(user)
  }

  @Patch("users/:id")
  async update(@Param("id") id: string, @Body() body: Record<string, any>, @Headers("authorization") auth?: string) {
    if (body.password && String(body.password).length < 8) {
      throw new HttpException("Le mot de passe doit contenir au moins 8 caractères.", HttpStatus.BAD_REQUEST)
    }
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new HttpException("Utilisateur introuvable.", HttpStatus.NOT_FOUND)

    const all = await this.prisma.user.findMany()
    if (
      all.some(
        (u) =>
          u.id !== id &&
          (u.email.toLowerCase() === String(body.email ?? "").toLowerCase() ||
            u.username.toLowerCase() === String(body.username ?? "").toLowerCase()),
      )
    ) {
      throw new HttpException(
        "Un utilisateur avec cet e-mail ou ce nom d'utilisateur existe déjà.",
        HttpStatus.CONFLICT,
      )
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: body.fullName ?? user.fullName,
        email: body.email ?? user.email,
        username: body.username ?? user.username,
        role: body.role ?? user.role,
        status: body.status ?? user.status,
        ...(body.password ? { passwordHash: hashPassword(body.password) } : {}),
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: getUserIdFromAuthHeader(auth),
        action: "UTILISATEUR_MODIFIE",
        entityType: "UTILISATEUR",
        entityId: id,
        details: null,
        timestamp: new Date().toISOString(),
      },
    })
    return toClientUser(updated)
  }

  @Patch("users/:id/status")
  async setStatus(
    @Param("id") id: string,
    @Body() body: { status: string },
    @Headers("authorization") auth?: string,
  ) {
    const actorId = getUserIdFromAuthHeader(auth)
    if (id === actorId) {
      throw new HttpException("Vous ne pouvez pas désactiver votre propre compte.", HttpStatus.BAD_REQUEST)
    }
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new HttpException("Utilisateur introuvable.", HttpStatus.NOT_FOUND)

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: body.status },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: actorId,
        action: "UTILISATEUR_MODIFIE",
        entityType: "UTILISATEUR",
        entityId: id,
        details: body.status === "ACTIF" ? "Compte activé" : "Compte désactivé",
        timestamp: new Date().toISOString(),
      },
    })
    return toClientUser(updated)
  }

  @Get("audit-logs")
  async auditLogs() {
    const logs = await this.prisma.auditLog.findMany({ orderBy: { timestamp: "desc" } })
    return logs.map((l) => ({ ...l, details: l.details ?? undefined }))
  }
}
