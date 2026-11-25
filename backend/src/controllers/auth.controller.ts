import { Body, Controller, Headers, HttpCode, HttpException, HttpStatus, Post } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { signToken, uid, verifyPassword, verifyToken } from "../common/crypto"

@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: { identifier?: string; password?: string }) {
    const id = (body.identifier ?? "").trim().toLowerCase()
    const password = body.password ?? ""

    const users = await this.prisma.user.findMany()
    const user = users.find((u) => u.email.toLowerCase() === id || u.username.toLowerCase() === id)

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new HttpException(
        "Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.",
        HttpStatus.UNAUTHORIZED,
      )
    }

    if (user.status !== "ACTIF") {
      throw new HttpException(
        "Ce compte est désactivé. Contactez l'administrateur.",
        HttpStatus.FORBIDDEN,
      )
    }

    const now = new Date().toISOString()
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: now } })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: user.id,
        action: "CONNEXION",
        entityType: "SESSION",
        entityId: user.id,
        details: null,
        timestamp: now,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user
    return {
      accessToken: signToken(user.id),
      user: { ...safeUser, lastLoginAt: now },
    }
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Headers("authorization") auth?: string) {
    const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null
    const userId = token ? verifyToken(token) : null
    if (!userId) {
      throw new HttpException("Session expirée.", HttpStatus.UNAUTHORIZED)
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.status !== "ACTIF") {
      throw new HttpException("Compte introuvable ou désactivé.", HttpStatus.UNAUTHORIZED)
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user
    return {
      accessToken: signToken(user.id),
      user: { ...safeUser, lastLoginAt: safeUser.lastLoginAt ?? undefined },
    }
  }
}
