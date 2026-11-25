import { Body, Controller, Get, Headers, HttpException, HttpStatus, Param, Patch, Post } from "@nestjs/common"
import type { Employee } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { getUserIdFromAuthHeader, uid } from "../common/crypto"

function toClientEmployee(e: Employee) {
  return {
    ...e,
    email: e.email ?? undefined,
    address: e.address ?? undefined,
    birthDate: e.birthDate ?? undefined,
    hireDate: e.hireDate ?? undefined,
  }
}

@Controller("employees")
export class EmployeesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const list = await this.prisma.employee.findMany()
    return list.sort((a, b) => a.lastName.localeCompare(b.lastName, "fr")).map(toClientEmployee)
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } })
    if (!emp) throw new HttpException("Employé introuvable.", HttpStatus.NOT_FOUND)
    return toClientEmployee(emp)
  }

  @Post()
  async create(@Body() body: Record<string, any>, @Headers("authorization") auth?: string) {
    const all = await this.prisma.employee.findMany()
    let employeeNumber = String(body.employeeNumber ?? "").trim()

    if (!employeeNumber) {
      let nextNum =
        all.reduce((max, e) => {
          const match = /^EMP-(\d+)$/i.exec(e.employeeNumber)
          return match ? Math.max(max, Number(match[1])) : max
        }, 0) + 1
      do {
        employeeNumber = `EMP-${String(nextNum).padStart(3, "0")}`
        nextNum++
      } while (all.some((e) => e.employeeNumber.toLowerCase() === employeeNumber.toLowerCase()))
    } else if (all.some((e) => e.employeeNumber.toLowerCase() === employeeNumber.toLowerCase())) {
      throw new HttpException("Ce matricule est déjà attribué à un autre employé.", HttpStatus.CONFLICT)
    }

    const now = new Date().toISOString()
    const emp = await this.prisma.employee.create({
      data: {
        id: uid("emp"),
        employeeNumber,
        firstName: body.firstName,
        lastName: body.lastName,
        position: body.position,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        birthDate: body.birthDate || null,
        hireDate: body.hireDate || null,
        status: body.status ?? "ACTIF",
        createdAt: now,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: getUserIdFromAuthHeader(auth),
        action: "EMPLOYE_CREE",
        entityType: "EMPLOYE",
        entityId: emp.id,
        details: null,
        timestamp: now,
      },
    })
    return toClientEmployee(emp)
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: Record<string, any>, @Headers("authorization") auth?: string) {
    const emp = await this.prisma.employee.findUnique({ where: { id } })
    if (!emp) throw new HttpException("Employé introuvable.", HttpStatus.NOT_FOUND)

    const all = await this.prisma.employee.findMany()
    if (all.some((e) => e.id !== id && e.employeeNumber.toLowerCase() === String(body.employeeNumber ?? "").toLowerCase())) {
      throw new HttpException("Ce matricule est déjà attribué à un autre employé.", HttpStatus.CONFLICT)
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        employeeNumber: body.employeeNumber ?? emp.employeeNumber,
        firstName: body.firstName ?? emp.firstName,
        lastName: body.lastName ?? emp.lastName,
        position: body.position ?? emp.position,
        phone: body.phone ?? emp.phone,
        email: body.email !== undefined ? body.email || null : emp.email,
        address: body.address || null,
        birthDate: body.birthDate || null,
        hireDate: body.hireDate || null,
        status: body.status ?? emp.status,
      },
    })
    await this.prisma.auditLog.create({
      data: {
        id: uid("aud"),
        userId: getUserIdFromAuthHeader(auth),
        action: "EMPLOYE_MODIFIE",
        entityType: "EMPLOYE",
        entityId: id,
        details: null,
        timestamp: new Date().toISOString(),
      },
    })
    return toClientEmployee(updated)
  }
}
