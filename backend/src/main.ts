import "reflect-metadata"
import * as fs from "node:fs"
import * as path from "node:path"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env")
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

async function bootstrap() {
  loadEnv()
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("api")
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)
  console.log(`MissionFlow NestJS backend running on http://localhost:${port}/api`)
}

bootstrap()
