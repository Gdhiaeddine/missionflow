import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common"
import { randomUUID } from "node:crypto"
import { PrismaService } from "../prisma/prisma.service"

interface VehicleBody {
  name?: string
  registration?: string
  type?: string
  transportation?: string
}

@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    return this.prisma.vehicle.findMany({ orderBy: { name: "asc" } })
  }

  @Post()
  async create(@Body() body: VehicleBody) {
    const name = body.name?.trim()
    const registration = body.registration?.trim()
    const type = body.type?.trim() || name || ""
    const transportation = body.transportation?.trim() || "VEHICULE_SERVICE"
    if (!name || !registration) {
      throw new BadRequestException("Nom et immatriculation sont requis.")
    }
    const existing = await this.prisma.vehicle.findUnique({ where: { registration } })
    if (existing) return existing

    const now = new Date().toISOString()
    return this.prisma.vehicle.create({
      data: {
        id: randomUUID(),
        name,
        registration,
        type,
        transportation,
        createdAt: now,
        updatedAt: now,
      },
    })
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: VehicleBody) {
    const existing = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException("Véhicule introuvable.")

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        name: body.name?.trim() || existing.name,
        registration: body.registration?.trim() || existing.registration,
        type: body.type?.trim() || existing.type,
        transportation: body.transportation?.trim() || existing.transportation,
        updatedAt: new Date().toISOString(),
      },
    })
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const existing = await this.prisma.vehicle.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException("Véhicule introuvable.")
    await this.prisma.vehicle.delete({ where: { id } })
    return { deleted: true }
  }
}
