import { Module } from "@nestjs/common"
import { PrismaService } from "./prisma/prisma.service"
import { SeedService } from "./seed/seed.service"
import { AuthController } from "./controllers/auth.controller"
import { MissionsController } from "./controllers/missions.controller"
import { EmployeesController } from "./controllers/employees.controller"
import { UsersController } from "./controllers/users.controller"
import { MiscController } from "./controllers/misc.controller"
import { VehiclesController } from "./controllers/vehicles.controller"

@Module({
  controllers: [AuthController, MissionsController, EmployeesController, UsersController, MiscController, VehiclesController],
  providers: [PrismaService, SeedService],
})
export class AppModule {}
